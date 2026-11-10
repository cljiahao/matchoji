import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';
import { isMissingTable } from '@/integrations/supabase/missing-table';

type Client = SupabaseClient<Database>;

export interface MyProfile {
  email: string;
  displayName: string;
  isPublic: boolean;
}

export async function getMyProfile(supabase: Client, userId: string): Promise<MyProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, display_name, is_public')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { email: data.email, displayName: data.display_name, isPublic: data.is_public }
    : null;
}

// The only profile field a user may change (column grants); the database caps it at 40.
export async function updateDisplayName(
  supabase: Client,
  userId: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', userId);
  if (error) throw error;
}

// Everything Matchoji holds about the signed-in person, as plain JSON they can keep.
export async function exportMyData(supabase: Client, userId: string) {
  const [profile, tastings, wishlist, stock, shop, cafes, drinks] = await Promise.all([
    supabase
      .from('profiles')
      .select('email, display_name, created_at')
      .eq('id', userId)
      .maybeSingle(),
    supabase.from('reviews').select('*').eq('user_id', userId).order('tasted_on'),
    supabase.from('wishlist').select('product_id, created_at').eq('user_id', userId),
    supabase.from('stock_reports').select('product_id, status, created_at').eq('user_id', userId),
    supabase.from('vendors').select('*').eq('user_id', userId).maybeSingle(),
    // cafes and drinks hide added_by and the review fields from direct selects; the adder's own
    // rows, with those fields, come from these views.
    supabase.from('my_cafes').select('*').eq('added_by', userId),
    supabase.from('my_drinks').select('*').eq('added_by', userId),
  ]);
  for (const result of [profile, tastings, wishlist, stock, shop])
    if (result.error) throw result.error;
  // Until the café migration is applied there is nothing of theirs to export.
  for (const result of [cafes, drinks])
    if (result.error && !isMissingTable(result.error)) throw result.error;
  return {
    exportedAt: new Date().toISOString(),
    profile: profile.data,
    tastings: tastings.data,
    wantToTry: wishlist.data,
    stockReports: stock.data,
    shop: shop.data,
    cafesAdded: cafes.data ?? [],
    drinksAdded: drinks.data ?? [],
  };
}

// Removes the person's photos through the Storage API (deleting storage rows in SQL would
// leave the files behind), then the account itself, then signs them out.
export async function deleteMyAccount(supabase: Client, userId: string): Promise<void> {
  const photos = supabase.storage.from('review-photos');
  const { data: files, error: listError } = await photos.list(userId, { limit: 1000 });
  if (listError) throw listError;
  if (files.length > 0) {
    const { error } = await photos.remove(files.map((f) => `${userId}/${f.name}`));
    if (error) throw error;
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
