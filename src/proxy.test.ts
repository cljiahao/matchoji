import { describe, expect, it } from 'vitest';

import { config } from './proxy';

// Next anchors a matcher at both ends.
const matcher = new RegExp(`^${config.matcher[0]}$`);

describe('proxy matcher', () => {
  it.each([
    '/opengraph-image',
    '/opengraph-image-1a2b3c',
    '/products/11111111-1111-4111-8111-111111111111/opengraph-image',
    '/products/11111111-1111-4111-8111-111111111111/opengraph-image-1a2b3c',
    '/u/22222222-2222-4222-8222-222222222222/opengraph-image-9z',
    '/twitter-image',
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/apple-icon.png',
    '/api/health',
  ])('skips %s so crawlers fetch it with no session', (path) => {
    expect(matcher.test(path)).toBe(false);
  });

  it.each([
    '/',
    '/explore',
    '/products/11111111-1111-4111-8111-111111111111',
    '/u/abc',
    '/account',
  ])('still runs for the page %s', (path) => {
    expect(matcher.test(path)).toBe(true);
  });
});
