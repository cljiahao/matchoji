'use client';

import { useMutation } from '@tanstack/react-query';

import { createClient } from '@/integrations/supabase/client';

import { createReview, uploadReviewPhoto } from '../api/reviews-mutations';
import type { ReviewOutput } from '../schemas/review.schema';

interface LogReviewInput extends ReviewOutput {
  productId: string;
  userId: string;
  photo: File | null;
}

export function useLogReview() {
  return useMutation({
    mutationFn: async (input: LogReviewInput) => {
      const supabase = createClient();

      const photoUrl = input.photo
        ? await uploadReviewPhoto(supabase, input.userId, input.photo)
        : undefined;

      await createReview(supabase, {
        productId: input.productId,
        userId: input.userId,
        stars: input.stars,
        notes: input.notes,
        photoUrl,
      });
    },
  });
}
