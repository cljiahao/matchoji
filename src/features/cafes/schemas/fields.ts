import { z } from 'zod';

// Form inputs hand over '' when cleared, and a cleared optional field means "not given".
export const blankToUndefined = (v: unknown) =>
  v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))
    ? undefined
    : v;

export function optionalText(max: number) {
  return z.preprocess(blankToUndefined, z.string().trim().max(max).optional());
}

export function optionalNumber(min: number, max: number, { int = false } = {}) {
  const range = `Between ${min} and ${max}`;
  const base = (int ? z.number().int('Whole numbers only') : z.number())
    .min(min, range)
    .max(max, range);
  return z.preprocess((v) => {
    const blank = blankToUndefined(v);
    return blank === undefined ? undefined : Number(blank);
  }, base.optional());
}

export const NAME = z.string().trim().min(1, 'Enter a name').max(120, 'At most 120 characters');
