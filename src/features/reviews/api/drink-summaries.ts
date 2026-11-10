import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';
import { isMissingTable } from '@/integrations/supabase/missing-table';
import { selectIn } from '@/integrations/supabase/select-in';

import type { DrinkSummary } from '../types';

type Client = SupabaseClient<Database>;

// Names and slugs for a set of drinks and their cafés, keyed by drink id. Columns are named
// because added_by and the review fields are not selectable on cafes and drinks. Row-level
// security hides drinks that aren't approved, so those ids are simply absent from the map; so
// is everything before the café migration is applied.
export async function loadDrinkSummaries(
  supabase: Client,
  drinkIds: string[]
): Promise<Map<string, DrinkSummary>> {
  const ids = [...new Set(drinkIds)];
  if (ids.length === 0) return new Map();

  const { data: drinks, error } = await selectIn(ids, (batch) =>
    supabase.from('drinks').select('id, cafe_id, slug, name, base').in('id', batch)
  );
  if (error) {
    if (isMissingTable(error)) return new Map();
    throw error;
  }

  const { data: cafes, error: cafesError } = await selectIn(
    [...new Set(drinks.map((d) => d.cafe_id))],
    (batch) => supabase.from('cafes').select('id, slug, name').in('id', batch)
  );
  if (cafesError) {
    if (isMissingTable(cafesError)) return new Map();
    throw cafesError;
  }

  const cafeById = new Map(cafes.map((c) => [c.id, c]));
  return new Map(
    drinks.flatMap((d) => {
      const cafe = cafeById.get(d.cafe_id);
      return cafe
        ? [[d.id, { id: d.id, slug: d.slug, name: d.name, base: d.base, cafe }] as const]
        : [];
    })
  );
}
