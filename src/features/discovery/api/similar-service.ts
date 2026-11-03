import type { SupabaseClient } from '@supabase/supabase-js';

import type { CatalogueTea } from '@/features/products';
import { loadTeaFeatures } from '@/features/taste';
import type { Database } from '@/integrations/supabase/database.types';

import { rankSimilar, type SimilarCandidate } from '../lib/similar';

// Up to eight catalogue teas like `tea`. Taste data is read only for same-category teas, the
// only ones that can be ranked; a failed taste read must not hide the shelf, so it falls back
// to category, grade and region alone.
export async function listSimilarTeas(
  supabase: SupabaseClient<Database>,
  tea: CatalogueTea,
  catalogue: CatalogueTea[]
): Promise<CatalogueTea[]> {
  const peers = catalogue.filter((t) => t.category === tea.category && t.id !== tea.id);
  if (peers.length === 0) return [];

  const features = await loadTeaFeatures(supabase, [tea.id, ...peers.map((t) => t.id)]).catch(
    () => null
  );
  const plain = (t: CatalogueTea) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    grade: t.grade?.trim().toLowerCase() || null,
    regionId: t.regionId,
    sliders: {},
    notes: {},
  });
  const target = features?.get(tea.id) ?? plain(tea);
  const candidates: SimilarCandidate[] = peers.map((t) => ({
    id: t.id,
    name: t.name,
    reviewCount: t.reviewCount,
    features: features?.get(t.id) ?? plain(t),
  }));
  const byId = new Map(peers.map((t) => [t.id, t]));
  return rankSimilar(target, candidates).flatMap((c) => {
    const found = byId.get(c.id);
    return found ? [found] : [];
  });
}
