import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Database,
  ProductCategory,
  ProductStatus,
} from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

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
  shop_url: string | null;
  status: ProductStatus;
  added_by: string | null;
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

  const [regionsResult, ratingsResult] = await Promise.all([
    selectIn(regionIds, (ids) =>
      supabase.from('regions').select('id, name, matcha_supply, hojicha_supply').in('id', ids)
    ),
    selectIn(productIds, (ids) =>
      supabase.from('product_ratings').select('*').in('product_id', ids)
    ),
  ]);

  // A failed lookup must not look like "unrated" or "no region"; let the page's error state show.
  if (regionsResult.error) throw regionsResult.error;
  if (ratingsResult.error) throw ratingsResult.error;
  const regionById = new Map(regionsResult.data.map((r) => [r.id, r]));
  const ratingByProductId = new Map(ratingsResult.data.map((r) => [r.product_id, r]));

  const products = rows.map((row) => {
    const region = row.region_id ? regionById.get(row.region_id) : undefined;
    return applyRating(
      {
        id: row.id,
        name: row.name,
        brand: row.brand,
        category: row.category,
        grade: row.grade,
        regionName: region?.name ?? null,
        supply: region?.[`${row.category}_supply`] ?? null,
        imageUrl: row.image_url,
        shopUrl: row.shop_url,
        status: row.status,
        addedBy: row.added_by,
        createdAt: row.created_at,
      },
      ratingByProductId.get(row.id)
    );
  });

  if (!withTopNotes) return sortByRating(products);

  // Only rated products can have notes; skip the read entirely for an unrated feed.
  const rated = products.filter((p) => p.reviewCount > 0).map((p) => p.id);
  if (rated.length === 0) return sortByRating(products);
  const { data: noteRows, error } = await selectIn(rated, (ids) =>
    supabase.from('latest_reviews').select('product_id, flavor_notes').in('product_id', ids)
  );
  if (error) throw error;
  const notes = topNotesByProduct(noteRows);
  return sortByRating(products.map((p) => ({ ...p, topNotes: notes.get(p.id) ?? [] })));
}

export async function listProducts(supabase: Client, filters: DiscoverFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(
      'id, name, brand, category, grade, region_id, image_url, shop_url, status, added_by, created_at'
    )
    .eq('status', 'approved')
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
    .select(
      'id, name, brand, category, grade, region_id, image_url, shop_url, status, added_by, created_at'
    )
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
    supabase
      .from('regions')
      .select('id, name, prefecture, scarcity_note, matcha_supply, hojicha_supply'),
    supabase
      .from('products')
      .select('region_id, category')
      .eq('status', 'approved')
      .not('region_id', 'is', null),
  ]);
  if (regions.error) throw regions.error;
  if (products.error) throw products.error;
  return summarizeRegions(regions.data, products.data);
}

const SEARCH_LIMIT = 10;

// The tea picker in "Log a tasting": approved teas, plus the searcher's own teas still
// awaiting review, so logging one again does not create a duplicate. Other people's pending
// teas stay out, like Vivino's unmatched scans. PostgREST allows one `or` per query, so the
// ownership test runs here on a slightly larger page.
export async function searchProducts(
  supabase: Client,
  query: string,
  userId?: string
): Promise<ProductSummary[]> {
  const filter = buildSearchFilter(query);
  if (!filter) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, category, status, added_by')
    .or(filter)
    .neq('status', 'rejected')
    .limit(SEARCH_LIMIT * 2);

  if (error) throw error;
  return data
    .filter((p) => p.status === 'approved' || (userId !== undefined && p.added_by === userId))
    .slice(0, SEARCH_LIMIT)
    .map(({ id, name, brand, category }) => ({ id, name, brand, category }));
}
