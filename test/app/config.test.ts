import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { proxy, config as proxyConfig } from '@/proxy';
import nextConfig, { imageSources } from '../../next.config';

vi.mock('@/integrations/supabase/middleware', () => ({
  updateSession: vi.fn(async () => NextResponse.next()),
}));

describe('proxy matcher', () => {
  it('skips the session refresh for the health probe and static files', () => {
    const [pattern] = proxyConfig.matcher;
    const matches = (path: string) => new RegExp(`^${pattern}$`).test(path);
    expect(matches('/explore')).toBe(true);
    expect(matches('/api/health')).toBe(false);
    expect(matches('/_next/static/chunk.js')).toBe(false);
  });
});

describe('proxy CSP', () => {
  it('sets a fresh nonce-based CSP on the request and the response, keeping the old directives', async () => {
    const request = new NextRequest('http://localhost/explore');
    const response = await proxy(request);
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    const nonce = request.headers.get('x-nonce') ?? '';
    expect(nonce).not.toBe('');
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(request.headers.get('Content-Security-Policy')).toBe(csp);

    const second = new NextRequest('http://localhost/explore');
    await proxy(second);
    expect(second.headers.get('x-nonce')).not.toBe(nonce);
  });
});

describe('security headers', () => {
  it('leave the CSP to proxy.ts and still forbid framing', async () => {
    const [rule] = (await nextConfig.headers?.()) ?? [];
    expect(rule.headers.find((h) => h.key === 'Content-Security-Policy')).toBeUndefined();
    expect(rule.headers).toContainEqual({ key: 'X-Frame-Options', value: 'DENY' });
  });

  it('fall back to any https image host without a usable Supabase URL', () => {
    expect(imageSources('https://abc.supabase.co/rest/v1')).toBe(
      "img-src 'self' data: blob: https://abc.supabase.co https://*.googleusercontent.com"
    );
    expect(imageSources(undefined)).toBe("img-src 'self' data: blob: https:");
    expect(imageSources('not a url')).toBe("img-src 'self' data: blob: https:");
  });
});
