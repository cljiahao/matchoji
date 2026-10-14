'use client';

import { useQuery } from '@tanstack/react-query';

import { searchProducts } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['product-search', query],
    queryFn: () => searchProducts(createClient(), query),
    enabled: query.trim().length >= 2,
    // Interactive: a failing search should fall through to "add as new" quickly rather
    // than spin through the default three backed-off retries.
    retry: 1,
  });
}
