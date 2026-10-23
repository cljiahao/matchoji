import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ReportTarget } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

type Client = SupabaseClient<Database>;

export interface ReviewComment {
  id: string;
  reviewId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Reactions {
  likes: number;
  liked: boolean;
  comments: ReviewComment[];
}

async function namesFor(supabase: Client, ids: string[]): Promise<Map<string, string>> {
  const { data, error } = await selectIn([...new Set(ids)], (batch) =>
    supabase.from('public_profiles').select('id, display_name').in('id', batch)
  );
  if (error) throw error;
  return new Map(data.map((p) => [p.id, p.display_name]));
}

// Likes and comments for the reviews on a tea page, keyed by review id.
export async function loadReactions(
  supabase: Client,
  reviewIds: string[],
  viewerId: string | null
): Promise<Record<string, Reactions>> {
  if (reviewIds.length === 0) return {};
  const [likes, comments] = await Promise.all([
    selectIn(reviewIds, (ids) =>
      supabase.from('review_likes').select('review_id, user_id').in('review_id', ids)
    ),
    selectIn(reviewIds, (ids) =>
      supabase
        .from('review_comments')
        .select('id, review_id, user_id, body, created_at')
        .in('review_id', ids)
        .order('created_at')
    ),
  ]);
  if (likes.error) throw likes.error;
  if (comments.error) throw comments.error;
  const names = await namesFor(
    supabase,
    comments.data.map((c) => c.user_id)
  );

  const result: Record<string, Reactions> = Object.fromEntries(
    reviewIds.map((id) => [id, { likes: 0, liked: false, comments: [] as ReviewComment[] }])
  );
  for (const like of likes.data) {
    result[like.review_id].likes += 1;
    if (like.user_id === viewerId) result[like.review_id].liked = true;
  }
  for (const c of comments.data)
    result[c.review_id].comments.push({
      id: c.id,
      reviewId: c.review_id,
      body: c.body,
      authorId: c.user_id,
      authorName: names.get(c.user_id) ?? 'Former taster',
      createdAt: c.created_at,
    });
  return result;
}

export async function setLiked(
  supabase: Client,
  me: string,
  reviewId: string,
  like: boolean
): Promise<void> {
  const { error } = like
    ? await supabase.from('review_likes').insert({ review_id: reviewId, user_id: me })
    : await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', me);
  if (error) throw error;
}

export async function addComment(supabase: Client, reviewId: string, body: string) {
  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id: reviewId, body: body.trim() })
    .select('id, review_id, user_id, body, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(supabase: Client, commentId: string): Promise<void> {
  const { error } = await supabase.from('review_comments').delete().eq('id', commentId);
  if (error) throw error;
}

export async function reportContent(
  supabase: Client,
  target: ReportTarget,
  targetId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('content_reports')
    .insert({ target_type: target, target_id: targetId, reason: reason.trim() });
  if (error) throw error;
}
