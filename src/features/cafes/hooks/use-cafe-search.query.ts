'use client';

import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth';
import { useDebouncedValue } from '@/hooks';
import { createClient } from '@/integrations/supabase/client';

import { searchCafes } from '../api/cafes-search';

const SEARCH_DEBOUNCE_MS = 250;

export function useCafeSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const searchable = query.trim().length >= 2;
  const userId = useSession().session?.user.id;

  const result = useQuery({
    // Keyed by user: the results include the searcher's own cafés awaiting review.
    queryKey: ['cafe-search', debouncedQuery, userId],
    queryFn: () => searchCafes(createClient(), debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    retry: 1,
  });

  // Covers the debounce window too, so "no results" is never read for a query not yet sent.
  const isSearching = searchable && (debouncedQuery !== query || result.isFetching);

  return { ...result, isSearching };
}
