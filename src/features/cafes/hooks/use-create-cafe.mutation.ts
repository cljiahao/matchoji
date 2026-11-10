'use client';

import { useMutation } from '@tanstack/react-query';

import { createClient } from '@/integrations/supabase/client';

import { createCafe } from '../api/cafes-mutations';
import type { CafeOutput } from '../schemas/cafe.schema';

export function useCreateCafe() {
  return useMutation({ mutationFn: (input: CafeOutput) => createCafe(createClient(), input) });
}
