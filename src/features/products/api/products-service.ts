import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ProductCategory } from '@/integrations/supabase/database.types';

import type { Product, ProductSummary } from '../types';

import type { DiscoverFilters } from '../lib/discover-params';
import { sortProducts } from '../lib/sort-products';
import { summarizeRegions, type RegionSummary } from '../lib/summarize-regions';
import { applyRating, sortByRating, topNotesByProduct } from './product-ratings';
import { buildSearchFilter } from './search-filter';

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
async function hydrateProducts(
  supabase: Client,
  rows: ProductRow[],
  { withTopNotes = false } = {}
): Promise<Product[]> {
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

  const products = rows.map((row) =>
    applyRating(
      {
        id: row.id,
        name: row.name,
        brand: row.brand,
        category: row.category,
        grade: row.grade,
        regionName: row.region_id ? (regionNameById.get(row.region_id) ?? null) : null,
        imageUrl: row.image_url,
        createdAt: row.created_at,
      },
      ratingByProductId.get(row.id)
    )
  );

  if (!withTopNotes) return sortByRating(products);

  // Only rated products can have notes; skip the read entirely for an unrated feed.
  const rated = products.filter((p) => p.reviewCount > 0).map((p) => p.id);
  if (rated.length === 0) return sortByRating(products);
  const { data: noteRows, error } = await supabase
    .from('reviews')
    .select('product_id, flavor_notes')
    .in('product_id', rated);
  if (error) throw error;
  const notes = topNotesByProduct(noteRows);
  return sortByRating(products.map((p) => ({ ...p, topNotes: notes.get(p.id) ?? [] })));
}

export async function listProducts(supabase: Client, filters: DiscoverFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('id, name, brand, category, grade, region_id, image_url, created_at')
    .order('created_at', { ascending: false });

  const search = filters.q ? buildSearchFilter(filters.q) : null;
  if (search) query = query.or(search);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.regionId) query = query.eq('region_id', filters.regionId);

  const { data, error } = await query;
  if (error) throw error;

  return sortProducts(await hydrateProducts(supabase, data, { withTopNotes: true }), filters.sort);
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

export async function listRegionSummaries(supabase: Client): Promise<RegionSummary[]> {
  const [regions, products] = await Promise.all([
    supabase.from('regions').select('id, name, prefecture, scarcity_note'),
    supabase.from('products').select('region_id, category').not('region_id', 'is', null),
  ]);
  if (regions.error) throw regions.error;
  if (products.error) throw products.error;
  return summarizeRegions(regions.data, products.data);
}

export async function searchProducts(supabase: Client, query: string): Promise<ProductSummary[]> {
  const filter = buildSearchFilter(query);
  if (!filter) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, category')
    .or(filter)
    .limit(10);

  if (error) throw error;
  return data;
}
