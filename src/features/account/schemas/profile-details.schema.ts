import { z } from 'zod';

export const MAX_BIO = 280;

const HANDLE_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

// The same check the profile page runs before rendering a stored handle as a link.
export const isInstagramHandle = (value: string): boolean => HANDLE_PATTERN.test(value);

// A blank field means "remove it", so it is stored as null rather than an empty string.
const optionalText = (inner: z.ZodString) =>
  z
    .string()
    .nullable()
    .transform((value) => value?.trim() || null)
    .pipe(inner.nullable());

export const profileDetailsSchema = z.object({
  instagramHandle: optionalText(
    z.string().regex(HANDLE_PATTERN, 'Use letters, numbers, dots and underscores, without the @.')
  ),
  bio: optionalText(z.string().max(MAX_BIO, `Keep it to ${MAX_BIO} characters.`)),
});

export type ProfileDetailsInput = z.input<typeof profileDetailsSchema>;
