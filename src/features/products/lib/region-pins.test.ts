import { describe, expect, it } from 'vitest';

import { REGION_COORDINATES, regionPins } from './region-pins';
import type { RegionSummary } from './summarize-regions';

const region = (over: Partial<RegionSummary>): RegionSummary => ({
  id: 'r1',
  name: 'Uji, Kyoto',
  prefecture: 'Kyoto',
  scarcityNote: null,
  supply: { matcha: null, hojicha: null },
  counts: { matcha: 0, hojicha: 0 },
  ...over,
});

describe('regionPins', () => {
  it('has real coordinates for every seeded region', () => {
    for (const { lat, lng } of Object.values(REGION_COORDINATES)) {
      expect(lat).toBeGreaterThan(30);
      expect(lat).toBeLessThan(37);
      expect(lng).toBeGreaterThan(129);
      expect(lng).toBeLessThan(140);
    }
  });

  it('counts teas, tones by the larger category and links to the region', () => {
    const [pin] = regionPins([region({ counts: { matcha: 8, hojicha: 3 } })]);
    expect(pin).toMatchObject({ text: '11', tone: 'matcha', name: 'Uji, Kyoto', flagged: false });
    expect(pin.description).toBe('8 matcha, 3 hojicha');
    expect(pin.href).toContain('region');
  });

  it('keeps the pin a compact count and flags scarce supply in its description', () => {
    const [pin] = regionPins([
      region({ counts: { matcha: 1, hojicha: 2 }, supply: { matcha: 'scarce', hojicha: 'tight' } }),
    ]);
    expect(pin.text).toBe('3');
    expect(pin.flagged).toBe(true);
    expect(pin.tone).toBe('hojicha');
    expect(pin.description).toContain('Matcha supply scarce');
  });

  it('stays neutral on a tie and says when a region has no teas', () => {
    const [pin] = regionPins([region({})]);
    expect(pin).toMatchObject({ text: '0', tone: 'neutral', flagged: false });
    expect(pin.description).toBe('No teas yet');
  });

  it('leaves out a region it has no coordinates for', () => {
    expect(regionPins([region({ name: 'Somewhere new' })])).toEqual([]);
  });
});
