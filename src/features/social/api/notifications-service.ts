import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, NotificationKind } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

type Client = SupabaseClient<Database>;

export interface Notification {
  id: number;
  kind: NotificationKind;
  actorId: string | null;
  actorName: string | null;
  reviewId: string | null;
  productId: string | null;
  body: string | null;
  read: boolean;
  createdAt: string;
}

const LATEST = 20;

// The reader's latest notifications (RLS returns only theirs), with who did what.
export async function listNotifications(supabase: Client): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, kind, actor_id, review_id, product_id, body, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(LATEST);
  if (error) throw error;
  const { data: names, error: namesError } = await selectIn(
    [...new Set(data.flatMap((n) => (n.actor_id ? [n.actor_id] : [])))],
    (ids) => supabase.from('public_profiles').select('id, display_name').in('id', ids)
  );
  if (namesError) throw namesError;
  const nameById = new Map(names.map((n) => [n.id, n.display_name]));
  return data.map((n) => ({
    id: n.id,
    kind: n.kind,
    actorId: n.actor_id,
    actorName: n.actor_id ? (nameById.get(n.actor_id) ?? 'Someone') : null,
    reviewId: n.review_id,
    productId: n.product_id,
    body: n.body,
    read: n.read_at !== null,
    createdAt: n.created_at,
  }));
}

export async function markAllRead(supabase: Client, me: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', me)
    .is('read_at', null);
  if (error) throw error;
}

// One line of copy per notification, naming the actor where there is one.
export function describeNotification(n: Notification): string {
  const who = n.actorName ?? 'Someone';
  switch (n.kind) {
    case 'follow':
      return `${who} started following you.`;
    case 'like':
      return `${who} liked your tasting.`;
    case 'comment':
      return `${who} commented: “${n.body ?? ''}”`;
    default:
      return n.body ?? '';
  }
}

// Where tapping a notification goes: the actor's profile, or the tea concerned.
export function notificationHref(n: Notification): string | null {
  if (n.kind === 'follow' && n.actorId) return `/u/${n.actorId}`;
  if (n.productId) return `/products/${n.productId}`;
  if (n.kind === 'shop_reviewed') return '/sell';
  return null;
}
