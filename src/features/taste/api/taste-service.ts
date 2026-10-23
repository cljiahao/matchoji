import type { SupabaseClient } from '@supabase/supabase-js';

import { TASTE_ATTRIBUTES } from '@/features/reviews';
import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import { predictMatch } from '../lib/match';
import type { MatchResult, RatedTea, TeaFeatures } from '../types';

type Client = SupabaseClient<Database>;

// Features for a set of teas: the catalogue entry plus the community's taste profile.
async function loadFeatures(supabase: Client, ids: string[]): Promise<Map<string, TeaFeatures>> {
  const [teas, profiles] = await Promise.all([
    selectIn(ids, (batch) =>
      supabase.from('products').select('id, name, category, grade, region_id').in('id', batch)
    ),
    selectIn(ids, (batch) =>
      supabase.from('tea_taste_profiles').select('*').in('product_id', batch)
    ),
  ]);
  if (teas.error) throw teas.error;
  if (profiles.error) throw profiles.error;

  const profileById = new Map(profiles.data.map((p) => [p.product_id, p]));
  return new Map(
    teas.data.map((t) => {
      const profile = profileById.get(t.id);
      const sliders: TeaFeatures['sliders'] = {};
      for (const attribute of TASTE_ATTRIBUTES) {
        // numeric can arrive as a string from PostgREST.
        const value = profile?.[attribute];
        if (value !== null && value !== undefined) sliders[attribute] = Number(value);
      }
      return [
        t.id,
        {
          id: t.id,
          name: t.name,
          category: t.category,
          grade: t.grade?.trim().toLowerCase() || null,
          regionId: t.region_id,
          sliders,
          notes: profile?.notes ?? {},
        },
      ];
    })
  );
}

export interface MatchContext {
  // Whether the taster has rated anything yet; without that there is nothing to match on.
  hasRatings: boolean;
  matches: Map<string, MatchResult | null>;
  // Their own latest rating of each candidate they have rated.
  ownStars: Map<string, number>;
}

// Match scores for the candidate teas, from the taster's latest rating of every tea they rated.
export async function loadMatches(
  supabase: Client,
  userId: string,
  candidateIds: string[]
): Promise<MatchContext> {
  const { data: mine, error } = await supabase
    .from('latest_reviews')
    .select('product_id, stars')
    .eq('user_id', userId);
  if (error) throw error;

  const ownStars = new Map(mine.map((r) => [r.product_id, r.stars]));
  if (mine.length === 0) return { hasRatings: false, matches: new Map(), ownStars };

  const features = await loadFeatures(supabase, [
    ...new Set([...ownStars.keys(), ...candidateIds]),
  ]);
  const rated: RatedTea[] = mine.flatMap((r) => {
    const tea = features.get(r.product_id);
    return tea ? [{ tea, stars: r.stars }] : [];
  });

  const matches = new Map(
    candidateIds.map((id) => {
      const tea = features.get(id);
      return [id, tea ? predictMatch(rated, tea) : null];
    })
  );
  return { hasRatings: true, matches, ownStars };
}
