import { describe, expect, it } from 'vitest';

import { safeNextPath } from './safe-next-path';

describe('safeNextPath', () => {
  it('keeps same-origin paths with query and hash', () => {
    expect(safeNextPath('/products/abc?rate=1#rate')).toBe('/products/abc?rate=1#rate');
  });

  it('falls back to home when missing', () => {
    expect(safeNextPath(null)).toBe('/');
  });

  // `${origin}${next}` with these would leave the site: "@evil.com" becomes userinfo,
  // "//evil.com" and "/\evil.com" are protocol-relative to browsers.
  it.each(['@evil.com', '//evil.com', '/\\evil.com', 'https://evil.com', 'evil.com', ''])(
    'rejects %j',
    (next) => {
      expect(safeNextPath(next)).toBe('/');
    }
  );
});
