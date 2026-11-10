import { z } from 'zod';

import { NAME, optionalNumber } from './fields';

export const DRINK_BASES = ['hojicha', 'matcha'] as const;
export const DRINK_STYLES = ['latte', 'straight', 'iced_latte', 'float', 'other'] as const;
export const DRINK_SERVINGS = ['hot', 'iced', 'both'] as const;

export const drinkSchema = z.object({
  cafeId: z.string().uuid(),
  name: NAME,
  base: z.enum(DRINK_BASES, { error: 'Pick hojicha or matcha' }),
  style: z.enum(DRINK_STYLES, { error: 'Pick a style' }),
  serving: z.enum(DRINK_SERVINGS, { error: 'Pick how it is served' }),
  // numeric(7,2) in the database: two decimals, under 100000.
  price: optionalNumber(0, 99999).refine(
    (v) => v === undefined || Math.abs(v * 100 - Math.round(v * 100)) < 1e-6,
    'Two decimal places at most'
  ),
});

export type DrinkInput = z.input<typeof drinkSchema>;
export type DrinkOutput = z.infer<typeof drinkSchema>;
