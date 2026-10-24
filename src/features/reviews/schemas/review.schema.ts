import { z } from 'zod';

import type { ProductCategory } from '@/features/products';

import { localToday } from '../lib/local-date';
import {
  ALL_FLAVOR_NOTES,
  FLAVOR_NOTES,
  FLUSHES,
  MAX_FLAVOR_NOTES,
  PREP_METHODS,
} from '../lib/tasting-vocab';

const blankToUndefined = (v: unknown) =>
  v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))
    ? undefined
    : v;

// Form number inputs hand over '' when cleared; that means "not recorded", not zero.
function optionalNumber(min: number, max: number, { int = false } = {}) {
  const range = `Between ${min} and ${max}`;
  const base = (int ? z.number().int('Whole numbers only') : z.number())
    .min(min, range)
    .max(max, range);
  return z.preprocess((v) => {
    const blank = blankToUndefined(v);
    return blank === undefined ? undefined : Number(blank);
  }, base.optional());
}

// One refine over the whole array keeps the issue on `flavorNotes`, where the form shows it;
// per-item refines nest it at flavorNotes.N and the message never renders.
function flavorNotes(allowed: readonly string[]) {
  return z
    .array(z.string())
    .max(MAX_FLAVOR_NOTES, `Pick up to ${MAX_FLAVOR_NOTES} notes`)
    .refine((notes) => notes.every((n) => allowed.includes(n)), 'Pick notes from the list')
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
    // dose_g is numeric(4,1): a second decimal would be rounded silently.
    doseG: optionalNumber(0, 50).refine(
      (v) => v === undefined || Math.abs(v * 10 - Math.round(v * 10)) < 1e-9,
      'One decimal place at most'
    ),
    waterMl: optionalNumber(0, 1000, { int: true }),
    waterTempC: optionalNumber(0, 100, { int: true }),
    harvestYear: optionalNumber(1990, new Date().getFullYear() + 1, { int: true }),
    flush: z.preprocess(blankToUndefined, z.enum(FLUSHES).optional()),
    tastedOn: z.preprocess(
      blankToUndefined,
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date')
        .refine((d) => d <= localToday(), 'That date is in the future')
        .optional()
    ),
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
