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
const CAFE_COLUMNS =
  'id, slug, name, city_slug, area, address, lat, lng, instagram_handle, website_url, status, merged_into, updated_at';
const DRINK_COLUMNS =
  'id, cafe_id, slug, name, base, style, serving, price, currency, photo_url, photo_credit, tea_product_id, status, merged_into, updated_at';
const RATING_COLUMNS =
  'drink_id, taster_count, taster_avg, taster_disclosed_count, community_count, community_avg';

type CafeRow = Pick<
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
type DrinkRow = Pick<
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

// Migrations are applied by hand, so a reader of a newer table returns nothing until it exists;
// every other error is real.
function emptyOrThrow<T>(error: { code?: string }, empty: T): T {
  if (isMissingTable(error)) return empty;
  throw error;
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

const toCafe = (r: CafeRow): Cafe => ({
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

const toDrink = (r: DrinkRow): Drink => ({
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
  if (ratingsError) return emptyOrThrow(ratingsError, []);
  const ratingByCafe = new Map(ratings.map((r) => [r.cafe_id, r]));

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
    const survivor = await cafeSlugById(supabase, row.merged_into);
    return survivor ? redirect(cafeHref(survivor)) : MISSING;
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
  if (error) throw error;
  return new Map(data.map((p) => [p.id, p.display_name]));
}

async function loadDrinkReviews(supabase: Client, drinkId: string): Promise<Review[]> {
  const { data, error } = await supabase.rpc('drink_reviews', { drink: drinkId });
  if (error) throw error;
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

// A merged drink forwards to the drink that absorbed it; if that one cannot be read, the café
// page is the nearest page that still exists.
async function mergedDrinkRedirect(
  supabase: Client,
  survivorId: string,
  cafeRow: { id: string; slug: string }
): Promise<PageRedirect> {
  const { data: survivor, error } = await supabase
    .from('drinks')
    .select('slug, cafe_id')
    .eq('id', survivorId)
    .maybeSingle();
  if (error) throw error;
  if (!survivor) return redirect(cafeHref(cafeRow.slug));
  const survivorCafe =
    survivor.cafe_id === cafeRow.id ? cafeRow.slug : await cafeSlugById(supabase, survivor.cafe_id);
  return redirect(survivorCafe ? drinkHref(survivorCafe, survivor.slug) : cafeHref(cafeRow.slug));
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
    const survivor = await cafeSlugById(supabase, cafeRow.merged_into);
    return survivor ? redirect(drinkHref(survivor, drinkSlug)) : MISSING;
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

  if (row.merged_into) return mergedDrinkRedirect(supabase, row.merged_into, cafeRow);
  if (row.status === 'rejected') return redirect(cafeHref(cafeRow.slug));

  const [{ data: rating, error: ratingError }, reviews, teaProduct] = await Promise.all([
    supabase.from('drink_ratings').select(RATING_COLUMNS).eq('drink_id', row.id).maybeSingle(),
    loadDrinkReviews(supabase, row.id),
    loadTeaProduct(supabase, row.tea_product_id),
  ]);
  if (ratingError) throw ratingError;

  return {
    kind: 'found',
    drink: { ...toDrink(row), scores: toScores(rating), cafe: cafeSummary(toCafe(cafeRow)) },
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

// Approved cafés and drinks for the sitemap. Merged ones are left out: they redirect.
export async function listCafeSitemapEntries(supabase: Client): Promise<CafeSitemapEntry[]> {
  const { data: cafes, error } = await supabase
    .from('cafes')
    .select('id, slug, updated_at')
    .eq('status', 'approved')
    .is('merged_into', null)
    .order('slug');
  if (error) return emptyOrThrow(error, []);

  const { data: drinks, error: drinksError } = await supabase
    .from('drinks')
    .select('cafe_id, slug, updated_at')
    .eq('status', 'approved')
    .is('merged_into', null)
    .order('slug');
  if (drinksError) return emptyOrThrow(drinksError, []);

  const slugByCafe = new Map(cafes.map((c) => [c.id, c.slug]));
  return cafes.flatMap((cafe) => [
    { path: cafeHref(cafe.slug), lastModified: cafe.updated_at },
    ...drinks
      .filter((d) => d.cafe_id === cafe.id)
      .map((d) => ({
        path: drinkHref(slugByCafe.get(cafe.id) ?? cafe.slug, d.slug),
        lastModified: d.updated_at,
      })),
  ]);
}
