import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max);

// Keys the update_cafe database function allows; anything else is refused there too, but a typo
// should fail here with a message the admin can read.
export const cafeFieldsSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(120),
    area: optionalText(80),
    address: optionalText(300),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    instagram_handle: z.union([z.literal(''), z.string().regex(/^[A-Za-z0-9._]{1,30}$/)]),
    website_url: z
      .union([z.literal(''), z.url().regex(/^https:\/\//)])
      .refine((v) => v.length <= 300),
  })
  .partial();
export type CafeFields = z.infer<typeof cafeFieldsSchema>;

export const drinkFieldsSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(120),
    base: z.enum(['hojicha', 'matcha']),
    style: z.enum(['latte', 'straight', 'iced_latte', 'float', 'other']),
    serving: z.enum(['hot', 'iced', 'both']),
    price: z.number().min(0).max(99999.99),
    photo_url: z.union([z.literal(''), z.url().regex(/^https:\/\//)]),
    photo_credit: optionalText(200),
    tea_product_id: z.union([z.literal(''), z.uuid()]),
  })
  .partial();
export type DrinkFields = z.infer<typeof drinkFieldsSchema>;

export const idSchema = z.uuid();
export const noteSchema = z.string().trim().max(500).optional();
