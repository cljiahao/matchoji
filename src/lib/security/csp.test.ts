import { describe, expect, it } from 'vitest';

import { OSM_TILE_HOST, buildCsp, generateNonce, imageSources } from './csp';

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

describe('buildCsp with Sentry', () => {
  it('needs no Sentry host: events go through the same-origin tunnel', () => {
    const csp = buildCsp({ nonce: 'abc123', isDev: false, supabaseUrl });
    expect(csp).not.toMatch(/sentry/i);
    expect(csp).not.toContain('connect-src');
  });
});

describe('buildCsp with maps', () => {
  it('allows OpenStreetMap tiles as images and nothing wider', () => {
    const csp = buildCsp({ nonce: 'abc123', isDev: false, supabaseUrl });
    expect(csp).toContain(
      `img-src 'self' data: blob: ${supabaseUrl} https://*.googleusercontent.com ${OSM_TILE_HOST}`
    );
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toMatch(/style-src|connect-src|default-src/);
  });

  it('keeps the permissive https fallback when there is no Supabase URL', () => {
    expect(imageSources(undefined)).toBe("img-src 'self' data: blob: https:");
  });
});

describe('generateNonce', () => {
  it('returns a fresh base64 value each call', () => {
    const a = generateNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(generateNonce()).not.toBe(a);
  });
});
