import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

import type { VendorOutput } from '../schemas';
import type { Vendor } from '../types';

type Client = SupabaseClient<Database>;
type VendorRow = Database['public']['Tables']['vendors']['Row'];

const COLUMNS = 'id, name, profile_info, website, country, ships_to, status';

export function toVendor(
  row: Pick<
    VendorRow,
    'id' | 'name' | 'profile_info' | 'website' | 'country' | 'ships_to' | 'status'
  >
): Vendor {
  return {
    id: row.id,
    name: row.name,
    profileInfo: row.profile_info,
    website: row.website,
    country: row.country,
    shipsTo: row.ships_to,
    status: row.status,
  };
}

const toColumns = (values: VendorOutput) => ({
  name: values.name,
  profile_info: values.profileInfo ?? null,
  website: values.website ?? null,
  country: values.country,
  ships_to: values.shipsTo,
});

// RLS lets a user read their own shop at any status, so this also finds a pending application.
export async function getMyVendor(supabase: Client, userId: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select(COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? toVendor(data) : null;
}

// The row starts pending; only an admin can approve it (see the marketplace migration).
export async function applyAsVendor(
  supabase: Client,
  userId: string,
  values: VendorOutput
): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .insert({ user_id: userId, ...toColumns(values) })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toVendor(data);
}

export async function updateVendor(
  supabase: Client,
  vendorId: string,
  values: VendorOutput
): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .update(toColumns(values))
    .eq('id', vendorId)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toVendor(data);
}
