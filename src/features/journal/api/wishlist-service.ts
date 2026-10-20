import type { SupabaseClient } from '@supabase/supabase-js';

import type { ProductSummary } from '@/features/products';
import type { Database } from '@/integrations/supabase/database.types';

type Client = SupabaseClient<Database>;

export async function addToWishlist(supabase: Client, userId: string, productId: string) {
  // A double tap or a second tab must not error on the primary key.
  const { error } = await supabase
    .from('wishlist')
    .upsert(
      { user_id: userId, product_id: productId },
      { onConflict: 'user_id,product_id', ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function removeFromWishlist(supabase: Client, userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  if (error) throw error;
}

export async function isWishlisted(
  supabase: Client,
  userId: string,
  productId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('wishlist')
    .select('product_id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function listWishlist(supabase: Client, userId: string): Promise<ProductSummary[]> {
  const { data: rows, error } = await supabase
    .from('wishlist')
    .select('product_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (rows.length === 0) return [];

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, brand, category')
    .in(
      'id',
      rows.map((r) => r.product_id)
    );
  if (productsError) throw productsError;

  const byId = new Map(products.map((p) => [p.id, p]));
  return rows.flatMap((r) => byId.get(r.product_id) ?? []);
}
