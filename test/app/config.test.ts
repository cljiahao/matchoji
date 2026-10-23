import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';
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
  it('allow https and inline-preview images and forbid framing', async () => {
    const [rule] = (await nextConfig.headers?.()) ?? [];
    const csp = rule.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    expect(csp).toContain("img-src 'self' data: blob: https:");
    expect(csp).toContain("object-src 'none'");
  });
});
