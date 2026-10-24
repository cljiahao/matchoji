import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const AUTHOR = '11111111-1111-4111-8111-111111111111';
const FAN = '22222222-2222-4222-8222-222222222222';
const ADMIN = '33333333-3333-4333-8333-333333333333';

let db: PGlite;
let tea: string;
let review: string;

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

const notices = (who: string) =>
  as(who, () =>
    rows<{ kind: string; body: string | null }>(
      'select kind, body from public.notifications order by id'
    )
  );

beforeAll(async () => {
  db = await createMigratedDb();
  for (const [id, name] of [
    [AUTHOR, 'Aiko'],
    [FAN, 'Ben'],
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
  review = (
    await as(AUTHOR, () =>
      rows<{ id: string }>(
        'insert into public.reviews (user_id, product_id, stars) values (auth.uid (), $1, 5) returning id',
        [tea]
      )
    )
  )[0].id;
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('likes and comments', () => {
  it('let people like and comment for themselves, and tell the review author', async () => {
    await as(FAN, () =>
      db.query('insert into public.review_likes (review_id, user_id) values ($1, auth.uid ())', [
        review,
      ])
    );
    await as(FAN, () =>
      db.query(
        `insert into public.review_comments (review_id, body) values ($1, 'Agreed, so creamy')`,
        [review]
      )
    );
    await as(AUTHOR, () =>
      db.query('insert into public.review_likes (review_id, user_id) values ($1, auth.uid ())', [
        review,
      ])
    );
    await expect(
      as(FAN, () =>
        db.query('insert into public.review_likes (review_id, user_id) values ($1, $2)', [
          review,
          AUTHOR,
        ])
      )
    ).rejects.toThrow(/duplicate key|row-level security/);

    expect(await notices(AUTHOR)).toEqual([
      { kind: 'like', body: null },
      { kind: 'comment', body: 'Agreed, so creamy' },
    ]);
    expect(
      await as(null, () => rows('select count(*)::int as n from public.review_likes'))
    ).toEqual([{ n: 2 }]);
  });

  it('let the review author delete a comment on their review, but not other people', async () => {
    const third = '44444444-4444-4444-8444-444444444444';
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'c@example.com', '{}')`,
      [third]
    );
    await as(third, () => db.exec('delete from public.review_comments'));
    expect(await rows('select count(*)::int as n from public.review_comments')).toEqual([{ n: 1 }]);
    await as(AUTHOR, () => db.exec('delete from public.review_comments'));
    expect(await rows('select count(*)::int as n from public.review_comments')).toEqual([{ n: 0 }]);
  });

  it('refuse reactions across a block and empty comments', async () => {
    await as(AUTHOR, () =>
      db.query('insert into public.blocks (blocker_id, blocked_id) values (auth.uid (), $1)', [FAN])
    );
    await expect(
      as(FAN, () =>
        db.query(`insert into public.review_comments (review_id, body) values ($1, 'hi')`, [review])
      )
    ).rejects.toThrow(/row-level security/);
    await as(AUTHOR, () => db.exec('delete from public.blocks'));
    await expect(
      as(FAN, () =>
        db.query(`insert into public.review_comments (review_id, body) values ($1, '  ')`, [review])
      )
    ).rejects.toThrow(/check constraint/);
  });
});

describe('notifications', () => {
  it('are private, can only be marked read, and come from follows and reviews of what you added', async () => {
    await as(FAN, () =>
      db.query('insert into public.follows (follower_id, followee_id) values (auth.uid (), $1)', [
        AUTHOR,
      ])
    );
    const added = (
      await as(FAN, () =>
        rows<{ id: string }>(
          `insert into public.products (name, category) values ('Hoshi', 'matcha') returning id`
        )
      )
    )[0].id;
    await as(ADMIN, () =>
      db.query(`select public.review_tea ($1, 'rejected', 'Duplicate')`, [added])
    );

    expect((await notices(AUTHOR)).map((n) => n.kind)).toContain('follow');
    expect(await notices(FAN)).toEqual([
      { kind: 'tea_reviewed', body: 'Hoshi was not added: Duplicate' },
    ]);
    expect(await notices(ADMIN)).toEqual([]);

    await as(FAN, () => db.exec('update public.notifications set read_at = now()'));
    expect(
      await rows('select count(*)::int as n from public.notifications where read_at is not null')
    ).toEqual([{ n: 1 }]);
    await expect(
      as(FAN, () => db.exec(`update public.notifications set body = 'x'`))
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(FAN, () =>
        db.query(`insert into public.notifications (user_id, kind) values ($1, 'follow')`, [AUTHOR])
      )
    ).rejects.toThrow(/permission denied/);
  });
});

describe('reports', () => {
  it('are private to the reporter, and only admins resolve them, telling every reporter', async () => {
    const comment = (
      await as(FAN, () =>
        rows<{ id: string }>(
          `insert into public.review_comments (review_id, body) values ($1, 'spam spam') returning id`,
          [review]
        )
      )
    )[0].id;
    const report = (
      await as(AUTHOR, () =>
        rows<{ id: string }>(
          `insert into public.content_reports (target_type, target_id, reason) values ('comment', $1, 'Spam') returning id`,
          [comment]
        )
      )
    )[0].id;
    expect(await as(FAN, () => rows('select id from public.content_reports'))).toEqual([]);
    await expect(
      as(FAN, () => db.query(`select public.resolve_report ($1, 'removed')`, [report]))
    ).rejects.toThrow(/Only admins/);

    await as(ADMIN, () =>
      db.query(`select public.resolve_report ($1, 'removed', 'Spam')`, [report])
    );

    expect(
      await rows('select count(*)::int as n from public.review_comments where id = $1', [comment])
    ).toEqual([{ n: 0 }]);
    expect(
      await as(AUTHOR, () => rows('select status, resolution_note from public.content_reports'))
    ).toEqual([{ status: 'removed', resolution_note: 'Spam' }]);
    expect((await notices(AUTHOR)).at(-1)).toEqual({
      kind: 'report_resolved',
      body: 'We removed the comment you reported: Spam.',
    });
  });

  it('cannot be filed as someone else or as already resolved', async () => {
    await expect(
      as(FAN, () =>
        db.query(
          `insert into public.content_reports (target_type, target_id, reason, status) values ('review', $1, 'x', 'removed')`,
          [review]
        )
      )
    ).rejects.toThrow(/row-level security/);
  });
});
