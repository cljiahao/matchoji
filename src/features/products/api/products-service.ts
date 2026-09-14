import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ProductCategory } from '@/integrations/supabase/database.types';

import type { Product, ProductSummary } from '../types';

type Client = SupabaseClient<Database>;

interface ProductRow {
  id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
  grade: string | null;
  region_id: string | null;
  image_url: string | null;
  created_at: string;
}

// product_ratings is a view and regions is a separate table — neither is embedded via
// PostgREST relationship syntax here (that needs full FK metadata this hand-written
// Database type doesn't carry), so both are fetched separately and merged in code.
async function hydrateProducts(supabase: Client, rows: ProductRow[]): Promise<Product[]> {
  if (rows.length === 0) return [];

  const regionIds = [...new Set(rows.map((r) => r.region_id).filter((id) => id !== null))];
  const productIds = rows.map((r) => r.id);

  const [{ data: regions }, { data: ratings }] = await Promise.all([
    regionIds.length > 0
      ? supabase.from('regions').select('id, name').in('id', regionIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from('product_ratings').select('*').in('product_id', productIds),
  ]);

  const regionNameById = new Map(regions?.map((r) => [r.id, r.name]));
  const ratingByProductId = new Map(ratings?.map((r) => [r.product_id, r]));

  const products: Product[] = rows.map((row) => {
    const rating = ratingByProductId.get(row.id);
    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      category: row.category,
      grade: row.grade,
      regionName: row.region_id ? (regionNameById.get(row.region_id) ?? null) : null,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      avgStars: rating?.avg_stars ?? null,
      reviewCount: rating?.review_count ?? 0,
    };
  });

  // Rated products first (highest average first), then unrated products by recency.
  return products.sort((a, b) => {
    if (a.avgStars === null && b.avgStars === null) return 0;
    if (a.avgStars === null) return 1;
    if (b.avgStars === null) return -1;
    return b.avgStars - a.avgStars;
  });
}

export async function listProducts(
  supabase: Client,
  category?: ProductCategory
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('id, name, brand, category, grade, region_id, image_url, created_at')
    .order('created_at', { ascending: false });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;

  return hydrateProducts(supabase, data);
}

export async function getProduct(supabase: Client, id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, category, grade, region_id, image_url, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [product] = await hydrateProducts(supabase, [data]);
  return product;
}

export async function listRegions(supabase: Client): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('regions').select('id, name').order('name');
  if (error) throw error;
  return data;
}

export async function searchProducts(supabase: Client, query: string): Promise<ProductSummary[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, category')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
    .limit(10);

  if (error) throw error;
  return data;
}
