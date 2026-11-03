import { describe, expect, it } from 'vitest';

import { tea } from '../test-utils';
import { buildHighlights } from './highlights';

// Six rated hojicha from Uji: scores fall with the index, so teas[0] is best.
function group() {
  return [4.8, 4.6, 4.4, 4.2, 4.0, 3.8].map((avgStars, i) =>
    tea({
      category: 'hojicha',
      grade: 'Roasted',
      regionId: 'uji',
      regionName: 'Uji',
      avgStars,
      reviewCount: 20 - i,
    })
  );
}

describe('buildHighlights', () => {
  it('names the best tea of its category, region and grade, at most three lines', () => {
    const teas = group();
    expect(buildHighlights(teas[0], teas)).toEqual([
      'Highest rated hojicha on Matchoji',
      'Highest rated from Uji',
      'Most rated roasted hojicha',
    ]);
  });

  it('uses a percentage tier when the tea is near the top but not first', () => {
    const teas = group();
    // 2 of 6 is 33%: no tier fits. Add teas so 2nd of 10 falls in the top 25%.
    const more = [3.7, 3.6, 3.5, 3.4].map((avgStars) =>
      tea({ category: 'hojicha', avgStars, reviewCount: 6 })
    );
    expect(buildHighlights(teas[1], [...teas, ...more])).toEqual([
      'Top 25% of hojicha on Matchoji',
    ]);
    expect(buildHighlights(teas[1], teas)).toEqual([]);
  });

  it('says nothing for a tea with fewer than 5 ratings', () => {
    const teas = group();
    const thin = { ...teas[0], reviewCount: 4 };
    expect(buildHighlights(thin, [thin, ...teas.slice(1)])).toEqual([]);
  });

  it('says nothing when the comparison group has fewer than 5 qualifying teas', () => {
    const teas = group().slice(0, 4);
    expect(buildHighlights(teas[0], teas)).toEqual([]);
  });

  it('does not claim a lead the tea shares', () => {
    const teas = group();
    const twin = {
      ...teas[1],
      id: 'twin',
      avgStars: teas[0].avgStars,
      reviewCount: teas[0].reviewCount,
    };
    expect(buildHighlights(teas[0], [...teas, twin])).not.toContain(
      'Highest rated hojicha on Matchoji'
    );
  });
});
