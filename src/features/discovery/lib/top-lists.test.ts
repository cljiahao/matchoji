import { describe, expect, it } from 'vitest';

import type { CatalogueTea } from '@/features/products';

import { tea } from '../test-utils';
import { buildTopLists, findTopList, regionSlug } from './top-lists';

const rated = (count: number, overrides: Partial<CatalogueTea> & { perGram?: number } = {}) =>
  Array.from({ length: count }, (_, i) =>
    tea({ avgStars: 4.5 - i * 0.1, reviewCount: 5, perGram: 1 + i * 0.2, ...overrides })
  );

describe('regionSlug', () => {
  it('makes a URL-safe slug', () => {
    expect(regionSlug('Uji, Kyoto')).toBe('from-uji-kyoto');
    expect(regionSlug('Ōita')).toBe('from-oita');
    expect(regionSlug('京都')).toBe('from-region');
  });
});

describe('buildTopLists', () => {
  it('is empty with nothing rated', () => {
    expect(buildTopLists([])).toEqual([]);
    expect(buildTopLists(rated(6, { avgStars: null, reviewCount: 0 }))).toEqual([]);
  });

  it('hides a list until 5 teas have 3 ratings each', () => {
    const four = rated(4, { category: 'matcha', reviewCount: 3 });
    const thin = tea({ category: 'matcha', avgStars: 5, reviewCount: 2 });
    expect(buildTopLists([...four, thin]).map((l) => l.slug)).toEqual([]);
    const five = rated(5, { category: 'matcha', reviewCount: 3 });
    expect(buildTopLists(five).map((l) => l.slug)).toContain('matcha');
  });

  it('ranks by weighted score, not a single rating', () => {
    const teas = rated(5, { category: 'matcha', reviewCount: 10 });
    const lucky = tea({ category: 'matcha', avgStars: 5, reviewCount: 1 });
    const list = buildTopLists([...teas, lucky]).find((l) => l.slug === 'matcha');
    expect(list?.teas.map((r) => r.tea.id)).not.toContain(lucky.id);
    expect(list?.teas[0].tea.id).toBe(teas[0].id);
  });

  it('builds category, value and region lists independently', () => {
    const matcha = rated(6, { category: 'matcha', regionId: 'uji', regionName: 'Uji' });
    const hojicha = rated(5, { category: 'hojicha' });
    const slugs = buildTopLists([...matcha, ...hojicha]).map((l) => l.slug);
    expect(slugs).toEqual([
      'matcha',
      'hojicha',
      'best-value-matcha',
      'best-value-hojicha',
      'from-uji',
    ]);
  });

  it('leaves out a value list whose teas lack ratings or prices, and a thin region', () => {
    const unpriced = rated(6, { category: 'matcha', regionId: 'nishio', regionName: 'Nishio' }).map(
      (t) => ({ ...t, price: null })
    );
    const few = rated(4, { category: 'matcha', regionId: 'x', regionName: 'Elsewhere' });
    const slugs = buildTopLists([...unpriced, ...few]).map((l) => l.slug);
    expect(slugs).toEqual(['matcha', 'from-nishio']);
  });

  it('caps a list at 20 teas', () => {
    const list = buildTopLists(rated(30, { category: 'matcha' }))[0];
    expect(list.teas).toHaveLength(20);
  });
});

describe('findTopList', () => {
  it('finds a visible list and is null for a hidden or unknown one', () => {
    const teas = rated(5, { category: 'matcha' });
    expect(findTopList(teas, 'matcha')?.title).toBe('Top matcha');
    expect(findTopList(teas, 'hojicha')).toBeNull();
    expect(findTopList(teas, 'nope')).toBeNull();
  });
});
