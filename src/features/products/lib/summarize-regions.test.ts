import { describe, expect, it } from 'vitest';

import { sortRegionsByScarcity, summarizeRegions } from './summarize-regions';
import type { SupplyLevel } from './supply';

const region = (
  id: string,
  name: string,
  scarcity_note: string | null = null,
  matcha_supply: SupplyLevel | null = null,
  hojicha_supply: SupplyLevel | null = null
) => ({ id, name, prefecture: null, scarcity_note, matcha_supply, hojicha_supply });

describe('summarizeRegions', () => {
  it('counts teas per category and leads with the regions that have most', () => {
    const summaries = summarizeRegions(
      [
        region('r1', 'Uji, Kyoto'),
        region('r2', 'Yame, Fukuoka', 'Little hojicha grown', null, 'scarce'),
        region('r3', 'Ise, Mie'),
      ],
      [
        { region_id: 'r2', category: 'matcha' },
        { region_id: 'r2', category: 'hojicha' },
        { region_id: 'r1', category: 'matcha' },
        { region_id: null, category: 'matcha' },
        { region_id: 'gone', category: 'hojicha' },
      ]
    );

    expect(summaries.map((s) => s.name)).toEqual(['Yame, Fukuoka', 'Uji, Kyoto', 'Ise, Mie']);
    expect(summaries[0]).toEqual({
      id: 'r2',
      name: 'Yame, Fukuoka',
      prefecture: null,
      scarcityNote: 'Little hojicha grown',
      supply: { matcha: null, hojicha: 'scarce' },
      counts: { matcha: 1, hojicha: 1 },
    });
    expect(summaries[2].counts).toEqual({ matcha: 0, hojicha: 0 });
  });

  it('orders regions without teas by name', () => {
    expect(
      summarizeRegions([region('b', 'Sayama'), region('a', 'Kagoshima')], []).map((s) => s.name)
    ).toEqual(['Kagoshima', 'Sayama']);
  });

  it('sorts by scarcity: scarcest tea first, then the other tea, then the incoming order', () => {
    const summaries = summarizeRegions(
      [
        region('busy', 'Busy', null, 'tight', null),
        region('unknown', 'Unknown'),
        region('both-tight', 'Both tight', null, 'tight', 'tight'),
        region('scarce', 'Scarce hojicha', null, 'plentiful', 'scarce'),
        region('quiet', 'Quiet', null, 'tight', null),
      ],
      [{ region_id: 'busy', category: 'matcha' }]
    );
    expect(sortRegionsByScarcity(summaries).map((s) => s.id)).toEqual([
      'scarce',
      'both-tight',
      'busy',
      'quiet',
      'unknown',
    ]);
  });
});
