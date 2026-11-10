import { z } from 'zod';

import { FLAVOR_NOTES, MAX_FLAVOR_NOTES, localToday } from '@/features/reviews';
import type { Disclosure, DrinkBase } from '@/integrations/supabase/database.types';

import { blankToUndefined, optionalNumber } from './fields';

export const INSTAGRAM_POST_URL = /^https:\/\/www\.instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/;

export const DISCLOSURES = [
  'none',
  'invited',
  'gifted',
  'paid',
] as const satisfies readonly Disclosure[];

const scale = optionalNumber(1, 5, { int: true });

function flavorNotes(base: DrinkBase) {
  const allowed = FLAVOR_NOTES[base];
  return z
    .array(z.string())
    .max(MAX_FLAVOR_NOTES, `Pick up to ${MAX_FLAVOR_NOTES} notes`)
    .refine((notes) => notes.every((n) => allowed.includes(n)), 'Pick notes from the list')
    .refine((notes) => new Set(notes).size === notes.length, 'Each note once')
    .optional();
}

function shape(base: DrinkBase) {
  return {
    stars: z.number().int().min(1, 'Pick a rating').max(5),
    notes: z.preprocess(blankToUndefined, z.string().trim().max(2000).optional()),
    flavorNotes: flavorNotes(base),
    sweetness: scale,
    body: scale,
    bitterness: scale,
    teaStrength: scale,
    roast: scale,
    tastedOn: z.preprocess(
      blankToUndefined,
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date')
        .refine((d) => d <= localToday(), 'That date is in the future')
        .optional()
    ),
  };
}

// The broad shape, with the taster-only fields optional: the form's value type for everyone.
export const drinkReviewFormSchema = z.object({
  ...shape('hojicha'),
  instagramUrl: z.string().optional(),
  disclosure: z.enum(DISCLOSURES).optional(),
});

export type DrinkReviewInput = z.input<typeof drinkReviewFormSchema>;
export type DrinkReviewOutput = z.infer<typeof drinkReviewFormSchema>;

// A trusted taster must link the post and say whether it was disclosed, with nothing chosen
// for them: a default of "none" would let a gifted drink go out undeclared by accident. The
// database refuses both a taster without the link and anyone else sending either field.
export function drinkReviewSchemaFor(opts: {
  isTaster: boolean;
  base: DrinkBase;
}): z.ZodType<DrinkReviewOutput, DrinkReviewInput> {
  // Roast depth is a hojicha idea; for matcha the key is dropped rather than stored.
  const all = z.object(shape(opts.base));
  const fields = opts.base === 'hojicha' ? all : all.omit({ roast: true });
  if (!opts.isTaster) return fields;
  return fields.extend({
    instagramUrl: z
      .string({ error: 'Add the link to your Instagram post' })
      .trim()
      .min(1, 'Add the link to your Instagram post')
      .max(300)
      .regex(INSTAGRAM_POST_URL, 'Use the post or reel link, like https://www.instagram.com/p/…'),
    disclosure: z.enum(DISCLOSURES, { error: 'Say whether this was gifted, paid or invited' }),
  });
}
