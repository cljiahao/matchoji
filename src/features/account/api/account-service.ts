import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';
import { isMissingTable } from '@/integrations/supabase/missing-table';

import { profileDetailsSchema, type ProfileDetailsInput } from '../schemas';

type Client = SupabaseClient<Database>;

export interface MyProfile {
  email: string;
  displayName: string;
  isPublic: boolean;
  instagramHandle: string | null;
  bio: string | null;
}

export async function getMyProfile(supabase: Client, userId: string): Promise<MyProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, display_name, is_public, instagram_handle, bio')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data
    ? {
        email: data.email,
        displayName: data.display_name,
        isPublic: data.is_public,
        instagramHandle: data.instagram_handle,
        bio: data.bio,
      }
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

// Handle and bio are the other two columns a user may write (column grants). The schema is the
// boundary: the database re-checks both, but a bad value should fail before the round trip.
export async function updateProfileDetails(
  supabase: Client,
  userId: string,
  input: ProfileDetailsInput
): Promise<void> {
  const { instagramHandle, bio } = profileDetailsSchema.parse(input);
  const { error } = await supabase
    .from('profiles')
    .update({ instagram_handle: instagramHandle, bio })
    .eq('id', userId);
  if (error) throw error;
}

// Everything Matchoji holds about the signed-in person, as plain JSON they can keep. Tea and
// drink reviews share the reviews table; the journal is those reviews plus the want-to-try list.
// shop_locations and tea_price_history are left out on purpose: they have no per-user column.
export async function exportMyData(supabase: Client, userId: string) {
  const [
    profile,
    tastings,
    wishlist,
    stock,
    shop,
    likes,
    comments,
    following,
    blocked,
    lessons,
    reports,
    notifications,
    scans,
    teas,
    cafes,
    drinks,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'email, display_name, is_public, instagram_handle, bio, is_trusted_taster, created_at'
      )
      .eq('id', userId)
      .maybeSingle(),
    supabase.from('reviews').select('*').eq('user_id', userId).order('tasted_on'),
    supabase.from('wishlist').select('*').eq('user_id', userId),
    supabase.from('stock_reports').select('product_id, status, created_at').eq('user_id', userId),
    supabase.from('vendors').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('review_likes').select('*').eq('user_id', userId),
    supabase.from('review_comments').select('*').eq('user_id', userId),
    supabase.from('follows').select('*').eq('follower_id', userId),
    supabase.from('blocks').select('*').eq('blocker_id', userId),
    supabase.from('lesson_progress').select('*').eq('user_id', userId),
    supabase.from('content_reports').select('*').eq('reporter_id', userId),
    supabase.from('notifications').select('*').eq('user_id', userId),
    supabase.from('label_scans').select('*').eq('user_id', userId),
    supabase.from('products').select('*').eq('added_by', userId),
    // cafes and drinks hide added_by and the review fields from direct selects; the adder's own
    // rows, with those fields, come from these views.
    supabase.from('my_cafes').select('*').eq('added_by', userId),
    supabase.from('my_drinks').select('*').eq('added_by', userId),
  ]);
  for (const result of [
    profile,
    tastings,
    wishlist,
    stock,
    shop,
    likes,
    comments,
    following,
    blocked,
    lessons,
    reports,
    notifications,
    scans,
    teas,
  ])
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
    likes: likes.data,
    comments: comments.data,
    following: following.data,
    blocked: blocked.data,
    lessonProgress: lessons.data,
    reportsFiled: reports.data,
    notifications: notifications.data,
    labelScans: scans.data,
    teasAdded: teas.data,
    cafesAdded: cafes.data ?? [],
    drinksAdded: drinks.data ?? [],
  };
}

export interface DeleteAccountResult {
  // False when some photo files could not be removed after the account was already gone.
  photosRemoved: boolean;
}

// The account goes first: removing photos beforehand would strip a person who then fails to
// delete. The file list is read before the delete (read-only), the files are removed after,
// through the Storage API (deleting storage rows in SQL would leave the files behind). Cleanup
// is best effort once the account is gone, and the person is signed out either way.
export async function deleteMyAccount(
  supabase: Client,
  userId: string
): Promise<DeleteAccountResult> {
  const photos = supabase.storage.from('review-photos');
  const listed = await photos.list(userId, { limit: 1000 });
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;

  let photosRemoved = !listed.error;
  if (!listed.error && listed.data.length > 0) {
    const removed = await photos
      .remove(listed.data.map((f) => `${userId}/${f.name}`))
      .catch((e: unknown) => ({ error: e }));
    photosRemoved = !removed.error;
  }
  await supabase.auth.signOut().catch(() => undefined);
  return { photosRemoved };
}
