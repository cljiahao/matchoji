import { describe, expect, it } from 'vitest';

import { loadFonts } from './fonts';

describe('loadFonts', () => {
  it('loads Figtree at 400, 700 and 800 from disk, once', async () => {
    const fonts = await loadFonts();
    expect(fonts.map((f) => [f.name, f.weight])).toEqual([
      ['Figtree', 400],
      ['Figtree', 700],
      ['Figtree', 800],
    ]);
    for (const f of fonts) expect(f.data.byteLength).toBeGreaterThan(10_000);
    expect(await loadFonts()).toBe(fonts);
  });
});
