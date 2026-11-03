import { z } from 'zod';

export const SHOP_KINDS = ['maker_store', 'stockist', 'cafe'] as const;

export const SHOP_KIND_LABELS: Record<(typeof SHOP_KINDS)[number], string> = {
  maker_store: 'Maker store',
  stockist: 'Stockist',
  cafe: 'Café',
};

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `Keep ${label.toLowerCase()} to ${max} characters`);

// Mirrors the shop_locations checks, so a bad row is refused before the request. The form
// passes strings; coordinates are coerced.
export const shopSchema = z.object({
  brand: text('Maker', 80),
  name: text('Name', 120),
  kind: z.enum(SHOP_KINDS),
  address: text('Address', 300),
  city: text('City', 80),
  country: text('Country', 80),
  lat: z.coerce.number().min(-90, 'Latitude is -90 to 90').max(90, 'Latitude is -90 to 90'),
  lng: z.coerce.number().min(-180, 'Longitude is -180 to 180').max(180, 'Longitude is -180 to 180'),
  sourceUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => {
      try {
        return new URL(value).protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Source must be an https:// link'),
});

export type ShopInput = z.input<typeof shopSchema>;
export type ShopValues = z.infer<typeof shopSchema>;
