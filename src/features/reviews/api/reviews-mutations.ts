import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

import { localToday } from '../lib/local-date';
import type { ReviewOutput } from '../schemas/review.schema';

type Client = SupabaseClient<Database>;

export interface UploadedPhoto {
  path: string;
  publicUrl: string;
}

// The stored name is random plus a short extension: the visitor's own file name (which can
// hold personal details or odd characters) never reaches a public URL.
function photoPath(userId: string, file: File): string {
  const ext = /\.([a-z0-9]{1,5})$/i.exec(file.name)?.[1]?.toLowerCase();
  const suffix = ext ? '.' + ext : '';
  return `${userId}/${crypto.randomUUID()}${suffix}`;
}

export async function uploadReviewPhoto(
  supabase: Client,
  userId: string,
  file: File
): Promise<UploadedPhoto> {
  const path = photoPath(userId, file);

  const { error } = await supabase.storage.from('review-photos').upload(path, file);
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('review-photos').getPublicUrl(path);

  return { path, publicUrl };
}

// Best effort: a photo whose review failed to save is removed so it does not linger.
export async function removeReviewPhoto(supabase: Client, path: string): Promise<void> {
  await supabase.storage.from('review-photos').remove([path]);
}

interface CreateReviewInput extends ReviewOutput {
  productId: string;
  userId: string;
  photoUrl?: string;
}

export async function createReview(supabase: Client, input: CreateReviewInput): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    product_id: input.productId,
    user_id: input.userId,
    stars: input.stars,
    notes: input.notes ?? null,
    photo_url: input.photoUrl ?? null,
    flavor_notes: input.flavorNotes ?? [],
    sweetness: input.sweetness ?? null,
    umami: input.umami ?? null,
    bitterness: input.bitterness ?? null,
    body: input.body ?? null,
    prep_method: input.prepMethod ?? null,
    dose_g: input.doseG ?? null,
    water_ml: input.waterMl ?? null,
    water_temp_c: input.waterTempC ?? null,
    harvest_year: input.harvestYear ?? null,
    flush: input.flush ?? null,
    // Always the taster's own date: the column default is the database's (UTC) day, which
    // is yesterday for a morning tasting in Singapore.
    tasted_on: input.tastedOn ?? localToday(),
  });

  if (error) throw error;
}

// The path inside review-photos, from a stored public URL; null for anything else.
export function reviewPhotoPath(url: string | null): string | null {
  const marker = '/storage/v1/object/public/review-photos/';
  const at = url?.indexOf(marker) ?? -1;
  return url && at >= 0 ? url.slice(at + marker.length) : null;
}

type ReviewFields = Omit<CreateReviewInput, 'productId' | 'userId'>;

// RLS lets only the author update or delete a tasting; who wrote it and which tea it is are
// not editable (column grants).
export async function updateReview(
  supabase: Client,
  reviewId: string,
  input: ReviewFields
): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({
      stars: input.stars,
      notes: input.notes ?? null,
      photo_url: input.photoUrl ?? null,
      flavor_notes: input.flavorNotes ?? [],
      sweetness: input.sweetness ?? null,
      umami: input.umami ?? null,
      bitterness: input.bitterness ?? null,
      body: input.body ?? null,
      prep_method: input.prepMethod ?? null,
      dose_g: input.doseG ?? null,
      water_ml: input.waterMl ?? null,
      water_temp_c: input.waterTempC ?? null,
      harvest_year: input.harvestYear ?? null,
      flush: input.flush ?? null,
      tasted_on: input.tastedOn ?? localToday(),
    })
    .eq('id', reviewId);
  if (error) throw error;
}

export async function deleteReview(
  supabase: Client,
  review: { id: string; photoUrl: string | null }
): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', review.id);
  if (error) throw error;
  const path = reviewPhotoPath(review.photoUrl);
  if (path) await removeReviewPhoto(supabase, path).catch(() => undefined);
}
