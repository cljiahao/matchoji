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

// Vivino-style ends of each scale: the average sits between two plain-language poles.
export const TASTE_POLES: Record<TasteAttribute, readonly [string, string]> = {
  body: ['Light', 'Full'],
  sweetness: ['Dry', 'Sweet'],
  umami: ['Mild', 'Savoury'],
  bitterness: ['Smooth', 'Bitter'],
};

// Shown in this order on the product page: body first, as Vivino leads with Light–Bold.
export const TASTE_STRUCTURE_ORDER: readonly TasteAttribute[] = [
  'body',
  'sweetness',
  'umami',
  'bitterness',
];

export interface FlavorFamily {
  id: string;
  name: string;
  notes: readonly string[];
}

// Notes grouped the way tasters talk about them, so mentions add up per family.
export const FLAVOR_FAMILIES: Record<ProductCategory, readonly FlavorFamily[]> = {
  matcha: [
    { id: 'green', name: 'green', notes: ['grassy', 'vegetal', 'marine'] },
    { id: 'savoury', name: 'savoury', notes: ['umami'] },
    { id: 'sweet', name: 'sweet', notes: ['creamy', 'sweet', 'nutty'] },
    { id: 'floral', name: 'floral', notes: ['floral'] },
    { id: 'bitter', name: 'bitter', notes: ['bitter', 'astringent'] },
  ],
  hojicha: [
    { id: 'roast', name: 'roasted', notes: ['roasty', 'smoky', 'toasted-rice'] },
    { id: 'sweet', name: 'sweet', notes: ['caramel', 'chocolate', 'malty', 'sweet'] },
    { id: 'nutty', name: 'nutty', notes: ['nutty', 'woody', 'earthy'] },
  ],
};
