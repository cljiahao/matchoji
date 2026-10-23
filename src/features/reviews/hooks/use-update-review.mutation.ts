'use client';

import { useMutation } from '@tanstack/react-query';

import { createClient } from '@/integrations/supabase/client';

import {
  removeReviewPhoto,
  reviewPhotoPath,
  updateReview,
  uploadReviewPhoto,
} from '../api/reviews-mutations';
import type { ReviewOutput } from '../schemas/review.schema';

interface UpdateReviewInput extends ReviewOutput {
  reviewId: string;
  userId: string;
  // The stored photo; replaced (and its file removed) only when a new one is chosen.
  currentPhotoUrl: string | null;
  photo: File | null;
}

export function useUpdateReview() {
  return useMutation({
    mutationFn: async ({
      reviewId,
      userId,
      currentPhotoUrl,
      photo,
      ...values
    }: UpdateReviewInput) => {
      const supabase = createClient();
      const uploaded = photo ? await uploadReviewPhoto(supabase, userId, photo) : undefined;
      try {
        await updateReview(supabase, reviewId, {
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
