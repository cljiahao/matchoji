import { beforeEach, describe, expect, it } from 'vitest';

import { clearReviewDraft, loadReviewDraft, saveReviewDraft } from './review-draft';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  private items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}

describe('review draft', () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('round-trips a draft for the same product', () => {
    saveReviewDraft('p1', { stars: 4, notes: 'nutty' }, storage);
    expect(loadReviewDraft('p1', storage)).toEqual({ stars: 4, notes: 'nutty' });
  });

  it('keeps drafts per product', () => {
    saveReviewDraft('p1', { stars: 4, notes: '' }, storage);
    expect(loadReviewDraft('p2', storage)).toBeNull();
  });

  it('clears a draft', () => {
    saveReviewDraft('p1', { stars: 4, notes: '' }, storage);
    clearReviewDraft('p1', storage);
    expect(loadReviewDraft('p1', storage)).toBeNull();
  });

  // sessionStorage is user-editable, so what comes back is untrusted input.
  it('ignores tampered or malformed drafts', () => {
    storage.setItem('matchoji:review-draft:p1', '{"stars":9}');
    expect(loadReviewDraft('p1', storage)).toBeNull();
    storage.setItem('matchoji:review-draft:p1', 'not json');
    expect(loadReviewDraft('p1', storage)).toBeNull();
  });

  it('survives storage that throws (private mode, blocked site data)', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => saveReviewDraft('p1', { stars: 3, notes: '' }, broken)).not.toThrow();
    expect(loadReviewDraft('p1', broken)).toBeNull();
    expect(() => clearReviewDraft('p1', broken)).not.toThrow();
  });
});
