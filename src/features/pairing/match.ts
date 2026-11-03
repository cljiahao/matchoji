import type { ProductCategory } from '@/features/products';

import { PAIRING_RULES } from './rules';
import type { PairingRule } from './types';

const MAX_PAIRINGS = 4;

// Grades are the maker's own free text, so this only recognises the words sellers use for
// matcha meant for milk and baking.
const CULINARY_GRADE = /culinary|latte|barista|baking|cooking|kitchen/i;

export function pairingsFor(tea: {
  category: ProductCategory;
  grade: string | null;
}): PairingRule[] {
  const culinary = tea.grade !== null && CULINARY_GRADE.test(tea.grade);
  return PAIRING_RULES.filter(
    (rule) => rule.category === tea.category && (rule.grade === 'any' || !culinary)
  ).slice(0, MAX_PAIRINGS);
}
