'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/integrations/supabase/client';

import { createDrink } from '../api/cafes-mutations';
import type { DrinkOutput } from '../schemas/drink.schema';

// A new row changes what the pickers should list (the adder sees their own pending rows), so
// the cached searches are dropped.
export function useCreateDrink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DrinkOutput) => createDrink(createClient(), input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cafe-search'] }),
        queryClient.invalidateQueries({ queryKey: ['drink-search'] }),
      ]),
  });
}
