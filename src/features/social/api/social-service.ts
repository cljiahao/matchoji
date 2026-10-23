import type { SupabaseClient } from '@supabase/supabase-js';

import { REVIEW_COLUMNS, mapReviewRow } from '@/features/reviews';
import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import type { ProfileView, PublicProfile, Tasting } from '../types';

type Client = SupabaseClient<Database>;
type ReviewRow = Database['public']['Tables']['reviews']['Row'];

const RECENT = 20;

// Pairs tastings with their tea and the author's name, keeping only tastings whose tea the
// reader can still see.
async function withProducts(
  supabase: Client,
  rows: ReviewRow[],
  nameOf: (userId: string | null) => string
): Promise<Tasting[]> {
  const { data: products, error } = await selectIn(
    [...new Set(rows.map((r) => r.product_id))],
    (ids) => supabase.from('products').select('id, name, brand, category').in('id', ids)
  );
  if (error) throw error;
  const byId = new Map(products.map((p) => [p.id, p]));
  return rows.flatMap((r) => {
    const product = byId.get(r.product_id);
    return product ? [{ ...mapReviewRow(r, nameOf(r.user_id)), product }] : [];
  });
}

export async function getProfileView(
  supabase: Client,
  profileId: string,
  viewerId: string | null
): Promise<ProfileView | null> {
  const { data: row, error } = await supabase
    .from('public_profiles')
    .select('id, display_name, is_public, created_at')
    .eq('id', profileId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const profile: PublicProfile = {
    id: row.id,
    name: row.display_name,
    isPublic: row.is_public,
    joinedAt: row.created_at,
  };
  const isSelf = viewerId === profileId;
  const visible = profile.isPublic || isSelf;
  const count = { count: 'exact' as const, head: true };

  const [teas, followers, following, follows, blocked, recent] = await Promise.all([
    supabase.from('latest_reviews').select('id', count).eq('user_id', profileId),
    supabase.from('follows').select('follower_id', count).eq('followee_id', profileId),
    supabase.from('follows').select('followee_id', count).eq('follower_id', profileId),
    viewerId && !isSelf
      ? supabase
          .from('follows')
          .select('followee_id')
          .eq('follower_id', viewerId)
          .eq('followee_id', profileId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    viewerId && !isSelf
      ? supabase
          .from('blocks')
          .select('blocked_id')
          .eq('blocker_id', viewerId)
          .eq('blocked_id', profileId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    visible
      ? supabase
          .from('latest_reviews')
          .select(REVIEW_COLUMNS)
          .eq('user_id', profileId)
          .order('created_at', { ascending: false })
          .limit(RECENT)
      : Promise.resolve({ data: [] as ReviewRow[], error: null }),
  ]);
  for (const result of [teas, followers, following, follows, blocked, recent])
    if (result.error) throw result.error;

  return {
    profile,
    counts: {
      teas: teas.count ?? 0,
      followers: followers.count ?? 0,
      following: following.count ?? 0,
    },
    viewer: { isSelf, follows: follows.data !== null, blocked: blocked.data !== null },
    recent: await withProducts(supabase, recent.data ?? [], () => profile.name),
  };
}

// The latest tastings of the people the reader follows, from the following_feed function.
export async function loadFeed(supabase: Client, limit = 12): Promise<Tasting[]> {
  const { data, error } = await supabase.rpc('following_feed', { max_rows: limit });
  if (error) throw error;
  if (data.length === 0) return [];
  const { data: names, error: namesError } = await selectIn(
    [...new Set(data.flatMap((r) => (r.user_id ? [r.user_id] : [])))],
    (ids) => supabase.from('public_profiles').select('id, display_name').in('id', ids)
  );
  if (namesError) throw namesError;
  const nameById = new Map(names.map((n) => [n.id, n.display_name]));
  return withProducts(supabase, data, (id) => (id && nameById.get(id)) || 'Former taster');
}

export async function setFollowing(
  supabase: Client,
  me: string,
  them: string,
  follow: boolean
): Promise<void> {
  const { error } = follow
    ? await supabase.from('follows').insert({ follower_id: me, followee_id: them })
    : await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', them);
  if (error) throw error;
}

export async function setBlocked(
  supabase: Client,
  me: string,
  them: string,
  block: boolean
): Promise<void> {
  const { error } = block
    ? await supabase.from('blocks').insert({ blocker_id: me, blocked_id: them })
    : await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', them);
  if (error) throw error;
}

export async function listBlocked(
  supabase: Client,
  me: string
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', me);
  if (error) throw error;
  const { data: names, error: namesError } = await selectIn(
    data.map((b) => b.blocked_id),
    (ids) => supabase.from('public_profiles').select('id, display_name').in('id', ids)
  );
  if (namesError) throw namesError;
  return names.map((n) => ({ id: n.id, name: n.display_name }));
}

export async function setProfilePublic(
  supabase: Client,
  me: string,
  isPublic: boolean
): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_public: isPublic }).eq('id', me);
  if (error) throw error;
}
