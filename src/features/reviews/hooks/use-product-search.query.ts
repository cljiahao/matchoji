'use client';

import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth';
import { searchProducts } from '@/features/products';
import { useDebouncedValue } from '@/hooks';
import { createClient } from '@/integrations/supabase/client';

// Long enough to skip intermediate keystrokes, short enough to feel live.
const SEARCH_DEBOUNCE_MS = 250;

export function useProductSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const searchable = query.trim().length >= 2;
  const userId = useSession().session?.user.id;

  const result = useQuery({
    queryKey: ['product-search', debouncedQuery, userId],
    // Keyed by user: the results include the searcher's own teas awaiting review.
    queryFn: () => searchProducts(createClient(), debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    // Interactive: a failing search should fall through to "add as new" quickly rather
    // than spin through the default three backed-off retries.
    retry: 1,
  });

  // Covers the debounce window too, so callers never read "no results" for a query
  // that hasn't been sent yet.
  const isSearching = searchable && (debouncedQuery !== query || result.isFetching);

  return { ...result, isSearching };
}
