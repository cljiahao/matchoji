import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  brand: z.string().trim().max(120).optional(),
  category: z.enum(['hojicha', 'matcha']),
  grade: z.string().trim().max(60).optional(),
  regionId: z.string().uuid().optional(),
});

export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.infer<typeof productSchema>;
