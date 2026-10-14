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
  },
];

export const MOCK_REVIEWS: Record<string, Review[]> = {
  'mock-1': [
    {
      id: 'mock-review-1',
      productId: 'mock-1',
      reviewerEmail: 'taster@example.com',
      stars: 5,
      notes: 'Umami-forward, smooth finish, no bitterness even whisked thin.',
      photoUrl: null,
      createdAt: '2026-09-05T00:00:00.000Z',
    },
    {
      id: 'mock-review-2',
      productId: 'mock-1',
      reviewerEmail: 'greentea.fan@example.com',
      stars: 4,
      notes:
        'Great everyday ceremonial grade, a step below the top-tier single-cultivar picks. ' +
        'Whisked at 70°C with 2g to 70ml it foams easily and holds a fine, stable crema. ' +
        'The front palate is sweet and creamy, then a gentle vegetal note comes through, ' +
        'closer to steamed spinach than cut grass. Finish is clean and lingers a while. ' +
        'As a latte it gets lost behind oat milk, so I would keep it for usucha.',
      photoUrl: null,
      createdAt: '2026-09-06T00:00:00.000Z',
    },
  ],
  'mock-2': [
    {
      id: 'mock-review-3',
      productId: 'mock-2',
      reviewerEmail: 'roastfan@example.com',
      stars: 4,
      notes: 'Nutty and toasty, good as a bedtime cup — low caffeine.',
      photoUrl: null,
      createdAt: '2026-09-07T00:00:00.000Z',
    },
  ],
  'mock-3': [
    {
      id: 'mock-review-4',
      productId: 'mock-3',
      reviewerEmail: 'newbie@example.com',
      stars: 4,
      notes: 'Solid, slightly grassy.',
      photoUrl: null,
      createdAt: '2026-09-08T00:00:00.000Z',
    },
  ],
  'mock-4': [],
};

export function getMockProducts(category?: 'matcha' | 'hojicha'): Product[] {
  return category ? MOCK_PRODUCTS.filter((p) => p.category === category) : MOCK_PRODUCTS;
}

export function getMockProduct(id: string): Product | null {
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
}

export function getMockReviews(productId: string): Review[] {
  return MOCK_REVIEWS[productId] ?? [];
}
