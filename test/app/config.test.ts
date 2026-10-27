import { describe, expect, it } from 'vitest';

import nextConfig, { imageSources } from '../../next.config';
import { config as proxyConfig } from '../../proxy';

describe('proxy matcher', () => {
  it('skips the session refresh for the health probe and static files', () => {
    const [pattern] = proxyConfig.matcher;
    const matches = (path: string) => new RegExp(`^${pattern}$`).test(path);
    expect(matches('/explore')).toBe(true);
    expect(matches('/api/health')).toBe(false);
    expect(matches('/_next/static/chunk.js')).toBe(false);
  });
});

describe('security headers', () => {
  it('allow images only from the site, its Supabase project and Google avatars, and forbid framing', async () => {
    const [rule] = (await nextConfig.headers?.()) ?? [];
    const csp = rule.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    expect(csp).toContain(
      "img-src 'self' data: blob: http://supabase.test https://*.googleusercontent.com"
    );
    expect(csp).not.toMatch(/https:(\s|$|;)/);
    expect(csp).toContain("object-src 'none'");
  });

  it('fall back to any https image host without a usable Supabase URL', () => {
    expect(imageSources('https://abc.supabase.co/rest/v1')).toBe(
      "img-src 'self' data: blob: https://abc.supabase.co https://*.googleusercontent.com"
    );
    expect(imageSources(undefined)).toBe("img-src 'self' data: blob: https:");
    expect(imageSources('not a url')).toBe("img-src 'self' data: blob: https:");
  });
});
