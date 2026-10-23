import type { SupabaseClient } from '@supabase/supabase-js';

import type { ProductSummary } from '@/features/products';
import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import type { ListingOutput } from '../schemas';
import type { Listing, ProductOffer, VendorListing } from '../types';
import { toVendor } from './vendor-service';

type Client = SupabaseClient<Database>;
type ListingRow = Database['public']['Tables']['listings']['Row'];

const COLUMNS = 'id, vendor_id, product_id, price, currency, stock, url, updated_at';

// numeric arrives as a string from PostgREST, so price is coerced.
const toListing = (
  row: Pick<ListingRow, 'id' | 'product_id' | 'price' | 'currency' | 'stock' | 'url' | 'updated_at'>
): Listing => ({
  id: row.id,
  productId: row.product_id,
  price: Number(row.price),
  currency: row.currency,
  stock: row.stock,
  url: row.url,
  updatedAt: row.updated_at,
});

const toColumns = (values: ListingOutput) => ({
  product_id: values.productId,
  price: values.price,
  currency: values.currency,
  stock: values.stock,
  url: values.url,
});

export async function listVendorListings(
  supabase: Client,
  vendorId: string
): Promise<VendorListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(COLUMNS)
    .eq('vendor_id', vendorId)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  const { data: products, error: productsError } = await selectIn(
    [...new Set(data.map((r) => r.product_id))],
    (ids) => supabase.from('products').select('id, name, brand, category').in('id', ids)
  );
  if (productsError) throw productsError;
  const byId = new Map(products.map((p) => [p.id, p]));
  return data.map((row) => ({ ...toListing(row), product: byId.get(row.product_id) ?? null }));
}

export async function saveListing(
  supabase: Client,
  vendorId: string,
  values: ListingOutput,
  listingId?: string
): Promise<Listing> {
  const query = listingId
    ? supabase.from('listings').update(toColumns(values)).eq('id', listingId)
    : supabase.from('listings').insert({ vendor_id: vendorId, ...toColumns(values) });
  const { data, error } = await query.select(COLUMNS).single();
  if (error) throw error;
  return toListing(data);
}

export async function deleteListing(supabase: Client, listingId: string): Promise<void> {
  const { error } = await supabase.from('listings').delete().eq('id', listingId);
  if (error) throw error;
}

// RLS returns only approved vendors' listings to the public, so no status filter is needed
// here. In-stock offers lead; prices are only compared within one currency.
export async function listProductOffers(
  supabase: Client,
  productId: string
): Promise<ProductOffer[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(COLUMNS)
    .eq('product_id', productId);
  if (error) throw error;
  if (data.length === 0) return [];

  const { data: vendors, error: vendorsError } = await selectIn(
    [...new Set(data.map((r) => r.vendor_id))],
    (ids) =>
      supabase
        .from('vendors')
        .select('id, name, profile_info, website, country, ships_to, status')
        .eq('status', 'approved')
        .in('id', ids)
  );
  if (vendorsError) throw vendorsError;
  const byId = new Map(vendors.map((v) => [v.id, toVendor(v)]));

  return data
    .flatMap((row) => {
      const vendor = byId.get(row.vendor_id);
      return vendor
        ? [
            {
              ...toListing(row),
              vendor: {
                id: vendor.id,
                name: vendor.name,
                country: vendor.country,
                shipsTo: vendor.shipsTo,
                website: vendor.website,
              },
            },
          ]
        : [];
    })
    .sort(
      (a, b) =>
        Number(b.stock > 0) - Number(a.stock > 0) ||
        a.currency.localeCompare(b.currency) ||
        a.price - b.price
    );
}

// The approved catalogue, for the listing form's tea picker; small enough to send as one list.
export async function listCatalogue(supabase: Client): Promise<ProductSummary[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, category')
    .eq('status', 'approved')
    .order('name');
  if (error) throw error;
  return data;
}
