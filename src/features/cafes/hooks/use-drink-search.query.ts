'use client';

import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth';
import { useDebouncedValue } from '@/hooks';
import { createClient } from '@/integrations/supabase/client';

import { searchDrinks } from '../api/cafes-search';

const SEARCH_DEBOUNCE_MS = 250;

// A café's menu is short, so unlike the café search it lists drinks before anything is typed.
export function useDrinkSearch(cafeId: string, query: string) {
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const userId = useSession().session?.user.id;

  const result = useQuery({
    queryKey: ['drink-search', cafeId, debouncedQuery, userId],
    queryFn: () => searchDrinks(createClient(), cafeId, debouncedQuery),
    // The flow mounts this before a café is chosen.
    enabled: cafeId !== '',
    retry: 1,
  });

  const isSearching = cafeId !== '' && (debouncedQuery !== query || result.isFetching);

  return { ...result, isSearching };
}
