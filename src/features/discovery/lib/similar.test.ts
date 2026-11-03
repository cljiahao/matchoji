import { describe, expect, it } from 'vitest';

import type { TeaFeatures } from '@/features/taste';

import { rankSimilar, type SimilarCandidate } from './similar';

const features = (id: string, overrides: Partial<TeaFeatures> = {}): TeaFeatures => ({
  id,
  name: id,
  category: 'matcha',
  grade: null,
  regionId: null,
  sliders: {},
  notes: {},
  ...overrides,
});
const candidate = (
  id: string,
  overrides: Partial<TeaFeatures> = {},
  reviewCount = 0
): SimilarCandidate => ({ id, name: id, reviewCount, features: features(id, overrides) });

describe('rankSimilar', () => {
  const target = features('target', {
    grade: 'ceremonial',
    regionId: 'uji',
    sliders: { sweetness: 4, umami: 4 },
  });

  it('ranks same grade first, then same region, then closest taste', () => {
    const ranked = rankSimilar(target, [
      candidate('neither'),
      candidate('region', { regionId: 'uji' }),
      candidate('grade', { grade: 'ceremonial' }),
      candidate('both', { grade: 'ceremonial', regionId: 'uji' }),
    ]);
    expect(ranked.map((c) => c.id)).toEqual(['both', 'grade', 'region', 'neither']);
  });

  it('orders otherwise level teas by taste closeness, with no taste data last', () => {
    const ranked = rankSimilar(target, [
      candidate('none'),
      candidate('far', { sliders: { sweetness: 1, umami: 1 } }),
      candidate('near', { sliders: { sweetness: 4, umami: 5 } }),
    ]);
    expect(ranked.map((c) => c.id)).toEqual(['near', 'far', 'none']);
  });

  it('works with no ratings or taste: category, then known-ness, then name', () => {
    const bare = features('bare');
    const ranked = rankSimilar(bare, [
      candidate('b', {}, 0),
      candidate('a', {}, 0),
      candidate('popular', {}, 12),
    ]);
    expect(ranked.map((c) => c.id)).toEqual(['popular', 'a', 'b']);
  });

  it('leaves out the tea itself and other categories, and caps the list', () => {
    const many = Array.from({ length: 12 }, (_, i) => candidate(`m${String(i).padStart(2, '0')}`));
    const ranked = rankSimilar(target, [
      candidate('target'),
      candidate('hoji', { category: 'hojicha' }),
      ...many,
    ]);
    expect(ranked).toHaveLength(8);
    expect(ranked.map((c) => c.id)).not.toContain('target');
    expect(ranked.map((c) => c.id)).not.toContain('hoji');
  });

  it('is empty when nothing else shares the category', () => {
    expect(rankSimilar(target, [candidate('hoji', { category: 'hojicha' })])).toEqual([]);
  });
});
