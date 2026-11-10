import type { DrinkCurrency } from '@/integrations/supabase/database.types';

// en-MY writes RM12.00 where en would write "MYR 12.00"; each city reads its own money.
const LOCALE: Record<DrinkCurrency, string> = { SGD: 'en-SG', MYR: 'en-MY' };

export function formatPrice(amount: number, currency: DrinkCurrency): string {
  return new Intl.NumberFormat(LOCALE[currency], { style: 'currency', currency }).format(amount);
}
