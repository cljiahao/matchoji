import type { SupabaseClient } from '@supabase/supabase-js';

import { searchProducts, type ProductSummary } from '@/features/products';
import type { Database } from '@/integrations/supabase/database.types';

import { pickMatch } from '../lib/score-match';
import type { LabelReading } from '../schemas';

// search_teas matches one phrase against a tea's name or its name plus brand, so the label's
// pieces are searched separately and scored together.
export async function matchLabel(
  supabase: SupabaseClient<Database>,
  reading: LabelReading
): Promise<ProductSummary | null> {
  const phrases = [
    ...new Set(
      [reading.name, reading.maker, [reading.maker, reading.name].filter(Boolean).join(' ')].filter(
        (phrase): phrase is string => Boolean(phrase)
      )
    ),
  ];
  const found = await Promise.all(phrases.map((phrase) => searchProducts(supabase, phrase)));
  const byId = new Map(found.flat().map((product) => [product.id, product]));
  return pickMatch(reading, [...byId.values()]);
}
