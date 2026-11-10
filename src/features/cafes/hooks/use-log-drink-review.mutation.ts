'use client';

import { useMutation } from '@tanstack/react-query';

import { removeReviewPhoto, uploadReviewPhoto } from '@/features/reviews';
import { createClient } from '@/integrations/supabase/client';

import { createDrinkReview } from '../api/cafes-mutations';
import type { DrinkReviewOutput } from '../schemas/drink-review.schema';

interface LogDrinkReviewInput extends DrinkReviewOutput {
  drinkId: string;
  userId: string;
  photo: File | null;
}

export function useLogDrinkReview() {
  return useMutation({
    mutationFn: async ({ drinkId, photo, ...review }: LogDrinkReviewInput) => {
      const supabase = createClient();
      const uploaded = photo ? await uploadReviewPhoto(supabase, review.userId, photo) : undefined;
      try {
        await createDrinkReview(supabase, drinkId, { ...review, photoUrl: uploaded?.publicUrl });
      } catch (error) {
        if (uploaded) await removeReviewPhoto(supabase, uploaded.path).catch(() => undefined);
        throw error;
      }
    },
  });
}
