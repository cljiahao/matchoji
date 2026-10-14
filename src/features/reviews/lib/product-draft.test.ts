import { beforeEach, describe, expect, it } from 'vitest';

import { clearProductDraft, loadProductDraft, saveProductDraft } from './product-draft';

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

describe('product draft', () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('round-trips the new-product fields', () => {
    saveProductDraft(
      { name: 'Kagoshima Gold', category: 'hojicha', grade: 'First flush' },
      storage
    );
    expect(loadProductDraft(storage)).toEqual({
      name: 'Kagoshima Gold',
      category: 'hojicha',
      grade: 'First flush',
    });
  });

  it('clears the draft', () => {
    saveProductDraft({ name: 'x', category: 'matcha' }, storage);
    clearProductDraft(storage);
    expect(loadProductDraft(storage)).toBeNull();
  });

  it('ignores tampered or malformed drafts', () => {
    storage.setItem('matchoji:product-draft', '{"name":"","category":"sencha"}');
    expect(loadProductDraft(storage)).toBeNull();
    storage.setItem('matchoji:product-draft', '{');
    expect(loadProductDraft(storage)).toBeNull();
  });
});
