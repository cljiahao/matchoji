import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '@/integrations/supabase/database.types';
import { isMissingTable } from '@/integrations/supabase/missing-table';

import type { Cafe, Drink } from '../types';
import { CAFE_COLUMNS, DRINK_COLUMNS, toCafe, toDrink } from './cafes-service';

type Client = SupabaseClient<Database>;

const LIMIT = 8;

const searchTermSchema = z.string().trim().max(80);

// % and _ are ilike wildcards and , ( ) are PostgREST filter syntax; none belongs in a name search.
function likePattern(query: string): string {
  return `%${query.replace(/[%_\\,()]/g, ' ').trim()}%`;
}

// Approved cafés plus the searcher's own pending ones (RLS hides everyone else's), so a person
// can pick the café they just added. Merged duplicates are skipped: their survivor is listed.
export async function searchCafes(supabase: Client, rawQuery: string): Promise<Cafe[]> {
  const query = searchTermSchema.parse(rawQuery);
  if (!query) return [];
  const { data, error } = await supabase
    .from('cafes')
    .select(CAFE_COLUMNS)
    .ilike('name', likePattern(query))
    .in('status', ['approved', 'pending'])
    .is('merged_into', null)
    .order('name')
    .limit(LIMIT);
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return data.map(toCafe);
}

// A café's drinks, narrowed by what has been typed so far. An empty query lists the first few.
export async function searchDrinks(
  supabase: Client,
  cafeId: string,
  rawQuery: string
): Promise<Drink[]> {
  const query = searchTermSchema.parse(rawQuery);
  let request = supabase
    .from('drinks')
    .select(DRINK_COLUMNS)
    .eq('cafe_id', cafeId)
    .in('status', ['approved', 'pending'])
    .is('merged_into', null);
  if (query) request = request.ilike('name', likePattern(query));
  const { data, error } = await request.order('name').limit(LIMIT);
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return data.map(toDrink);
}

// Whether the signed-in person holds the trusted-taster badge. It decides which fields the
// rating form asks for; the database makes the real call when the review is saved. A read
// failure throws rather than guessing false, so a real taster is never handed the community form.
export async function loadIsTrustedTaster(supabase: Client, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('is_trusted_taster')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.is_trusted_taster ?? false;
}
