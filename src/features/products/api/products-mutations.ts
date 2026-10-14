import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

import type { ProductOutput } from '../schemas/product.schema';
import type { ProductSummary } from '../types';

export async function createProduct(
  supabase: SupabaseClient<Database>,
  input: ProductOutput
): Promise<ProductSummary> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      brand: input.brand ?? null,
      category: input.category,
      grade: input.grade ?? null,
      region_id: input.regionId ?? null,
    })
    .select('id, name, brand, category')
    .single();

  if (error) throw error;
  return data;
}
