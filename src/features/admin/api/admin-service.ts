import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import {
  cafeFieldsSchema,
  decisionSchema,
  drinkFieldsSchema,
  idSchema,
  noteSchema,
  searchTermSchema,
  type CafeFields,
  type DrinkFields,
} from '../schemas';
import type {
  AdminCafe,
  AdminDrink,
  AdminProfile,
  CatalogueTea,
  ReviewDecision,
  ReviewQueue,
} from '../types';

type Client = SupabaseClient<Database>;

// The café migration is applied by hand, so until it is the new tabs show nothing rather than an
// error (same fallback as the shops feature).
const MISSING_TABLE = new Set(['42P01', 'PGRST205']);
const isMissing = (error: { code?: string }) =>
  Boolean(error.code && MISSING_TABLE.has(error.code));

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

export async function listApprovedTeas(supabase: Client): Promise<CatalogueTea[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, category, image_url, image_credit, shop_url')
    .eq('status', 'approved')
    .order('name');
  if (error) throw error;
  return data.map(({ image_url, image_credit, shop_url, ...tea }) => ({
    ...tea,
    imageUrl: image_url,
    imageCredit: image_credit,
    shopUrl: shop_url,
  }));
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

// image null keeps the current photo; '' removes it and its credit.
export async function setTeaLinks(
  supabase: Client,
  tea: string,
  links: { image: string | null; shop: string; credit: string }
): Promise<void> {
  const { error } = await supabase.rpc('set_tea_links', { tea, ...links });
  if (error) throw error;
}

// A tea's reference price for one pack, or null to clear it.
export async function setTeaPrice(
  supabase: Client,
  tea: string,
  price: { price: number; grams: number } | null
): Promise<void> {
  const { error } = await supabase.rpc('set_tea_price', {
    tea,
    price: price?.price ?? null,
    grams: price?.grams ?? null,
  });
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

// The generated reviews row predates drink reviews, so the columns this queue reads are typed here.
interface ReportedReviewRow {
  id: string;
  user_id: string | null;
  product_id: string | null;
  drink_id: string | null;
  notes: string | null;
  stars: number;
}

export interface OpenReport {
  id: string;
  targetType: 'review' | 'comment';
  targetId: string;
  reason: string;
  createdAt: string;
  reporterName: string;
  // What was reported, for the admin to judge; null if it is already gone.
  content: {
    text: string;
    authorName: string;
    productId: string | null;
    // Set for a drink review: where it was said, shown in place of a tea link.
    drinkLabel: string | null;
  } | null;
}

// Open reports, oldest first, with the reported text alongside (admins can read every report).
export async function listOpenReports(supabase: Client): Promise<OpenReport[]> {
  const { data: reports, error } = await supabase
    .from('content_reports')
    .select('id, reporter_id, target_type, target_id, reason, created_at')
    .eq('status', 'open')
    .order('created_at');
  if (error) throw error;
  if (reports.length === 0) return [];

  const ids = (type: 'review' | 'comment') =>
    reports.filter((r) => r.target_type === type).map((r) => r.target_id);
  const [reviews, comments] = await Promise.all([
    selectIn(ids('review'), (batch) =>
      supabase
        .from('reviews')
        .select('id, user_id, product_id, drink_id, notes, stars')
        .in('id', batch)
        .returns<ReportedReviewRow[]>()
    ),
    selectIn(ids('comment'), (batch) =>
      supabase.from('review_comments').select('id, user_id, review_id, body').in('id', batch)
    ),
  ]);
  if (reviews.error) throw reviews.error;
  if (comments.error) throw comments.error;

  const drinkIds = [...new Set(reviews.data.flatMap((r) => (r.drink_id ? [r.drink_id] : [])))];
  const drinks = await selectIn(drinkIds, (batch) =>
    supabase.from('admin_drinks').select('id, name, cafe_id').in('id', batch)
  );
  if (drinks.error) throw drinks.error;
  const cafes = await selectIn([...new Set(drinks.data.map((d) => d.cafe_id))], (batch) =>
    supabase.from('admin_cafes').select('id, name').in('id', batch)
  );
  if (cafes.error) throw cafes.error;
  const cafeName = new Map(cafes.data.map((c) => [c.id, c.name]));
  const drinkLabel = new Map(
    drinks.data.map((d) => [d.id, `${cafeName.get(d.cafe_id) ?? 'Unknown café'} · ${d.name}`])
  );

  const people = [
    ...reports.map((r) => r.reporter_id),
    ...reviews.data.flatMap((r) => (r.user_id ? [r.user_id] : [])),
    ...comments.data.map((c) => c.user_id),
  ];
  const { data: names, error: namesError } = await selectIn([...new Set(people)], (batch) =>
    supabase.from('public_profiles').select('id, display_name').in('id', batch)
  );
  if (namesError) throw namesError;
  const nameOf = (id: string | null) =>
    (id && names.find((n) => n.id === id)?.display_name) || 'Former taster';
  const reviewById = new Map(reviews.data.map((r) => [r.id, r]));
  const commentById = new Map(comments.data.map((c) => [c.id, c]));

  return reports.map((r) => {
    let content: OpenReport['content'] = null;
    if (r.target_type === 'review') {
      const review = reviewById.get(r.target_id);
      if (review)
        content = {
          text: `${review.stars}★ ${review.notes ?? ''}`.trim(),
          authorName: nameOf(review.user_id),
          productId: review.product_id,
          // A drink review has no tea; name the café and drink instead of leaving the target blank.
          drinkLabel: review.drink_id
            ? (drinkLabel.get(review.drink_id) ?? 'A drink that is no longer listed')
            : null,
        };
    } else {
      const comment = commentById.get(r.target_id);
      if (comment)
        content = {
          text: comment.body,
          authorName: nameOf(comment.user_id),
          productId: null,
          drinkLabel: null,
        };
    }
    return {
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      createdAt: r.created_at,
      reporterName: nameOf(r.reporter_id),
      content,
    };
  });
}

export async function resolveReport(
  supabase: Client,
  report: string,
  decision: 'removed' | 'dismissed',
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('resolve_report', { report, decision, note });
  if (error) throw error;
}

// --- Cafés, drinks and trusted tasters ---
// Reads go through admin_cafes / admin_drinks: the base tables hide who added a row and the
// review note from every client, and those views add the adder's name for admins only.

const CAFE_COLUMNS =
  'id, name, city_slug, area, address, lat, lng, instagram_handle, website_url, status, created_at, adder_name';
const DRINK_COLUMNS =
  'id, cafe_id, name, base, style, serving, price, photo_url, photo_credit, tea_product_id, status, created_at, adder_name';

type CafeRow = Pick<
  Database['public']['Views']['admin_cafes']['Row'],
  | 'id'
  | 'name'
  | 'city_slug'
  | 'area'
  | 'address'
  | 'lat'
  | 'lng'
  | 'instagram_handle'
  | 'website_url'
  | 'status'
  | 'created_at'
  | 'adder_name'
>;

const toCafe = (r: CafeRow): AdminCafe => ({
  id: r.id,
  name: r.name,
  citySlug: r.city_slug,
  area: r.area,
  address: r.address,
  lat: r.lat,
  lng: r.lng,
  instagramHandle: r.instagram_handle,
  websiteUrl: r.website_url,
  status: r.status,
  createdAt: r.created_at,
  addedByName: r.adder_name,
});

// Pickers and queues load a page, not the whole table; a search narrows by name.
export const LIST_LIMIT = 200;

export interface ListOptions {
  search?: string;
  limit?: number;
}

// The term as a LIKE pattern: wildcards typed by the admin match themselves.
function likePattern(search: string | undefined): string | null {
  const term = searchTermSchema.parse(search ?? '').replace(/[\\%_]/g, (c) => `\\${c}`);
  return term ? `%${term}%` : null;
}

async function listCafes(
  supabase: Client,
  status: 'pending' | 'approved',
  { search, limit = LIST_LIMIT }: ListOptions = {}
): Promise<AdminCafe[]> {
  let query = supabase.from('admin_cafes').select(CAFE_COLUMNS).eq('status', status);
  const pattern = likePattern(search);
  if (pattern) query = query.ilike('name', pattern);
  const { data, error } = await query
    .order(status === 'pending' ? 'created_at' : 'name')
    .limit(limit);
  if (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  return data.map(toCafe);
}

async function listDrinks(
  supabase: Client,
  status: 'pending' | 'approved',
  { search, limit = LIST_LIMIT }: ListOptions = {}
): Promise<AdminDrink[]> {
  let query = supabase.from('admin_drinks').select(DRINK_COLUMNS).eq('status', status);
  const pattern = likePattern(search);
  if (pattern) query = query.ilike('name', pattern);
  const { data, error } = await query
    .order(status === 'pending' ? 'created_at' : 'name')
    .limit(limit);
  if (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  if (data.length === 0) return [];
  const cafes = await selectIn([...new Set(data.map((d) => d.cafe_id))], (ids) =>
    supabase.from('admin_cafes').select('id, name').in('id', ids)
  );
  // The drinks were found, so a failing café lookup is a real fault, not an empty list.
  if (cafes.error) throw cafes.error;
  const cafeName = new Map(cafes.data.map((c) => [c.id, c.name]));
  return data.map((r) => ({
    id: r.id,
    cafeId: r.cafe_id,
    cafeName: cafeName.get(r.cafe_id) ?? 'Unknown café',
    name: r.name,
    base: r.base,
    style: r.style,
    serving: r.serving,
    price: r.price,
    photoUrl: r.photo_url,
    photoCredit: r.photo_credit,
    teaProductId: r.tea_product_id,
    status: r.status,
    createdAt: r.created_at,
    addedByName: r.adder_name,
  }));
}

export const listCafeQueue = (supabase: Client, options?: ListOptions) =>
  listCafes(supabase, 'pending', options);
export const listDrinkQueue = (supabase: Client, options?: ListOptions) =>
  listDrinks(supabase, 'pending', options);
// Approved rows: the merge targets and the edit pickers.
export const listApprovedCafes = (supabase: Client, options?: ListOptions) =>
  listCafes(supabase, 'approved', options);
export const listApprovedDrinks = (supabase: Client, options?: ListOptions) =>
  listDrinks(supabase, 'approved', options);

// review_drink('approved') raises for a drink at a café that is not approved; the message goes
// to the admin as it is.
export async function reviewCafe(
  supabase: Client,
  id: string,
  decision: ReviewDecision,
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('review_cafe', {
    cafe: idSchema.parse(id),
    decision: decisionSchema.parse(decision),
    note: noteSchema.parse(note),
  });
  if (error) throw error;
}

export async function reviewDrink(
  supabase: Client,
  id: string,
  decision: ReviewDecision,
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('review_drink', {
    drink: idSchema.parse(id),
    decision: decisionSchema.parse(decision),
    note: noteSchema.parse(note),
  });
  if (error) throw error;
}

// The database refuses a cross-city merge, and a merge that clashes into a non-approved drink.
export async function mergeCafe(supabase: Client, duplicate: string, keep: string): Promise<void> {
  const { error } = await supabase.rpc('merge_cafe', {
    duplicate: idSchema.parse(duplicate),
    keep: idSchema.parse(keep),
  });
  if (error) throw error;
}

export async function mergeDrink(supabase: Client, duplicate: string, keep: string): Promise<void> {
  const { error } = await supabase.rpc('merge_drink', {
    duplicate: idSchema.parse(duplicate),
    keep: idSchema.parse(keep),
  });
  if (error) throw error;
}

// fields holds only the keys to change; an empty string clears an optional text field.
export async function updateCafe(supabase: Client, id: string, fields: CafeFields): Promise<void> {
  const { error } = await supabase.rpc('update_cafe', {
    cafe: idSchema.parse(id),
    fields: cafeFieldsSchema.parse(fields),
  });
  if (error) throw error;
}

export async function updateDrink(
  supabase: Client,
  id: string,
  fields: DrinkFields
): Promise<void> {
  const { error } = await supabase.rpc('update_drink', {
    drink: idSchema.parse(id),
    fields: drinkFieldsSchema.parse(fields),
  });
  if (error) throw error;
}

const PROFILE_COLUMNS = 'id, display_name, is_public, is_trusted_taster, instagram_handle';
type ProfileRow = Database['public']['Views']['public_profiles']['Row'];
const toProfile = (
  r: Pick<ProfileRow, 'id' | 'display_name' | 'is_public' | 'is_trusted_taster'> &
    Partial<Pick<ProfileRow, 'instagram_handle'>>
) =>
  ({
    id: r.id,
    displayName: r.display_name,
    instagramHandle: r.instagram_handle ?? null,
    isPublic: r.is_public,
    isTrustedTaster: r.is_trusted_taster,
  }) satisfies AdminProfile;

const SEARCH_LIMIT = 10;

// public_profiles is the one profile list admins can read (profiles itself is owner-only, it
// holds email), and it includes private profiles. Display name or Instagram handle; no email
// search.
export async function searchProfiles(supabase: Client, q: string): Promise<AdminProfile[]> {
  // Escape LIKE wildcards so a typed % or _ matches itself; a leading @ is how handles are written.
  const term = searchTermSchema
    .parse(q)
    .replace(/^@/, '')
    .replace(/[\\%_]/g, (c) => `\\${c}`);
  if (!term) return [];
  // The pattern goes into the or() filter in double quotes so commas and dots in it are data;
  // inside quotes a backslash and a quote need their own escape.
  const escaped = term.replace(/[\\"]/g, (c) => `\\${c}`);
  const quoted = `"%${escaped}%"`;
  const { data, error } = await supabase
    .from('public_profiles')
    .select(PROFILE_COLUMNS)
    .or(`display_name.ilike.${quoted},instagram_handle.ilike.${quoted}`)
    .order('display_name')
    .limit(SEARCH_LIMIT);
  if (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  return data.map(toProfile);
}

export async function listTrustedTasters(supabase: Client): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select(PROFILE_COLUMNS)
    .eq('is_trusted_taster', true)
    .order('display_name');
  if (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  return data.map(toProfile);
}

// Granting also makes the profile public (the database does that); revoking leaves it as is.
export async function setTrustedTaster(
  supabase: Client,
  person: string,
  value: boolean
): Promise<void> {
  const { error } = await supabase.rpc('set_trusted_taster', {
    person: idSchema.parse(person),
    value,
  });
  if (error) throw error;
}
