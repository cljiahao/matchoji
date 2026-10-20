import { z } from 'zod';

import type { ProductCategory } from '@/features/products';

import {
  ALL_FLAVOR_NOTES,
  FLAVOR_NOTES,
  MAX_FLAVOR_NOTES,
  PREP_METHODS,
} from '../lib/tasting-vocab';

// Form number inputs hand over '' when cleared; that means "not recorded", not zero.
function optionalNumber(min: number, max: number, { int = false } = {}) {
  const base = int ? z.number().int() : z.number();
  return z.preprocess(
    (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
    base.min(min).max(max).optional()
  );
}

function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function flavorNotes(allowed: readonly string[]) {
  return z
    .array(z.string().refine((n) => allowed.includes(n), 'Pick notes from the list'))
    .max(MAX_FLAVOR_NOTES, `Pick up to ${MAX_FLAVOR_NOTES} notes`)
    .refine((notes) => new Set(notes).size === notes.length, 'Each note once')
    .optional();
}

const taste = optionalNumber(1, 5, { int: true });

function buildReviewSchema(allowedNotes: readonly string[]) {
  return z.object({
    stars: z.number().int().min(1, 'Pick a rating').max(5),
    notes: z.string().trim().max(2000).optional(),
    flavorNotes: flavorNotes(allowedNotes),
    sweetness: taste,
    umami: taste,
    bitterness: taste,
    body: taste,
    prepMethod: z.enum(PREP_METHODS).optional(),
    doseG: optionalNumber(0, 50),
    waterMl: optionalNumber(0, 1000, { int: true }),
    waterTempC: optionalNumber(0, 100, { int: true }),
    tastedOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date')
      .refine((d) => d <= localToday(), 'That date is in the future')
      .optional(),
  });
}

export const reviewSchema = buildReviewSchema(ALL_FLAVOR_NOTES);

// The form validates against the product's own category so a matcha can't be logged as
// "roasty" through a stale draft or a hand-edited request.
export function reviewSchemaFor(category: ProductCategory) {
  return buildReviewSchema(FLAVOR_NOTES[category]);
}

export type ReviewInput = z.input<typeof reviewSchema>;
export type ReviewOutput = z.infer<typeof reviewSchema>;
