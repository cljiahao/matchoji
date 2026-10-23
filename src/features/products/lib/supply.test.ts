import { describe, expect, it } from 'vitest';

import { supplyRank, type SupplyLevel } from './supply';

describe('supplyRank', () => {
  it('ranks scarce before tight before plentiful, and unknown last', () => {
    const levels: (SupplyLevel | null)[] = [null, 'plentiful', 'scarce', 'tight'];
    expect(levels.map(supplyRank)).toEqual([3, 2, 0, 1]);
  });
});
