import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  describeNotification,
  listNotifications,
  markAllRead,
  notificationHref,
  type Notification,
} from './notifications-service';
import {
  addComment,
  deleteComment,
  loadReactions,
  reportContent,
  setLiked,
} from './reactions-service';

describe('loadReactions', () => {
  it('counts likes, marks the viewer’s, and names commenters', async () => {
    const { client } = createFakeSupabase({
      review_likes: {
        data: [
          { review_id: 'r1', user_id: 'me' },
          { review_id: 'r1', user_id: 'u2' },
        ],
        error: null,
      },
      review_comments: {
        data: [
          {
            id: 'c1',
            review_id: 'r2',
            user_id: 'u2',
            body: 'Lovely',
            created_at: '2026-10-05T00:00:00Z',
          },
        ],
        error: null,
      },
      public_profiles: { data: [{ id: 'u2', display_name: 'Ben' }], error: null },
    });
    const reactions = await loadReactions(client, ['r1', 'r2'], 'me');
    expect(reactions.r1).toEqual({ likes: 2, liked: true, comments: [] });
    expect(reactions.r2.comments).toEqual([
      expect.objectContaining({ id: 'c1', authorName: 'Ben', body: 'Lovely' }),
    ]);
  });

  it('reads nothing for a tea without reviews', async () => {
    const { client, calls } = createFakeSupabase({});
    expect(await loadReactions(client, [], null)).toEqual({});
    expect(calls).toEqual([]);
  });

  it('throws when a read fails', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase({
      review_likes: { data: null, error },
      review_comments: { data: [], error: null },
    });
    await expect(loadReactions(client, ['r1'], null)).rejects.toBe(error);
  });
});

describe('reaction writes', () => {
  it('like, unlike, comment, delete and report as the caller', async () => {
    const ok = { data: null, error: null };
    const { client, calls } = createFakeSupabase({
      review_likes: ok,
      review_comments: [
        {
          data: { id: 'c1', review_id: 'r1', user_id: 'me', body: 'Nice', created_at: 'x' },
          error: null,
        },
        ok,
      ],
      content_reports: ok,
    });
    await setLiked(client, 'me', 'r1', true);
    await setLiked(client, 'me', 'r1', false);
    await addComment(client, 'r1', '  Nice  ');
    await deleteComment(client, 'c1');
    await reportContent(client, 'comment', 'c9', ' Spam ');

    expect(calls.filter((c) => ['insert', 'delete'].includes(c.method))).toEqual([
      { table: 'review_likes', method: 'insert', args: [{ review_id: 'r1', user_id: 'me' }] },
      { table: 'review_likes', method: 'delete', args: [] },
      { table: 'review_comments', method: 'insert', args: [{ review_id: 'r1', body: 'Nice' }] },
      { table: 'review_comments', method: 'delete', args: [] },
      {
        table: 'content_reports',
        method: 'insert',
        args: [{ target_type: 'comment', target_id: 'c9', reason: 'Spam' }],
      },
    ]);
  });

  it('surface a refusal', async () => {
    const error = new Error('row-level security');
    const { client } = createFakeSupabase({ review_comments: { data: null, error } });
    await expect(addComment(client, 'r1', 'hi')).rejects.toBe(error);
  });
});

describe('notifications', () => {
  const base: Notification = {
    id: 1,
    kind: 'follow',
    actorId: 'u2',
    actorName: 'Ben',
    reviewId: null,
    productId: null,
    body: null,
    read: false,
    createdAt: '2026-10-05T00:00:00Z',
  };

  it('lists the reader’s latest with actor names and marks them read', async () => {
    const { client, calls } = createFakeSupabase({
      notifications: [
        {
          data: [
            {
              id: 1,
              kind: 'like',
              actor_id: 'u2',
              review_id: 'r1',
              product_id: 'p1',
              body: null,
              read_at: null,
              created_at: '2026-10-05T00:00:00Z',
            },
          ],
          error: null,
        },
        { data: null, error: null },
      ],
      public_profiles: { data: [{ id: 'u2', display_name: 'Ben' }], error: null },
    });
    const [n] = await listNotifications(client);
    expect(n).toMatchObject({ kind: 'like', actorName: 'Ben', read: false, productId: 'p1' });
    await markAllRead(client, 'me');
    expect(calls).toContainEqual({ table: 'notifications', method: 'is', args: ['read_at', null] });
  });

  it('describe themselves and link somewhere useful', () => {
    expect(describeNotification(base)).toBe('Ben started following you.');
    expect(notificationHref(base)).toBe('/u/u2');
    expect(describeNotification({ ...base, kind: 'like', productId: 'p1' })).toBe(
      'Ben liked your tasting.'
    );
    expect(notificationHref({ ...base, kind: 'like', productId: 'p1' })).toBe('/products/p1');
    expect(describeNotification({ ...base, kind: 'comment', body: 'Nice' })).toBe(
      'Ben commented: “Nice”'
    );
    expect(
      describeNotification({
        ...base,
        kind: 'tea_reviewed',
        actorName: null,
        body: 'Hoshi is now in the catalogue.',
      })
    ).toBe('Hoshi is now in the catalogue.');
    expect(notificationHref({ ...base, kind: 'shop_reviewed', actorId: null })).toBe('/sell');
    expect(notificationHref({ ...base, kind: 'report_resolved', actorId: null })).toBeNull();
  });
});
