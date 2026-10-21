// Dev-only fixture data, rendered only when isSupabaseConfigured() is false — lets the UI be
// visually verified before a real Supabase project exists. Delete this file once one does.
import type { Product } from '@/features/products/types';
import type { Review } from '@/features/reviews/types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'mock-1',
    name: 'Uji Ceremonial',
    brand: 'Marukyu Koyamaen',
    category: 'matcha',
    grade: 'Ceremonial',
    regionName: 'Uji, Kyoto',
    imageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    avgStars: 4.5,
    reviewCount: 12,
    topNotes: ['creamy', 'umami'],
  },
  {
    id: 'mock-2',
    name: 'Kyoto Roasted Bancha',
    brand: 'Ippodo',
    category: 'hojicha',
    grade: 'Bancha',
    regionName: 'Kyoto',
    imageUrl: null,
    createdAt: '2026-09-02T00:00:00.000Z',
    avgStars: 4.2,
    reviewCount: 8,
    topNotes: ['roasty', 'nutty'],
  },
  {
    id: 'mock-3',
    name: 'Yame Single-Origin',
    brand: 'Yamecha Kobo',
    category: 'matcha',
    grade: 'Premium',
    regionName: 'Yame, Fukuoka',
    imageUrl: null,
    createdAt: '2026-09-03T00:00:00.000Z',
    avgStars: 3.8,
    reviewCount: 3,
    topNotes: [],
  },
  {
    id: 'mock-4',
    name: 'Kukicha Roast',
    brand: null,
    category: 'hojicha',
    grade: null,
    regionName: null,
    imageUrl: null,
    createdAt: '2026-09-04T00:00:00.000Z',
    avgStars: null,
    reviewCount: 0,
    topNotes: [],
  },
];

export const MOCK_REVIEWS: Record<string, Review[]> = {
  'mock-1': [
    {
      id: 'mock-review-1',
      productId: 'mock-1',
      reviewerName: 'taster',
      stars: 5,
      notes: 'Umami-forward, smooth finish, no bitterness even whisked thin.',
      photoUrl: null,
      createdAt: '2026-09-05T00:00:00.000Z',
      flavorNotes: ['umami', 'creamy', 'sweet'],
      profile: { sweetness: 4, umami: 5, bitterness: 1, body: 4 },
      prep: { method: 'usucha', doseG: 2, waterMl: 70, waterTempC: 80 },
      tastedOn: '2026-09-05',
    },
    {
      id: 'mock-review-2',
      productId: 'mock-1',
      reviewerName: 'greentea.fan',
      stars: 4,
      notes:
        'Great everyday ceremonial grade, a step below the top-tier single-cultivar picks. ' +
        'Whisked at 70°C with 2g to 70ml it foams easily and holds a fine, stable crema. ' +
        'The front palate is sweet and creamy, then a gentle vegetal note comes through, ' +
        'closer to steamed spinach than cut grass. Finish is clean and lingers a while. ' +
        'As a latte it gets lost behind oat milk, so I would keep it for usucha.',
      photoUrl: null,
      createdAt: '2026-09-06T00:00:00.000Z',
      flavorNotes: ['vegetal', 'creamy'],
      profile: { sweetness: 3, umami: 4, bitterness: 2, body: 3 },
      prep: { method: 'usucha', doseG: 2, waterMl: 70, waterTempC: 70 },
      tastedOn: '2026-09-06',
    },
  ],
  'mock-2': [
    {
      id: 'mock-review-3',
      productId: 'mock-2',
      reviewerName: 'roastfan',
      stars: 4,
      notes: 'Nutty and toasty, good as a bedtime cup — low caffeine.',
      photoUrl: null,
      createdAt: '2026-09-07T00:00:00.000Z',
      flavorNotes: ['roasty', 'nutty', 'caramel'],
      profile: { sweetness: 3, bitterness: 1, body: 2 },
      prep: { method: 'steeped', doseG: 5, waterMl: 300, waterTempC: 95 },
      tastedOn: '2026-09-07',
    },
  ],
  'mock-3': [
    {
      id: 'mock-review-4',
      productId: 'mock-3',
      reviewerName: 'newbie',
      stars: 4,
      notes: 'Solid, slightly grassy.',
      photoUrl: null,
      createdAt: '2026-09-08T00:00:00.000Z',
      flavorNotes: ['grassy'],
      profile: {},
      prep: { method: null, doseG: null, waterMl: null, waterTempC: null },
      tastedOn: '2026-09-08',
    },
  ],
  'mock-4': [],
};

// Score and count come from the mock reviews, so a page's hero, histogram and "based on N
// tastings" agree with each other the way the real rating view guarantees.
function withReviewStats(product: Product): Product {
  const reviews = MOCK_REVIEWS[product.id] ?? [];
  const total = reviews.reduce((sum, r) => sum + r.stars, 0);
  return {
    ...product,
    reviewCount: reviews.length,
    avgStars: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : null,
  };
}

// Matches name or brand case-insensitively, like the real search, so Explore can be checked
// against mock data too.
export function getMockProducts(category?: 'matcha' | 'hojicha', q?: string): Product[] {
  const term = q?.trim().toLowerCase();
  return MOCK_PRODUCTS.filter((p) => !category || p.category === category)
    .filter((p) => !term || `${p.name} ${p.brand ?? ''}`.toLowerCase().includes(term))
    .map(withReviewStats);
}

export function getMockProduct(id: string): Product | null {
  const product = MOCK_PRODUCTS.find((p) => p.id === id);
  return product ? withReviewStats(product) : null;
}

export function getMockReviews(productId: string): Review[] {
  return MOCK_REVIEWS[productId] ?? [];
}
