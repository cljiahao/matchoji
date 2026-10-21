import type { ProductCategory } from '@/features/products';

// Stored as slugs so the lists can grow or be relabelled without migrating rows.
export const FLAVOR_NOTES: Record<ProductCategory, readonly string[]> = {
  matcha: [
    'umami',
    'grassy',
    'creamy',
    'sweet',
    'vegetal',
    'marine',
    'nutty',
    'floral',
    'bitter',
    'astringent',
  ],
  hojicha: [
    'roasty',
    'caramel',
    'nutty',
    'chocolate',
    'woody',
    'smoky',
    'sweet',
    'earthy',
    'toasted-rice',
    'malty',
  ],
};

export const ALL_FLAVOR_NOTES: readonly string[] = [
  ...new Set([...FLAVOR_NOTES.matcha, ...FLAVOR_NOTES.hojicha]),
];

export const MAX_FLAVOR_NOTES = 6;

export const PREP_METHODS = [
  'usucha',
  'koicha',
  'latte',
  'iced',
  'cold-brew',
  'steeped',
  'other',
] as const;
export type PrepMethod = (typeof PREP_METHODS)[number];

export const PREP_METHOD_LABELS: Record<PrepMethod, string> = {
  usucha: 'Usucha',
  koicha: 'Koicha',
  latte: 'Latte',
  iced: 'Iced',
  'cold-brew': 'Cold brew',
  steeped: 'Steeped',
  other: 'Other',
};

export const TASTE_ATTRIBUTES = ['sweetness', 'umami', 'bitterness', 'body'] as const;
export type TasteAttribute = (typeof TASTE_ATTRIBUTES)[number];

export const TASTE_ATTRIBUTE_LABELS: Record<TasteAttribute, string> = {
  sweetness: 'Sweetness',
  umami: 'Umami',
  bitterness: 'Bitterness',
  body: 'Body',
};

export function noteLabel(slug: string): string {
  const words = slug.replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
