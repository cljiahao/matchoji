'use client';

import { useMutation } from '@tanstack/react-query';

import { createProduct, type ProductOutput } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

export function useCreateProduct() {
  return useMutation({
    mutationFn: (input: ProductOutput) => createProduct(createClient(), input),
  });
}
