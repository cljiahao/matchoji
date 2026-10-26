import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const AIKO = '11111111-1111-4111-8111-111111111111';
const BEN = '22222222-2222-4222-8222-222222222222';
const CHO = '33333333-3333-4333-8333-333333333333';
const ADMIN = '44444444-4444-4444-8444-444444444444';
const STORAGE = 'https://skajpelucxgovxajlzvo.supabase.co/storage/v1/object/public/review-photos';

let db: PGlite;
let tea: string;

async function as<T>(id: string | null, run: () => Promise<T>): Promise<T> {
  await db.exec(
    id ? `set request.jwt.claim.sub = '${id}'; set role authenticated;` : 'set role anon;'
  );
  try {
    return await run();
  } finally {
    await db.exec('reset role; reset request.jwt.claim.sub;');
  }
}

const rows = async <T>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows;

const rate = (who: string, extra: { photo?: string; createdAt?: string } = {}) =>
  as(who, () =>
    rows<{ id: string; created_at: string }>(
      `insert into public.reviews (user_id, product_id, stars, photo_url, created_at)
       values (auth.uid (), $1, 4, $2, coalesce($3::timestamptz, now()))
       returning id, created_at`,
      [tea, extra.photo ?? null, extra.createdAt ?? null]
    )
  ).then((r) => r[0]);

beforeAll(async () => {
  db = await createMigratedDb();
  for (const [id, name] of [
    [AIKO, 'Aiko'],
    [BEN, 'Ben'],
    [CHO, 'Cho'],
    [ADMIN, 'Admin'],
  ])
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, jsonb_build_object('full_name', $3::text))`,
      [id, `${name}@example.com`, name]
    );
  await db.query('update public.profiles set is_admin = true where id = $1', [ADMIN]);
  tea = (
    await rows<{ id: string }>(
      `insert into public.products (name, category, status) values ('Sayaka', 'matcha', 'approved') returning id`
    )
  )[0].id;
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('server timestamps (finding 1)', () => {
  it('ignores a created_at sent through the API', async () => {
    const review = await rate(CHO, { createdAt: '2000-01-01T00:00:00Z' });
    expect(new Date(review.created_at).getFullYear()).toBeGreaterThan(2000);
    await db.query('delete from public.reviews where id = $1', [review.id]);
  });

  it('keeps a created_at set by the owner, for seeds and tests', async () => {
    const [row] = await rows<{ created_at: string }>(
      `insert into public.reviews (user_id, product_id, stars, created_at)
       values ($1, $2, 3, '2001-01-01T00:00:00Z') returning created_at`,
      [CHO, tea]
    );
    expect(new Date(row.created_at).getUTCFullYear()).toBe(2001);
    await db.query('delete from public.reviews where user_id = $1', [CHO]);
  });

  it('puts daily limits on likes and follows', async () => {
    const triggers = await rows<{ tgname: string }>(
      `select tgname from pg_trigger
       where tgname in ('review_likes_daily_limit', 'follows_daily_limit') order by tgname`
    );
    expect(triggers.map((t) => t.tgname)).toEqual([
      'follows_daily_limit',
      'review_likes_daily_limit',
    ]);
  });
});

describe('review photos (finding 2)', () => {
  it('accepts only a file in the author’s folder on this project’s storage', async () => {
    const ok = await rate(CHO, { photo: `${STORAGE}/${CHO}/cup.jpg` });
    await db.query('delete from public.reviews where id = $1', [ok.id]);

    for (const photo of [
      `https://tracker.example/p.gif?/storage/v1/object/public/review-photos/${CHO}/`,
      `https://other.supabase.co/storage/v1/object/public/review-photos/${CHO}/cup.jpg`,
      `${STORAGE}/${CHO}/cup.jpg?track=1`,
      `${STORAGE}/${AIKO}/cup.jpg`,
    ]) {
      await expect(rate(CHO, { photo })).rejects.toThrow(/reviews_photo_is_own_upload/);
    }
  });
});

describe('private profiles (finding 3)', () => {
  let privateReview: string;

  beforeAll(async () => {
    await rate(AIKO);
    privateReview = (await rate(BEN, { photo: `${STORAGE}/${BEN}/cup.jpg` })).id;
    await as(BEN, () => db.exec('update public.profiles set is_public = false'));
  });

  it('hides a private taster’s reviews from visitors and other users', async () => {
    const byBen = 'select id from public.reviews where user_id = $1';
    expect(await as(null, () => rows(byBen, [BEN]))).toEqual([]);
    expect(await as(CHO, () => rows(byBen, [BEN]))).toEqual([]);
    expect(await as(BEN, () => rows(byBen, [BEN]))).toEqual([{ id: privateReview }]);
    expect(await as(ADMIN, () => rows(byBen, [BEN]))).toEqual([{ id: privateReview }]);
    expect(await as(null, () => rows(byBen, [AIKO]))).toHaveLength(1);
  });

  it('still lists the tasting on the tea page, without author or photo', async () => {
    const page = await as(null, () =>
      rows<{ user_id: string | null; author_private: boolean; photo_url: string | null }>(
        'select user_id, author_private, photo_url from public.product_reviews ($1) order by author_private',
        [tea]
      )
    );
    expect(page).toEqual([
      { user_id: AIKO, author_private: false, photo_url: null },
      { user_id: null, author_private: true, photo_url: null },
    ]);
    const own = await as(BEN, () =>
      rows<{ user_id: string; photo_url: string }>(
        'select user_id, photo_url from public.product_reviews ($1) where user_id = auth.uid ()',
        [tea]
      )
    );
    expect(own).toEqual([{ user_id: BEN, photo_url: `${STORAGE}/${BEN}/cup.jpg` }]);
  });

  it('keeps the private tasting in the tea’s score and taste profile', async () => {
    expect(
      await as(null, () =>
        rows('select review_count from public.product_ratings where product_id = $1', [tea])
      )
    ).toEqual([{ review_count: 2 }]);
  });

  it('keeps a private taster out of followers’ feeds and hides their follows', async () => {
    await as(CHO, () =>
      db.query('insert into public.follows (follower_id, followee_id) values (auth.uid (), $1)', [
        BEN,
      ])
    );
    expect(await as(CHO, () => rows('select id from public.following_feed ()'))).toEqual([]);
    const ofBen = 'select follower_id from public.follows where followee_id = $1';
    expect(await as(null, () => rows(ofBen, [BEN]))).toEqual([]);
    expect(await as(AIKO, () => rows(ofBen, [BEN]))).toEqual([]);
    expect(await as(BEN, () => rows(ofBen, [BEN]))).toEqual([{ follower_id: CHO }]);
    await db.query('delete from public.follows');
  });

  it('lets anyone react to the tasting, and its author still moderate comments', async () => {
    await as(CHO, () =>
      db.query('insert into public.review_comments (review_id, body) values ($1, $2)', [
        privateReview,
        'Lovely',
      ])
    );
    await as(BEN, () =>
      db.query('delete from public.review_comments where review_id = $1', [privateReview])
    );
    expect(await rows('select id from public.review_comments')).toEqual([]);
  });

  afterAll(async () => {
    await db.exec('update public.profiles set is_public = true');
    await db.exec('delete from public.reviews');
  });
});

describe('blocks (finding 4)', () => {
  beforeAll(async () => {
    await as(AIKO, () =>
      db.query('insert into public.blocks (blocker_id, blocked_id) values (auth.uid (), $1)', [BEN])
    );
  });

  it('cannot be looked up by visitors or by anyone outside the pair', async () => {
    await expect(
      as(null, () => rows('select public.is_blocked_between ($1, $2)', [AIKO, BEN]))
    ).rejects.toThrow(/permission denied/);
    expect(
      await as(CHO, () => rows('select public.is_blocked_between ($1, $2) as b', [AIKO, BEN]))
    ).toEqual([{ b: false }]);
    expect(
      await as(BEN, () => rows('select public.is_blocked_between ($1, $2) as b', [AIKO, BEN]))
    ).toEqual([{ b: true }]);
  });

  it('no longer names a review’s author to callers, yet still stops reactions across a block', async () => {
    const review = await rate(AIKO);
    await expect(
      as(CHO, () => rows('select public.review_author ($1)', [review.id]))
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(BEN, () =>
        db.query('insert into public.review_likes (review_id) values ($1)', [review.id])
      )
    ).rejects.toThrow(/row-level security/);
    await as(CHO, () =>
      db.query('insert into public.review_likes (review_id, user_id) values ($1, auth.uid ())', [
        review.id,
      ])
    );
    await db.exec('delete from public.review_likes; delete from public.reviews;');
  });

  afterAll(async () => {
    await db.exec('delete from public.blocks');
  });
});

describe('account deletion (finding 5)', () => {
  it('removes the person’s id from follows, blocks and reports in the audit trail, and their photo', async () => {
    const GONE = '55555555-5555-4555-8555-555555555555';
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'gone@example.com', '{}')`,
      [GONE]
    );
    await as(GONE, async () => {
      await db.query(
        'insert into public.follows (follower_id, followee_id) values (auth.uid (), $1)',
        [AIKO]
      );
      await db.query(
        'insert into public.blocks (blocker_id, blocked_id) values (auth.uid (), $1)',
        [CHO]
      );
    });
    await rate(GONE, { photo: `${STORAGE}/${GONE}/cup.jpg` });

    await as(GONE, () => db.exec('select public.delete_my_account ()'));

    expect(
      await rows(
        `select count(*)::int as n from public.audit_log
         where old_row::text like '%' || $1 || '%' or new_row::text like '%' || $1 || '%'`,
        [GONE]
      )
    ).toEqual([{ n: 0 }]);
    expect(await rows('select photo_url from public.reviews where user_id is null')).toEqual([
      { photo_url: null },
    ]);
  });
});

describe('admin-only fields (low)', () => {
  it('refuse a suggested tea that arrives merged or with an admin note', async () => {
    for (const extra of [`merged_into = '${tea}'`, `review_note = 'Approved by staff'`]) {
      const [column, value] = extra.split(' = ');
      await expect(
        as(CHO, () =>
          db.exec(
            `insert into public.products (name, category, status, added_by, ${column})
             values ('Fake ${column}', 'matcha', 'pending', auth.uid (), ${value})`
          )
        )
      ).rejects.toThrow(/row-level security/);
    }
  });

  it('refuse a shop application that carries an admin note', async () => {
    await expect(
      as(CHO, () =>
        db.exec(
          `insert into public.vendors (user_id, name, review_note) values (auth.uid (), 'Shop', 'ok')`
        )
      )
    ).rejects.toThrow(/row-level security/);
  });
});
