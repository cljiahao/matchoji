import { z } from 'zod';

export const LABEL_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const LABEL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const LABEL_SCANS_PER_DAY = 20;

export const labelImageSchema = z
  .instanceof(File, { message: 'Attach a photo of the label.' })
  .refine((file) => (LABEL_IMAGE_TYPES as readonly string[]).includes(file.type), {
    message: 'Use a JPEG, PNG or WebP photo.',
  })
  .refine((file) => file.size > 0 && file.size <= LABEL_IMAGE_MAX_BYTES, {
    message: 'The photo must be under 5 MB.',
  });

// What the model reads off the tin. Every field but confidence may be null: a blank beats a guess.
export const labelReadingSchema = z.object({
  maker: z.string().trim().max(120).nullable(),
  name: z.string().trim().max(120).nullable(),
  category: z.enum(['matcha', 'hojicha']).nullable(),
  grade: z.string().trim().max(60).nullable(),
  origin: z.string().trim().max(120).nullable(),
  harvest: z.string().trim().max(60).nullable(),
  netWeightGrams: z.number().nullable(),
  confidence: z.enum(['low', 'medium', 'high']),
});

export type LabelReading = z.infer<typeof labelReadingSchema>;

export const scanResponseSchema = z.object({
  reading: labelReadingSchema,
  match: z
    .object({
      id: z.string(),
      name: z.string(),
      brand: z.string().nullable(),
      category: z.enum(['matcha', 'hojicha']),
    })
    .nullable(),
});

export type ScanResponse = z.infer<typeof scanResponseSchema>;
