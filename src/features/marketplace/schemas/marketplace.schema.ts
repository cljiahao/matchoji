import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || undefined)
    .optional();

const httpsUrl = z
  .string()
  .trim()
  .url('Enter a full web address')
  .refine((v) => v.startsWith('https://'), 'Use an https:// address');

const countryCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Use a two-letter country code, e.g. JP');

export const vendorSchema = z.object({
  name: z.string().trim().min(1, 'Shop name is required').max(80),
  profileInfo: optionalText(1000),
  website: z
    .union([z.literal(''), httpsUrl])
    .transform((v) => v || undefined)
    .optional(),
  country: countryCode,
  // Typed as "SG, MY, JP"; stored as an array of codes.
  shipsTo: z
    .string()
    .transform((v) => [
      ...new Set(
        v
          .split(/[\s,]+/)
          .filter(Boolean)
          .map((c) => c.toUpperCase())
      ),
    ])
    .pipe(
      z
        .array(z.string().regex(/^[A-Z]{2}$/, 'Use two-letter country codes, e.g. SG, JP'))
        .min(1, 'List at least one country you ship to')
        .max(60)
    ),
});

export const listingSchema = z.object({
  productId: z.uuid('Pick a tea from the catalogue'),
  price: z.coerce.number<string | number>().positive('Price must be above zero').max(100_000),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Use a three-letter currency code, e.g. SGD'),
  stock: z.coerce.number<string | number>().int('Whole units only').min(0).max(1_000_000),
  url: httpsUrl,
});

export type VendorInput = z.input<typeof vendorSchema>;
export type VendorOutput = z.infer<typeof vendorSchema>;
export type ListingInput = z.input<typeof listingSchema>;
export type ListingOutput = z.infer<typeof listingSchema>;
