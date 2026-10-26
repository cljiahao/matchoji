import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const exchangeCodeForSession = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession } }),
}));

import { GET } from '@/app/auth/callback/route';

const callback = (query: string) =>
  GET(new NextRequest(`http://localhost:3000/auth/callback${query}`));

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  exchangeCodeForSession.mockResolvedValue({ error: null });
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
});
