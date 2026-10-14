import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ssr = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  createBrowserClient: vi.fn(),
}));
vi.mock('@supabase/ssr', () => ssr);

const cookieStore = vi.hoisted(() => ({
  getAll: vi.fn(() => [{ name: 'sb', value: '1' }]),
  set: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { createClient as createBrowser } from './client';
import { updateSession } from './middleware';
import { createClient as createServer } from './server';

type CookieOptions = {
  cookies: {
    getAll: () => unknown;
    setAll: (c: { name: string; value: string; options?: object }[]) => void;
  };
};

function lastOptions(): CookieOptions {
  return ssr.createServerClient.mock.calls.at(-1)![2] as CookieOptions;
}

beforeEach(() => {
  vi.clearAllMocks();
  ssr.createServerClient.mockReturnValue({ auth: { getUser: vi.fn().mockResolvedValue({}) } });
});

describe('browser client', () => {
  it('is created from the public env vars', () => {
    createBrowser();
    expect(ssr.createBrowserClient).toHaveBeenCalledWith('http://supabase.test', 'test-anon-key');
  });
});

describe('server client', () => {
  it('reads and writes the request cookie store', async () => {
    await createServer();
    const { cookies } = lastOptions();

    expect(cookies.getAll()).toEqual([{ name: 'sb', value: '1' }]);
    cookies.setAll([{ name: 'sb', value: '2', options: { path: '/' } }]);
    expect(cookieStore.set).toHaveBeenCalledWith('sb', '2', { path: '/' });
  });

  // Server Components cannot set cookies; the proxy refreshes the session instead.
  it('swallows cookie writes that Next.js rejects', async () => {
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error('read-only');
    });
    await createServer();
    expect(() => lastOptions().cookies.setAll([{ name: 'sb', value: '2' }])).not.toThrow();
  });
});

describe('updateSession', () => {
  it('refreshes the session and copies refreshed cookies onto the response', async () => {
    const request = new NextRequest('http://localhost/', { headers: { cookie: 'sb=1' } });
    ssr.createServerClient.mockImplementation((_url, _key, options: CookieOptions) => ({
      auth: {
        getUser: vi.fn(async () => {
          expect(options.cookies.getAll()).toEqual([{ name: 'sb', value: '1' }]);
          options.cookies.setAll([{ name: 'sb', value: 'fresh', options: { path: '/' } }]);
        }),
      },
    }));

    const response = await updateSession(request);

    expect(request.cookies.get('sb')?.value).toBe('fresh');
    expect(response.cookies.get('sb')?.value).toBe('fresh');
  });
});
