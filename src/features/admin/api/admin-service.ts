import type { SupabaseClient } from '@supabase/supabase-js';

import type { ProductSummary } from '@/features/products';
import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import type { ReviewDecision, ReviewQueue } from '../types';

type Client = SupabaseClient<Database>;

// The database decides: is_admin() reads the caller's own flag, and every admin write below
// re-checks it, so a page that skipped this check still could not act.
export async function isAdmin(supabase: Client): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  return data === true;
}

// Admins can read every tea and shop (RLS), so pending ones come back here; oldest first, like
// a queue.
export async function listReviewQueue(supabase: Client): Promise<ReviewQueue> {
  const [teas, shops] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, brand, category, grade, added_by, created_at')
      .eq('status', 'pending')
      .order('created_at'),
    supabase
      .from('vendors')
      .select('id, name, country, ships_to, website, profile_info, created_at')
      .eq('status', 'pending')
      .order('created_at'),
  ]);
  if (teas.error) throw teas.error;
  if (shops.error) throw shops.error;

  const adders = [...new Set(teas.data.map((t) => t.added_by).filter((id) => id !== null))];
  const { data: names, error: namesError } = await selectIn(adders, (ids) =>
    supabase.from('public_profiles').select('id, display_name').in('id', ids)
  );
  if (namesError) throw namesError;
  const nameById = new Map(names.map((n) => [n.id, n.display_name]));

  return {
    teas: teas.data.map((t) => ({
      id: t.id,
      name: t.name,
      brand: t.brand,
      category: t.category,
      grade: t.grade,
      createdAt: t.created_at,
      addedByName: t.added_by ? (nameById.get(t.added_by) ?? null) : null,
    })),
    shops: shops.data.map((s) => ({
      id: s.id,
      name: s.name,
      country: s.country,
      shipsTo: s.ships_to,
      website: s.website,
      profileInfo: s.profile_info,
      createdAt: s.created_at,
    })),
  };
}

export async function listApprovedTeas(supabase: Client): Promise<ProductSummary[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, category')
    .eq('status', 'approved')
    .order('name');
  if (error) throw error;
  return data;
}

export async function reviewTea(
  supabase: Client,
  tea: string,
  decision: ReviewDecision,
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('review_tea', { tea, decision, note });
  if (error) throw error;
}

export async function mergeTea(supabase: Client, duplicate: string, keep: string): Promise<void> {
  const { error } = await supabase.rpc('merge_tea', { duplicate, keep });
  if (error) throw error;
}

export async function reviewShop(
  supabase: Client,
  vendor: string,
  decision: ReviewDecision,
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('review_vendor', { vendor, decision, note });
  if (error) throw error;
}

export async function setTeaLinks(
  supabase: Client,
  tea: string,
  links: { image: string; shop: string }
): Promise<void> {
  const { error } = await supabase.rpc('set_tea_links', { tea, ...links });
  if (error) throw error;
}

// Tea photos live in their own admin-only bucket, under the tea's id with a random name.
export async function uploadTeaImage(supabase: Client, tea: string, file: File): Promise<string> {
  const ext = /\.([a-z0-9]{1,5})$/i.exec(file.name)?.[1]?.toLowerCase();
  const suffix = ext ? '.' + ext : '';
  const path = `${tea}/${crypto.randomUUID()}${suffix}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  if (error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
