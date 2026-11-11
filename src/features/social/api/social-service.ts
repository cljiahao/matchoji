import type { SupabaseClient } from '@supabase/supabase-js';

import { REVIEW_COLUMNS, loadDrinkSummaries, mapReviewRow } from '@/features/reviews';
import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import type { DrinkTasting, ProfileView, PublicProfile, TasterCard, Tasting } from '../types';

type Client = SupabaseClient<Database>;
type ReviewRow = Database['public']['Tables']['reviews']['Row'];

const RECENT = 20;
// Bound on the /tasters roster. Counts and each latest review come from the taster_stats view, so
// they are per taster and exact however many reviews the others have.
const TASTER_LIMIT = 100;

// Pairs tastings with their tea or drink and the author's name, keeping only tastings whose
// subject the reader can still see.
async function withSubjects(
  supabase: Client,
  rows: ReviewRow[],
  nameOf: (userId: string | null) => string
): Promise<Tasting[]> {
  const { data: products, error } = await selectIn(
    rows.flatMap((r) => (r.product_id ? [r.product_id] : [])),
    (ids) => supabase.from('products').select('id, name, brand, category').in('id', ids)
  );
  if (error) throw error;
  const drinks = await loadDrinkSummaries(
    supabase,
    rows.flatMap((r) => (r.drink_id ? [r.drink_id] : []))
  );
  const byId = new Map(products.map((p) => [p.id, p]));
  return rows.flatMap((r): Tasting[] => {
    if (r.drink_id) {
      const drink = drinks.get(r.drink_id);
      return drink ? [{ ...mapReviewRow(r, nameOf(r.user_id)), drink }] : [];
    }
    const product = r.product_id ? byId.get(r.product_id) : undefined;
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
    .select('id, display_name, is_public, created_at, is_trusted_taster, instagram_handle, bio')
    .eq('id', profileId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const profile: PublicProfile = {
    id: row.id,
    name: row.display_name,
    isPublic: row.is_public,
    joinedAt: row.created_at,
    isTrustedTaster: row.is_trusted_taster,
    instagramHandle: row.instagram_handle,
    bio: row.bio,
  };
  const isSelf = viewerId === profileId;
  const visible = profile.isPublic || isSelf;
  const count = { count: 'exact' as const, head: true };

  const [teas, drinks, followers, following, follows, blocked, recent] = await Promise.all([
    supabase
      .from('latest_reviews')
      .select('id', count)
      .eq('user_id', profileId)
      // The profile's "teas" count is packaged teas; drink tastings aren't teas.
      .not('product_id', 'is', null),
    supabase
      .from('latest_reviews')
      .select('id', count)
      .eq('user_id', profileId)
      .not('drink_id', 'is', null),
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
  for (const result of [teas, drinks, followers, following, follows, blocked, recent])
    if (result.error) throw result.error;

  const tastings = await withSubjects(supabase, recent.data ?? [], () => profile.name);
  return {
    profile,
    counts: {
      teas: teas.count ?? 0,
      drinks: drinks.count ?? 0,
      followers: followers.count ?? 0,
      following: following.count ?? 0,
    },
    viewer: { isSelf, follows: follows.data !== null, blocked: blocked.data !== null },
    recent: tastings,
    drinkReviews: tastings.filter((t): t is DrinkTasting => 'drink' in t),
  };
}

// Trusted tasters are always public (a database trigger keeps them so), so the view's handle and
// bio are populated. Counts and the latest review read only drink reviews whose drink the reader
// can still see.
export async function listTasters(supabase: Client): Promise<TasterCard[]> {
  const { data: people, error } = await supabase
    .from('public_profiles')
    .select('id, display_name, instagram_handle, bio')
    .eq('is_trusted_taster', true)
    .eq('is_public', true)
    .order('display_name')
    .limit(TASTER_LIMIT);
  if (error) throw error;
  if (people.length === 0) return [];

  const { data: stats, error: statsError } = await selectIn(
    people.map((p) => p.id),
    (ids) =>
      supabase
        .from('taster_stats')
        .select('user_id, drink_review_count, latest_review_id')
        .in('user_id', ids)
  );
  if (statsError) throw statsError;
  const statsById = new Map(stats.map((row) => [row.user_id, row]));

  // Only each taster's newest review is read, through the caller-rights view, so a review the
  // reader cannot see simply leaves that card without a latest drink.
  const { data: rows, error: reviewsError } = await selectIn(
    stats.map((row) => row.latest_review_id),
    (ids) => supabase.from('latest_reviews').select(REVIEW_COLUMNS).in('id', ids)
  );
  if (reviewsError) throw reviewsError;
  const reviewById = new Map(rows.map((r) => [r.id, r]));
  const drinks = await loadDrinkSummaries(
    supabase,
    rows.flatMap((r) => (r.drink_id ? [r.drink_id] : []))
  );

  return people.map((person): TasterCard => {
    const stat = statsById.get(person.id);
    const row = stat && reviewById.get(stat.latest_review_id);
    const drink = row?.drink_id ? drinks.get(row.drink_id) : undefined;
    return {
      id: person.id,
      name: person.display_name,
      bio: person.bio,
      instagramHandle: person.instagram_handle,
      drinkReviewCount: stat?.drink_review_count ?? 0,
      latest: row && drink ? { ...mapReviewRow(row, person.display_name), drink } : null,
    };
  });
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
  return withSubjects(supabase, data, (id) => (id && nameById.get(id)) || 'Former taster');
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
