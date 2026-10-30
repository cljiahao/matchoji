import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const exchangeCodeForSession = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession } }),
}));

import { GET } from '@/app/auth/callback/route';

const callback = (query: string, headers: Record<string, string> = {}) =>
  GET(new NextRequest(`http://localhost:3000/auth/callback${query}`, { headers }));

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  exchangeCodeForSession.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /auth/callback', () => {
  it('exchanges the code and returns to the requested page', async () => {
    const response = await callback('?code=abc&next=/products/p1%23rate');

    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc');
    expect(response.headers.get('location')).toBe('http://localhost:3000/products/p1#rate');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('refuses to redirect off-site', async () => {
    const response = await callback('?code=abc&next=@evil.com');
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('sends failed exchanges to the error page', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error('bad code') });
    const response = await callback('?code=abc');
    expect(response.headers.get('location')).toBe('http://localhost:3000/auth/error');
  });

  it('sends requests without a code to the error page', async () => {
    const response = await callback('');
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe('http://localhost:3000/auth/error');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('ignores a spoofed x-forwarded-host when proxies are trusted', async () => {
    vi.stubEnv('TRUST_PROXY', '1');
    const spoofed = { 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https' };

    const success = await callback('?code=abc&next=/products/p1', spoofed);
    expect(success.headers.get('location')).toBe('http://localhost:3000/products/p1');

    exchangeCodeForSession.mockResolvedValue({ error: new Error('bad code') });
    const failure = await callback('?code=abc', spoofed);
    expect(failure.headers.get('location')).toBe('http://localhost:3000/auth/error');
  });

  it('honours forwarded headers that name the configured site host', async () => {
    vi.stubEnv('TRUST_PROXY', '1');
    const response = await callback('?code=abc', {
      'x-forwarded-host': 'localhost:3000',
      'x-forwarded-proto': 'https',
    });
    expect(response.headers.get('location')).toBe('https://localhost:3000/');
  });

  it('does not read x-forwarded-host when proxies are not trusted', async () => {
    const response = await callback('?code=abc', { 'x-forwarded-host': 'evil.example' });
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });
});
