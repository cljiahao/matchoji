'use client';

import { useQuery } from '@tanstack/react-query';

import { listRegions } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => listRegions(createClient()),
    staleTime: 5 * 60 * 1000,
  });
}
