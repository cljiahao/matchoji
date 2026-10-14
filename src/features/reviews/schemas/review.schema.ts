import { z } from 'zod';

export const reviewSchema = z.object({
  stars: z.number().int().min(1, 'Pick a rating').max(5),
  notes: z.string().trim().max(2000).optional(),
});

export type ReviewInput = z.input<typeof reviewSchema>;
export type ReviewOutput = z.infer<typeof reviewSchema>;
