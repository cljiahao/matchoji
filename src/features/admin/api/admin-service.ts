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

export interface OpenReport {
  id: string;
  targetType: 'review' | 'comment';
  targetId: string;
  reason: string;
  createdAt: string;
  reporterName: string;
  // What was reported, for the admin to judge; null if it is already gone.
  content: { text: string; authorName: string; productId: string | null } | null;
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
      supabase.from('reviews').select('id, user_id, product_id, notes, stars').in('id', batch)
    ),
    selectIn(ids('comment'), (batch) =>
      supabase.from('review_comments').select('id, user_id, review_id, body').in('id', batch)
    ),
  ]);
  if (reviews.error) throw reviews.error;
  if (comments.error) throw comments.error;

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
        };
    } else {
      const comment = commentById.get(r.target_id);
      if (comment)
        content = { text: comment.body, authorName: nameOf(comment.user_id), productId: null };
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
