import { z } from 'zod';

import { CitySlugSchema } from '../lib/city';
import { NAME, blankToUndefined, optionalText } from './fields';

// Stored without the "@", so a pasted handle works either way.
const HANDLE = /^[A-Za-z0-9._]{1,30}$/;

export const cafeSchema = z.object({
  name: NAME,
  citySlug: CitySlugSchema,
  area: optionalText(80),
  address: optionalText(300),
  instagramHandle: z.preprocess((v) => {
    const blank = blankToUndefined(v);
    return typeof blank === 'string' ? blank.trim().replace(/^@/, '') || undefined : blank;
  }, z.string().regex(HANDLE, 'Letters, numbers, dots and underscores only').optional()),
  websiteUrl: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .max(500)
      .regex(/^https:\/\/\S+$/, 'Start with https://')
      .optional()
  ),
});

export type CafeInput = z.input<typeof cafeSchema>;
export type CafeOutput = z.infer<typeof cafeSchema>;
