import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

import type { ShopValues } from '../schemas';
import type { Shop } from '../types';

type Client = SupabaseClient<Database>;

type ShopRow = Database['public']['Tables']['shop_locations']['Row'];

// Postgres "undefined table" and PostgREST's schema-cache miss: the migration is applied by
// hand, so pages show no shops rather than an error until it is.
const MISSING_TABLE = new Set(['42P01', 'PGRST205']);

const COLUMNS = 'id, brand, name, kind, address, city, country, lat, lng, source_url, checked_at';

function toShop(
  row: Pick<
    ShopRow,
    | 'id'
    | 'brand'
    | 'name'
    | 'kind'
    | 'address'
    | 'city'
    | 'country'
    | 'lat'
    | 'lng'
    | 'source_url'
    | 'checked_at'
  >
): Shop {
  const { source_url, checked_at, ...rest } = row;
  return { ...rest, sourceUrl: source_url, checkedAt: checked_at };
}

export async function listShops(supabase: Client): Promise<Shop[]> {
  const { data, error } = await supabase
    .from('shop_locations')
    .select(COLUMNS)
    .order('country')
    .order('city')
    .order('name');
  if (error) {
    if (error.code && MISSING_TABLE.has(error.code)) return [];
    throw error;
  }
  return data.map(toShop);
}

// Whether a maker has any listed shop, for the tea page's "where to buy in person" link.
export async function hasShopsForBrand(supabase: Client, brand: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('shop_locations')
    .select('id', { count: 'exact', head: true })
    .ilike('brand', brand.replace(/[\\%_]/g, '\\$&'));
  if (error) {
    if (error.code && MISSING_TABLE.has(error.code)) return false;
    throw error;
  }
  return (count ?? 0) > 0;
}

const toRow = (v: ShopValues) => ({
  brand: v.brand,
  name: v.name,
  kind: v.kind,
  address: v.address,
  city: v.city,
  country: v.country,
  lat: v.lat,
  lng: v.lng,
  source_url: v.sourceUrl,
  checked_at: new Date().toISOString().slice(0, 10),
});

export async function createShop(supabase: Client, values: ShopValues): Promise<void> {
  const { error } = await supabase.from('shop_locations').insert(toRow(values));
  if (error) throw error;
}

export async function updateShop(supabase: Client, id: string, values: ShopValues): Promise<void> {
  const { error } = await supabase.from('shop_locations').update(toRow(values)).eq('id', id);
  if (error) throw error;
}

export async function deleteShop(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from('shop_locations').delete().eq('id', id);
  if (error) throw error;
}
