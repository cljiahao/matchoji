import { reviewSchema, type ReviewOutput } from '../schemas/review.schema';

// Google sign-in is a full-page redirect, so an in-progress rating would be lost. The
// draft (minus the photo, which a File can't survive serialising) waits here meanwhile.
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const key = (productId: string) => `matchoji:review-draft:${productId}`;

function defaultStorage(): DraftStorage | null {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export function saveReviewDraft(
  productId: string,
  draft: ReviewOutput,
  storage: DraftStorage | null = defaultStorage()
): void {
  try {
    storage?.setItem(key(productId), JSON.stringify(draft));
  } catch {
    // Storage blocked: sign-in still proceeds, the user just re-enters the rating.
  }
}

export function loadReviewDraft(
  productId: string,
  storage: DraftStorage | null = defaultStorage()
): ReviewOutput | null {
  try {
    const raw = storage?.getItem(key(productId));
    if (!raw) return null;
    const parsed = reviewSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearReviewDraft(
  productId: string,
  storage: DraftStorage | null = defaultStorage()
): void {
  try {
    storage?.removeItem(key(productId));
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
