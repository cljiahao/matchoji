import { reviewSchema, type ReviewOutput } from '../schemas/review.schema';
import {
  clearDraft,
  defaultStorage,
  loadDraft,
  saveDraft,
  type DraftStorage,
} from './session-draft';

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
