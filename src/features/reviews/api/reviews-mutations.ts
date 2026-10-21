import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

import type { ReviewOutput } from '../schemas/review.schema';

type Client = SupabaseClient<Database>;

export async function uploadReviewPhoto(
  supabase: Client,
  userId: string,
  file: File
): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from('review-photos').upload(path, file);
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('review-photos').getPublicUrl(path);

  return publicUrl;
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
    // Omitted rather than null so the column default (today) applies.
    ...(input.tastedOn ? { tasted_on: input.tastedOn } : {}),
  });

  if (error) throw error;
}
