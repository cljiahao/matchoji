import type { SupabaseClient } from '@supabase/supabase-js';

import { REVIEW_COLUMNS, mapReviewRow, type Review } from '@/features/reviews';
import type { Database, DrinkBase, DrinkStyle } from '@/integrations/supabase/database.types';
import { isMissingTable } from '@/integrations/supabase/missing-table';
import { selectIn } from '@/integrations/supabase/select-in';

import { CITIES, cafeHref, compareDrinks, drinkHref, qualifiesForTop } from '../lib';
import type {
  Cafe,
  CafeListing,
  CafePageResult,
  CafeSitemapEntry,
  City,
  Drink,
  DrinkListing,
  DrinkPageResult,
  PageMissing,
  PageRedirect,
  ScorePair,
  TasterDrinkReview,
} from '../types';

type Client = SupabaseClient<Database>;
type Tables = Database['public']['Tables'];

// Columns are named, never '*': added_by, review_note and reviewed_at are not granted to readers.
export const CAFE_COLUMNS =
  'id, slug, name, city_slug, area, address, lat, lng, instagram_handle, website_url, status, merged_into, updated_at';
export const DRINK_COLUMNS =
  'id, cafe_id, slug, name, base, style, serving, price, currency, photo_url, photo_credit, tea_product_id, status, merged_into, updated_at';
const RATING_COLUMNS =
  'drink_id, taster_count, taster_avg, taster_disclosed_count, community_count, community_avg';

export type CafeRow = Pick<
  Tables['cafes']['Row'],
  | 'id'
  | 'slug'
  | 'name'
  | 'city_slug'
  | 'area'
  | 'address'
  | 'lat'
  | 'lng'
  | 'instagram_handle'
  | 'website_url'
  | 'status'
  | 'merged_into'
>;
export type DrinkRow = Pick<
  Tables['drinks']['Row'],
  | 'id'
  | 'cafe_id'
  | 'slug'
  | 'name'
  | 'base'
  | 'style'
  | 'serving'
  | 'price'
  | 'currency'
  | 'photo_url'
  | 'photo_credit'
  | 'tea_product_id'
  | 'status'
  | 'merged_into'
>;
interface RatingRow {
  taster_count: number;
  taster_avg: number | null;
  taster_disclosed_count?: number;
  community_count: number;
  community_avg: number | null;
}

const MISSING: PageMissing = { kind: 'missing' };
const redirect = (to: string): PageRedirect => ({ kind: 'redirect', to });

const NO_SCORES: ScorePair = {
  tasterAvg: null,
  tasterCount: 0,
  tasterDisclosedCount: 0,
  communityAvg: null,
  communityCount: 0,
};

// PostgREST's and Postgres's "no such function" codes, for the drink_reviews rpc.
const MISSING_FUNCTION = new Set(['PGRST202', '42883']);

// Migrations are applied by hand, so a reader of a newer table or function returns nothing until
// it exists; every other error is real.
function emptyOrThrow<T>(error: { code?: string }, empty: T): T {
  if (isMissingTable(error) || (error.code !== undefined && MISSING_FUNCTION.has(error.code))) {
    return empty;
  }
  throw error;
}

// merged_into has no cycle guard in the schema, and a chain wastes a 308 per hop, so a merge is
// followed to its final survivor, giving up on a loop or a chain longer than this.
const MAX_MERGE_HOPS = 5;

type MergeChain<T> = { status: 'ok'; row: T } | { status: 'loop' } | { status: 'gone' };

async function followMerges<T extends { id: string; merged_into: string | null }>(
  start: T,
  fetchById: (id: string) => Promise<T | null>
): Promise<MergeChain<T>> {
  const seen = new Set([start.id]);
  let row = start;
  for (let hops = 0; hops <= MAX_MERGE_HOPS; hops++) {
    const target = row.merged_into;
    if (!target) return { status: 'ok', row };
    if (seen.has(target)) return { status: 'loop' };
    seen.add(target);
    const next = await fetchById(target);
    if (!next) return { status: 'gone' };
    row = next;
  }
  return { status: 'loop' };
}

// numeric columns can arrive as strings depending on PostgREST settings.
const num = (v: number | string | null): number | null => (v === null ? null : Number(v));

const toScores = (row: RatingRow | null | undefined): ScorePair =>
  row
    ? {
        tasterAvg: num(row.taster_avg),
        tasterCount: Number(row.taster_count),
        tasterDisclosedCount: Number(row.taster_disclosed_count ?? 0),
        communityAvg: num(row.community_avg),
        communityCount: Number(row.community_count),
      }
    : NO_SCORES;

export const toCafe = (r: CafeRow): Cafe => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  citySlug: r.city_slug,
  area: r.area,
  address: r.address,
  lat: r.lat === null ? null : Number(r.lat),
  lng: r.lng === null ? null : Number(r.lng),
  instagramHandle: r.instagram_handle,
  websiteUrl: r.website_url,
  status: r.status,
});

export const toDrink = (r: DrinkRow): Drink => ({
  id: r.id,
  cafeId: r.cafe_id,
  slug: r.slug,
  name: r.name,
  base: r.base,
  style: r.style,
  serving: r.serving,
  price: num(r.price),
  currency: r.currency,
  photoUrl: r.photo_url,
  photoCredit: r.photo_credit,
  teaProductId: r.tea_product_id,
  status: r.status,
});

const cafeSummary = (cafe: Cafe): DrinkListing['cafe'] => ({
  slug: cafe.slug,
  name: cafe.name,
  area: cafe.area,
  citySlug: cafe.citySlug,
});

export function listCities(): Promise<City[]> {
  return Promise.resolve([...CITIES]);
}

async function ratingsByDrink(
  supabase: Client,
  drinkIds: string[]
): Promise<Map<string, ScorePair>> {
  const { data, error } = await selectIn(drinkIds, (batch) =>
    supabase.from('drink_ratings').select(RATING_COLUMNS).in('drink_id', batch)
  );
  if (error) return emptyOrThrow(error, new Map());
  return new Map(data.map((r) => [r.drink_id, toScores(r)]));
}

async function findCafe(supabase: Client, slug: string): Promise<CafeRow | null> {
  const { data, error } = await supabase
    .from('cafes')
    .select(CAFE_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();
  if (error) return emptyOrThrow(error, null);
  return data;
}

async function cafeById(supabase: Client, id: string): Promise<CafeRow | null> {
  const { data, error } = await supabase
    .from('cafes')
    .select(CAFE_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) return emptyOrThrow(error, null);
  return data;
}

// The café a merged one finally resolves to, or null when there is none to show: a loop, a
// survivor that cannot be read, or one that was rejected.
async function survivingCafe(supabase: Client, merged: CafeRow): Promise<CafeRow | null> {
  const chain = await followMerges(merged, (id) => cafeById(supabase, id));
  return chain.status === 'ok' && chain.row.status !== 'rejected' ? chain.row : null;
}

async function cafeSlugById(supabase: Client, id: string): Promise<string | null> {
  const { data, error } = await supabase.from('cafes').select('slug').eq('id', id).maybeSingle();
  if (error) return emptyOrThrow(error, null);
  return data?.slug ?? null;
}

async function cafeDrinks(supabase: Client, cafe: Cafe): Promise<DrinkListing[]> {
  const { data, error } = await supabase
    .from('drinks')
    .select(DRINK_COLUMNS)
    .eq('cafe_id', cafe.id)
    .eq('status', 'approved')
    .is('merged_into', null)
    .order('name');
  if (error) return emptyOrThrow(error, []);
  const scores = await ratingsByDrink(
    supabase,
    data.map((d) => d.id)
  );
  return data.map((row) => ({
    ...toDrink(row),
    scores: scores.get(row.id) ?? NO_SCORES,
    cafe: cafeSummary(cafe),
  }));
}

async function cafeScores(supabase: Client, cafeId: string): Promise<ScorePair> {
  const { data, error } = await supabase
    .from('cafe_ratings')
    .select('cafe_id, drink_count, taster_count, taster_avg, community_count, community_avg')
    .eq('cafe_id', cafeId)
    .maybeSingle();
  if (error) return emptyOrThrow(error, NO_SCORES);
  return toScores(data);
}

export interface ListCafesOptions {
  city: string;
  area?: string;
  tasterOnly?: boolean;
}

// Approved, un-merged cafés in a city. Rated-by-tasters first, then the rest alphabetically.
export async function listCafes(
  supabase: Client,
  { city, area, tasterOnly = false }: ListCafesOptions
): Promise<CafeListing[]> {
  let query = supabase
    .from('cafes')
    .select(CAFE_COLUMNS)
    .eq('city_slug', city)
    .eq('status', 'approved')
    .is('merged_into', null);
  if (area) query = query.eq('area', area);
  const { data, error } = await query.order('name');
  if (error) return emptyOrThrow(error, []);

  const { data: ratings, error: ratingsError } = await selectIn(
    data.map((c) => c.id),
    (batch) =>
      supabase
        .from('cafe_ratings')
        .select('cafe_id, drink_count, taster_count, taster_avg, community_count, community_avg')
        .in('cafe_id', batch)
  );
  // Without the cafe_ratings view the cafés still list, just unscored.
  const ratingRows = ratingsError ? emptyOrThrow(ratingsError, []) : ratings;
  const ratingByCafe = new Map(ratingRows.map((r) => [r.cafe_id, r]));

  const cafes = data.map((row) => {
    const rating = ratingByCafe.get(row.id);
    return {
      ...toCafe(row),
      drinkCount: Number(rating?.drink_count ?? 0),
      scores: toScores(rating),
    };
  });
  return cafes
    .filter((c) => !tasterOnly || c.scores.tasterCount > 0)
    .sort(
      (a, b) =>
        Number(b.scores.tasterCount > 0) - Number(a.scores.tasterCount > 0) ||
        (b.scores.tasterAvg ?? 0) - (a.scores.tasterAvg ?? 0) ||
        a.name.localeCompare(b.name)
    );
}

// A merged café forwards to the survivor; a rejected or unknown one is missing.
export async function getCafePage(supabase: Client, slug: string): Promise<CafePageResult> {
  const row = await findCafe(supabase, slug);
  if (!row) return MISSING;
  if (row.merged_into) {
    const survivor = await survivingCafe(supabase, row);
    return survivor ? redirect(cafeHref(survivor.slug)) : MISSING;
  }
  if (row.status === 'rejected') return MISSING;

  const cafe = toCafe(row);
  const [drinks, scores] = await Promise.all([
    cafeDrinks(supabase, cafe),
    cafeScores(supabase, cafe.id),
  ]);
  return { kind: 'found', cafe, scores, drinks };
}

async function reviewerNames(
  supabase: Client,
  userIds: (string | null)[]
): Promise<Map<string, string>> {
  // profiles is owner-only (it holds email); public_profiles exposes just the display name.
  const { data, error } = await selectIn(
    userIds.flatMap((id) => (id ? [id] : [])),
    (batch) => supabase.from('public_profiles').select('id, display_name').in('id', batch)
  );
  if (error) return emptyOrThrow(error, new Map<string, string>());
  return new Map(data.map((p) => [p.id, p.display_name]));
}

async function loadDrinkReviews(supabase: Client, drinkId: string): Promise<Review[]> {
  const { data, error } = await supabase.rpc('drink_reviews', { drink: drinkId });
  if (error) return emptyOrThrow(error, []);
  const names = await reviewerNames(
    supabase,
    data.map((r) => r.user_id)
  );
  // A private taster's review shows without a name; a deleted account's stays, unnamed too.
  return data.map((r) =>
    mapReviewRow(
      r,
      r.author_private ? 'Private taster' : (r.user_id && names.get(r.user_id)) || 'Former taster'
    )
  );
}

async function loadTeaProduct(
  supabase: Client,
  productId: string | null
): Promise<{ id: string; name: string } | null> {
  if (!productId) return null;
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', productId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

type DrinkNode = Pick<DrinkRow, 'id' | 'slug' | 'cafe_id' | 'status' | 'merged_into'>;

async function drinkNodeById(supabase: Client, id: string): Promise<DrinkNode | null> {
  const { data, error } = await supabase
    .from('drinks')
    .select('id, slug, cafe_id, status, merged_into')
    .eq('id', id)
    .maybeSingle();
  if (error) return emptyOrThrow(error, null);
  return data;
}

// A merged drink forwards to the drink that finally absorbed it. A loop is missing; if the
// survivor is gone, rejected or in a café that cannot be read, the café page is the nearest page
// that still exists.
async function mergedDrinkRedirect(
  supabase: Client,
  merged: DrinkRow,
  cafeRow: { id: string; slug: string }
): Promise<PageRedirect | PageMissing> {
  const chain = await followMerges<DrinkNode>(merged, (id) => drinkNodeById(supabase, id));
  if (chain.status === 'loop') return MISSING;
  const toCafe = redirect(cafeHref(cafeRow.slug));
  if (chain.status === 'gone' || chain.row.status === 'rejected') return toCafe;
  const { slug, cafe_id } = chain.row;
  const survivorCafe =
    cafe_id === cafeRow.id ? cafeRow.slug : await cafeSlugById(supabase, cafe_id);
  return survivorCafe ? redirect(drinkHref(survivorCafe, slug)) : toCafe;
}

// Every outcome other than "found" is a stable answer for an Instagram link: a merged café or
// drink forwards to its survivor, a rejected drink to its café, and only a link that never named
// a real page is missing.
export async function getDrinkPage(
  supabase: Client,
  cafeSlug: string,
  drinkSlug: string
): Promise<DrinkPageResult> {
  const cafeRow = await findCafe(supabase, cafeSlug);
  if (!cafeRow) return MISSING;
  if (cafeRow.merged_into) {
    const survivor = await survivingCafe(supabase, cafeRow);
    return survivor ? redirect(drinkHref(survivor.slug, drinkSlug)) : MISSING;
  }
  if (cafeRow.status === 'rejected') return MISSING;

  const { data: row, error } = await supabase
    .from('drinks')
    .select(DRINK_COLUMNS)
    .eq('cafe_id', cafeRow.id)
    .eq('slug', drinkSlug)
    .maybeSingle();
  if (error) return emptyOrThrow(error, MISSING);
  if (!row) return MISSING;

  if (row.merged_into) return mergedDrinkRedirect(supabase, row, cafeRow);
  if (row.status === 'rejected') return redirect(cafeHref(cafeRow.slug));

  const [{ data: rating, error: ratingError }, reviews, teaProduct] = await Promise.all([
    supabase.from('drink_ratings').select(RATING_COLUMNS).eq('drink_id', row.id).maybeSingle(),
    loadDrinkReviews(supabase, row.id),
    loadTeaProduct(supabase, row.tea_product_id),
  ]);
  const drinkRating = ratingError ? emptyOrThrow(ratingError, null) : rating;

  return {
    kind: 'found',
    drink: { ...toDrink(row), scores: toScores(drinkRating), cafe: cafeSummary(toCafe(cafeRow)) },
    tasterReviews: reviews.filter((r) => r.byTrustedTaster),
    communityReviews: reviews.filter((r) => !r.byTrustedTaster),
    teaProduct,
  };
}

interface CityDrinkQuery {
  city: string;
  base?: DrinkBase;
  style?: DrinkStyle;
}

// Every approved drink at an approved café in a city, with its scores.
async function cityDrinks(
  supabase: Client,
  { city, base, style }: CityDrinkQuery
): Promise<DrinkListing[]> {
  const { data: cafes, error } = await supabase
    .from('cafes')
    .select('id, slug, name, area, city_slug')
    .eq('city_slug', city)
    .eq('status', 'approved')
    .is('merged_into', null);
  if (error) return emptyOrThrow(error, []);

  const { data: drinks, error: drinksError } = await selectIn(
    cafes.map((c) => c.id),
    (batch) => {
      let query = supabase
        .from('drinks')
        .select(DRINK_COLUMNS)
        .in('cafe_id', batch)
        .eq('status', 'approved')
        .is('merged_into', null);
      if (base) query = query.eq('base', base);
      if (style) query = query.eq('style', style);
      return query;
    }
  );
  if (drinksError) return emptyOrThrow(drinksError, []);

  const scores = await ratingsByDrink(
    supabase,
    drinks.map((d) => d.id)
  );
  const cafeById = new Map(cafes.map((c) => [c.id, c]));
  return drinks.flatMap((row) => {
    const cafe = cafeById.get(row.cafe_id);
    return cafe
      ? [
          {
            ...toDrink(row),
            scores: scores.get(row.id) ?? NO_SCORES,
            cafe: { slug: cafe.slug, name: cafe.name, area: cafe.area, citySlug: cafe.city_slug },
          },
        ]
      : [];
  });
}

export interface TopDrinksOptions extends CityDrinkQuery {
  limit?: number;
}

export async function listTopDrinks(
  supabase: Client,
  { limit = 20, ...query }: TopDrinksOptions
): Promise<DrinkListing[]> {
  const drinks = await cityDrinks(supabase, query);
  return drinks.filter(qualifiesForTop).sort(compareDrinks).slice(0, limit);
}

// Same base and style in the same city; prices are never compared across cities.
export async function listSimilarDrinks(
  supabase: Client,
  drink: Drink,
  city: string,
  limit = 4
): Promise<DrinkListing[]> {
  const drinks = await cityDrinks(supabase, { city, base: drink.base, style: drink.style });
  return drinks
    .filter((d) => d.id !== drink.id)
    .sort(compareDrinks)
    .slice(0, limit);
}

// Newest trusted-taster review per person and drink, so a re-log cannot pad the rail.
export async function latestTasterReviews(
  supabase: Client,
  drinks: DrinkListing[],
  limit = 6
): Promise<TasterDrinkReview[]> {
  const drinkById = new Map(drinks.map((d) => [d.id, d]));
  const { data, error } = await selectIn([...drinkById.keys()], (batch) =>
    supabase
      .from('reviews')
      .select(REVIEW_COLUMNS)
      .in('drink_id', batch)
      .eq('by_trusted_taster', true)
      .order('created_at', { ascending: false })
  );
  if (error) return emptyOrThrow(error, []);

  const seen = new Set<string>();
  const newest = data
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .filter((r) => {
      const key = `${r.user_id ?? r.id}:${r.drink_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return r.drink_id !== null && drinkById.has(r.drink_id);
    })
    .slice(0, limit);

  const names = await reviewerNames(
    supabase,
    newest.map((r) => r.user_id)
  );
  return newest.flatMap((r) => {
    const drink = r.drink_id ? drinkById.get(r.drink_id) : undefined;
    if (!drink) return [];
    const name = r.user_id ? names.get(r.user_id) : undefined;
    // A taster missing from public_profiles is private or gone: no name, and no profile link.
    return [
      {
        drink,
        review: { ...mapReviewRow(r, name ?? 'Former taster'), authorId: name ? r.user_id : null },
      },
    ];
  });
}

export async function listLatestTasterDrinkReviews(
  supabase: Client,
  { city, limit }: { city: string; limit?: number }
): Promise<TasterDrinkReview[]> {
  return latestTasterReviews(supabase, await cityDrinks(supabase, { city }), limit);
}

// PostgREST caps a response at 1000 rows by default, so a larger table is read page by page.
const SITEMAP_PAGE_SIZE = 1000;

async function readAllPages<T>(
  fetchPage: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += SITEMAP_PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + SITEMAP_PAGE_SIZE - 1);
    if (error) return emptyOrThrow(error, []);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < SITEMAP_PAGE_SIZE) return rows;
  }
}

// Approved cafés and drinks for the sitemap. Merged ones are left out: they redirect.
export async function listCafeSitemapEntries(supabase: Client): Promise<CafeSitemapEntry[]> {
  const cafes = await readAllPages((from, to) =>
    supabase
      .from('cafes')
      .select('id, slug, updated_at')
      .eq('status', 'approved')
      .is('merged_into', null)
      .order('slug')
      .range(from, to)
  );
  // Ordered by café then slug: drink slugs are only unique within a café, so slug alone would
  // let rows swap pages between reads.
  const drinks = await readAllPages((from, to) =>
    supabase
      .from('drinks')
      .select('cafe_id, slug, updated_at')
      .eq('status', 'approved')
      .is('merged_into', null)
      .order('cafe_id')
      .order('slug')
      .range(from, to)
  );

  const drinksByCafe = new Map<string, typeof drinks>();
  for (const drink of drinks) {
    const list = drinksByCafe.get(drink.cafe_id);
    if (list) list.push(drink);
    else drinksByCafe.set(drink.cafe_id, [drink]);
  }
  return cafes.flatMap((cafe) => [
    { path: cafeHref(cafe.slug), lastModified: cafe.updated_at },
    ...(drinksByCafe.get(cafe.id) ?? []).map((d) => ({
      path: drinkHref(cafe.slug, d.slug),
      lastModified: d.updated_at,
    })),
  ]);
}
