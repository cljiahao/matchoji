import type { JournalEntry } from '@/features/journal';

import { makeReview } from './render';

type EntryOverrides = Partial<Omit<JournalEntry, 'product'>> & {
  product?: Partial<JournalEntry['product']>;
};

export function makeEntry({ product, ...rest }: EntryOverrides = {}): JournalEntry {
  return {
    ...makeReview(),
    regionName: null,
    product: { id: 'p1', name: 'Uji', brand: null, category: 'matcha', ...product },
    ...rest,
  };
}
