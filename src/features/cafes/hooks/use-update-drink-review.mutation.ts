'use client';

import { useMutation } from '@tanstack/react-query';

import { removeReviewPhoto, reviewPhotoPath, uploadReviewPhoto } from '@/features/reviews';
import { createClient } from '@/integrations/supabase/client';

import { updateDrinkReview } from '../api/cafes-mutations';
import type { DrinkReviewOutput } from '../schemas/drink-review.schema';

interface UpdateDrinkReviewInput extends DrinkReviewOutput {
  reviewId: string;
  userId: string;
  // The stored photo; replaced (and its file removed) only when a new one is chosen.
  currentPhotoUrl: string | null;
  photo: File | null;
}

export function useUpdateDrinkReview() {
  return useMutation({
    mutationFn: async ({
      reviewId,
      userId,
      currentPhotoUrl,
      photo,
      ...values
    }: UpdateDrinkReviewInput) => {
      const supabase = createClient();
      const uploaded = photo ? await uploadReviewPhoto(supabase, userId, photo) : undefined;
      try {
        await updateDrinkReview(supabase, reviewId, {
          ...values,
          photoUrl: uploaded?.publicUrl ?? currentPhotoUrl ?? undefined,
        });
      } catch (error) {
        if (uploaded) await removeReviewPhoto(supabase, uploaded.path).catch(() => undefined);
        throw error;
      }
      const replaced = uploaded ? reviewPhotoPath(currentPhotoUrl) : null;
      if (replaced) await removeReviewPhoto(supabase, replaced).catch(() => undefined);
    },
  });
}
