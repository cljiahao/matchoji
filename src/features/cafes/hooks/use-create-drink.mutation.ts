'use client';

import { useMutation } from '@tanstack/react-query';

import { createClient } from '@/integrations/supabase/client';

import { createDrink } from '../api/cafes-mutations';
import type { DrinkOutput } from '../schemas/drink.schema';

export function useCreateDrink() {
  return useMutation({ mutationFn: (input: DrinkOutput) => createDrink(createClient(), input) });
}
