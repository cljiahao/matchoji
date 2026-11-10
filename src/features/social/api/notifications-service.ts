import type { SupabaseClient } from '@supabase/supabase-js';

import { drinkHref, loadDrinkSummaries, type DrinkSummary } from '@/features/reviews';
import type { Database, NotificationKind } from '@/integrations/supabase/database.types';
import { isMissingTable } from '@/integrations/supabase/missing-table';
import { selectIn } from '@/integrations/supabase/select-in';
import { MARKETPLACE_ENABLED } from '@/lib/constants/env';

type Client = SupabaseClient<Database>;

export interface Notification {
  id: number;
  kind: NotificationKind;
  actorId: string | null;
  actorName: string | null;
  reviewId: string | null;
  productId: string | null;
  // Where the drink or café the notification concerns lives, resolved from its slugs.
  drinkPath: string | null;
  cafePath: string | null;
  body: string | null;
  read: boolean;
  createdAt: string;
}

const LATEST = 20;

function drinkPathFor(drinks: Map<string, DrinkSummary>, drinkId: string | null): string | null {
  const drink = drinkId ? drinks.get(drinkId) : undefined;
  return drink ? drinkHref(drink.cafe.slug, drink.slug) : null;
}

async function loadCafeSlugs(supabase: Client, ids: string[]): Promise<Map<string, string>> {
  const { data, error } = await selectIn(ids, (batch) =>
    supabase.from('cafes').select('id, slug').in('id', batch)
  );
  if (error) {
    if (isMissingTable(error)) return new Map();
    throw error;
  }
  return new Map(data.map((c) => [c.id, c.slug]));
}

// The reader's latest notifications (RLS returns only theirs), with who did what.
export async function listNotifications(supabase: Client): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, kind, actor_id, review_id, product_id, drink_id, cafe_id, body, read_at, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(LATEST);
  if (error) throw error;
  const { data: names, error: namesError } = await selectIn(
    [...new Set(data.flatMap((n) => (n.actor_id ? [n.actor_id] : [])))],
    (ids) => supabase.from('public_profiles').select('id, display_name').in('id', ids)
  );
  if (namesError) throw namesError;
  const nameById = new Map(names.map((n) => [n.id, n.display_name]));
  const drinks = await loadDrinkSummaries(
    supabase,
    data.flatMap((n) => (n.drink_id ? [n.drink_id] : []))
  );
  const cafeSlugs = await loadCafeSlugs(
    supabase,
    data.flatMap((n) => (n.cafe_id ? [n.cafe_id] : []))
  );
  return data.map((n) => ({
    id: n.id,
    kind: n.kind,
    actorId: n.actor_id,
    actorName: n.actor_id ? (nameById.get(n.actor_id) ?? 'Someone') : null,
    reviewId: n.review_id,
    productId: n.product_id,
    drinkPath: drinkPathFor(drinks, n.drink_id),
    cafePath: n.cafe_id && cafeSlugs.has(n.cafe_id) ? `/cafes/${cafeSlugs.get(n.cafe_id)}` : null,
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
    // drink_reviewed and cafe_reviewed carry their own sentence from the moderation decision.
    default:
      return n.body ?? '';
  }
}

// Where tapping a notification goes: the actor's profile, or the tea concerned.
export function notificationHref(n: Notification): string | null {
  if (n.kind === 'follow' && n.actorId) return `/u/${n.actorId}`;
  if (n.drinkPath) return n.drinkPath;
  if (n.cafePath) return n.cafePath;
  if (n.productId) return `/products/${n.productId}`;
  // A shop's review outcome leads to /sell, which is hidden while the marketplace is parked.
  if (n.kind === 'shop_reviewed') return MARKETPLACE_ENABLED ? '/sell' : '/account';
  return null;
}
