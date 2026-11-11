'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/integrations/supabase/client';

import { createCafe } from '../api/cafes-mutations';
import type { CafeOutput } from '../schemas/cafe.schema';

// A new row changes what the pickers should list (the adder sees their own pending rows), so
// the cached searches are dropped.
export function useCreateCafe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CafeOutput) => createCafe(createClient(), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cafe-search'] }),
  });
}
