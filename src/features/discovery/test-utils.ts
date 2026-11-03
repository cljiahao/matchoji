import type { CatalogueTea } from '@/features/products';

let counter = 0;

// A catalogue tea with sensible defaults; override only what the test is about.
export function tea(overrides: Partial<CatalogueTea> & { perGram?: number } = {}): CatalogueTea {
  counter += 1;
  const { perGram, ...rest } = overrides;
  return {
    id: `tea-${counter}`,
    name: `Tea ${counter}`,
    brand: null,
    category: 'matcha',
    grade: null,
    regionId: null,
    regionName: null,
    supply: null,
    imageUrl: null,
    imageCredit: null,
    shopUrl: null,
    status: 'approved',
    addedBy: null,
    reviewNote: null,
    mergedInto: null,
    createdAt: '2026-01-01T00:00:00Z',
    avgStars: null,
    reviewCount: 0,
    topNotes: [],
    price: perGram === undefined ? null : { sgd: perGram * 30, packGrams: 30, perGram, band: null },
    ...rest,
  };
}
