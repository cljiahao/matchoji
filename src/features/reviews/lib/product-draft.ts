import { productSchema, type ProductOutput } from '@/features/products/schemas/product.schema';

import {
  clearDraft,
  defaultStorage,
  loadDraft,
  saveDraft,
  type DraftStorage,
} from './session-draft';

// A new product typed by a signed-out visitor, kept across Google sign-in (products are
// insertable only by authenticated users).
const KEY = 'matchoji:product-draft';

export function saveProductDraft(
  draft: ProductOutput,
  storage: DraftStorage | null = defaultStorage()
): void {
  saveDraft(KEY, draft, storage);
}

export function loadProductDraft(
  storage: DraftStorage | null = defaultStorage()
): ProductOutput | null {
  return loadDraft(KEY, productSchema, storage);
}

export function clearProductDraft(storage: DraftStorage | null = defaultStorage()): void {
  clearDraft(KEY, storage);
}
