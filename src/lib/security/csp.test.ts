import { describe, expect, it } from 'vitest';

import { buildCsp, generateNonce, imageSources } from './csp';

const supabaseUrl = 'https://abc.supabase.co';

describe('buildCsp', () => {
  it('in production sets a nonce-based script-src and keeps every other directive', () => {
    const csp = buildCsp({ nonce: 'abc123', isDev: false, supabaseUrl });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain(imageSources(supabaseUrl));
  });

  it('in dev allows eval for React refresh and drops frame-ancestors', () => {
    const csp = buildCsp({ nonce: 'abc123', isDev: true, supabaseUrl });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic' 'unsafe-eval'");
    expect(csp).not.toContain('frame-ancestors');
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain(imageSources(supabaseUrl));
  });
});

describe('generateNonce', () => {
  it('returns a fresh base64 value each call', () => {
    const a = generateNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(generateNonce()).not.toBe(a);
  });
});
