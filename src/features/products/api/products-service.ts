import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Database,
  ProductCategory,
  ProductStatus,
} from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import type { Product, ProductSummary } from '../types';

import type { DiscoverFilters } from '../lib/discover-params';
import { gradeOptions } from '../lib/filter-products';
import { toTeaPrice } from '../lib/pricing';
import { summarizeRegions, type RegionSummary } from '../lib/summarize-regions';
import { applyRating, topNotesByProduct } from './product-ratings';
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
  review_note: string | null;
  merged_into: string | null;
  created_at: string;
  price_sgd: number | string | null;
  pack_grams: number | string | null;
}

// product_ratings is a view and regions is a separate table — neither is embedded via
// PostgREST relationship syntax here (that needs full FK metadata this hand-written
// Database type doesn't carry), so both are fetched separately and merged in code. Used for a
// single tea's page, which (unlike the lists) may be one awaiting review.
async function hydrateProduct(supabase: Client, row: ProductRow): Promise<Product> {
  const [regionResult, ratingResult, priceResult] = await Promise.all([
    row.region_id
      ? supabase
          .from('regions')
          .select('id, name, matcha_supply, hojicha_supply')
          .eq('id', row.region_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('product_ratings').select('*').eq('product_id', row.id).maybeSingle(),
    // The band compares approved teas only, so an unpriced or pending tea has none to read.
    row.price_sgd !== null && row.status === 'approved'
      ? supabase.from('tea_prices').select('price_band').eq('product_id', row.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  // A failed lookup must not look like "unrated" or "no region"; let the page's error state show.
  if (regionResult.error) throw regionResult.error;
  if (ratingResult.error) throw ratingResult.error;
  if (priceResult.error) throw priceResult.error;
  const region = regionResult.data;

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
      reviewNote: row.review_note,
      mergedInto: row.merged_into,
      createdAt: row.created_at,
      price: toTeaPrice({ ...row, price_band: priceResult.data?.price_band ?? null }),
    },
    ratingResult.data ?? undefined
  );
}

const CATALOGUE_COLUMNS =
  'id, name, brand, category, grade, region_name, supply, image_url, shop_url, created_at, review_count, avg_stars, price_sgd, pack_grams, price_band';

type CatalogueRow = Pick<
  Database['public']['Views']['catalogue_teas']['Row'],
  | 'id'
  | 'name'
  | 'brand'
  | 'category'
  | 'grade'
  | 'region_name'
  | 'supply'
  | 'image_url'
  | 'shop_url'
  | 'created_at'
  | 'review_count'
  | 'avg_stars'
  | 'price_sgd'
  | 'pack_grams'
  | 'price_band'
>;

// Lists show approved teas only (catalogue_teas filters them), so the review fields are fixed.
function fromCatalogue(row: CatalogueRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    grade: row.grade,
    regionName: row.region_name,
    supply: row.supply,
    imageUrl: row.image_url,
    shopUrl: row.shop_url,
    status: 'approved',
    addedBy: null,
    reviewNote: null,
    mergedInto: null,
    createdAt: row.created_at,
    // numeric can arrive as a string from PostgREST.
    avgStars: row.avg_stars === null ? null : Number(row.avg_stars),
    reviewCount: Number(row.review_count),
    topNotes: [],
    price: toTeaPrice(row),
  };
}

export const PAGE_SIZE = 24;

export interface ProductPage {
  products: Product[];
  // Every match, not just this page: "Showing 1–24 of N".
  total: number;
}

const DESC = { ascending: false, nullsFirst: false } as const;

export async function listProducts(
  supabase: Client,
  filters: DiscoverFilters,
  { limit = PAGE_SIZE } = {}
): Promise<ProductPage> {
  let query = supabase.from('catalogue_teas').select(CATALOGUE_COLUMNS, { count: 'exact' });

  const search = filters.q ? buildSearchFilter(filters.q) : null;
  if (search) query = query.or(search);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.regionId) query = query.eq('region_id', filters.regionId);
  if (filters.grade) query = query.eq('grade_key', filters.grade.trim().toLowerCase());
  if (filters.minRating) query = query.gte('avg_stars', filters.minRating);

  // Each sort is an ORDER BY on catalogue_teas; ties fall back to newest first.
  if (filters.sort === 'reviewed') {
    query = query.order('review_count', DESC).order('avg_stars', DESC);
  } else if (filters.sort === 'newest') {
    query = query.order('created_at', DESC);
  } else if (filters.sort === 'value') {
    query = query
      .order('price_per_gram', { ascending: true, nullsFirst: false })
      .order('created_at', DESC);
  } else {
    if (filters.sort === 'scarce') query = query.order('supply_rank');
    query = query.order('top_rank').order('weighted_score', DESC).order('created_at', DESC);
  }

  const from = ((filters.page ?? 1) - 1) * limit;
  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  const products = data.map(fromCatalogue);
  const total = count ?? products.length;

  // Card notes for this page's rated teas only.
  const rated = products.filter((p) => p.reviewCount > 0).map((p) => p.id);
  if (rated.length === 0) return { products, total };
  // tea_taste_profiles counts every taster's notes, private ones included.
  const { data: profiles, error: notesError } = await selectIn(rated, (ids) =>
    supabase.from('tea_taste_profiles').select('product_id, notes').in('product_id', ids)
  );
  if (notesError) throw notesError;
  const notes = topNotesByProduct(
    profiles.flatMap((p) =>
      Object.entries(p.notes).map(([note, mentions]) => ({
        product_id: p.product_id,
        flavor_notes: Array<string>(mentions).fill(note),
      }))
    )
  );
  return { products: products.map((p) => ({ ...p, topNotes: notes.get(p.id) ?? [] })), total };
}

// The grades among teas matching the search, tea and region (not the grade or rating
// filters), so picking a grade never hides the other grades it could switch to.
export async function listGradeOptions(
  supabase: Client,
  filters: DiscoverFilters
): Promise<string[]> {
  let query = supabase.from('catalogue_teas').select('grade').not('grade', 'is', null);
  const search = filters.q ? buildSearchFilter(filters.q) : null;
  if (search) query = query.or(search);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.regionId) query = query.eq('region_id', filters.regionId);
  const { data, error } = await query;
  if (error) throw error;
  return gradeOptions(data);
}

export async function getProduct(supabase: Client, id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, brand, category, grade, region_id, image_url, shop_url, status, added_by, review_note, merged_into, created_at, price_sgd, pack_grams'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return hydrateProduct(supabase, data);
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

// The tea picker in "Log a tasting": the search_teas function ranks matches by how closely
// they read (pg_trgm), so a typo still finds the tea. It returns approved teas plus the caller's
// own teas awaiting review, so logging one again does not create a duplicate.
export async function searchProducts(supabase: Client, query: string): Promise<ProductSummary[]> {
  if (query.trim().length < 2) return [];
  const { data, error } = await supabase.rpc('search_teas', { q: query });
  if (error) throw error;
  return data;
}
