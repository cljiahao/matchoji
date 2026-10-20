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

      // The File itself is uploaded above; only its public URL is stored with the review.
      const review: Omit<LogReviewInput, 'photo'> & { photo?: File | null } = { ...input };
      delete review.photo;
      await createReview(supabase, { ...review, photoUrl });
    },
  });
}
