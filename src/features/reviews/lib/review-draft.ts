import type { ProductCategory } from '@/features/products';

import { reviewSchema, type ReviewOutput } from '../schemas/review.schema';
import {
  clearDraft,
  defaultStorage,
  loadDraft,
  saveDraft,
  type DraftStorage,
} from './session-draft';
import { FLAVOR_NOTES } from './tasting-vocab';

// The photo is not kept: a File can't survive serialising.
const key = (productId: string) => `matchoji:review-draft:${productId}`;

export function saveReviewDraft(
  productId: string,
  draft: ReviewOutput,
  storage: DraftStorage | null = defaultStorage()
): void {
  saveDraft(key(productId), draft, storage);
}

export function loadReviewDraft(
  productId: string,
  storage: DraftStorage | null = defaultStorage()
): ReviewOutput | null {
  return loadDraft(key(productId), reviewSchema, storage);
}

export function clearReviewDraft(
  productId: string,
  storage: DraftStorage | null = defaultStorage()
): void {
  clearDraft(key(productId), storage);
}

// A draft can predate a category fix or come from another product's form; notes the picker
// can't show would block submit with nothing to remove, so they are dropped on restore.
export function draftForCategory(draft: ReviewOutput, category: ProductCategory): ReviewOutput {
  if (!draft.flavorNotes) return draft;
  return {
    ...draft,
    flavorNotes: draft.flavorNotes.filter((n) => FLAVOR_NOTES[category].includes(n)),
  };
}
