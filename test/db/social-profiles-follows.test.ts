import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const AIKO = '11111111-1111-4111-8111-111111111111';
const BEN = '22222222-2222-4222-8222-222222222222';
const CHO = '33333333-3333-4333-8333-333333333333';

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

const follow = (who: string, whom: string) =>
  as(who, () =>
    db.query('insert into public.follows (follower_id, followee_id) values (auth.uid (), $1)', [
      whom,
    ])
  );

beforeAll(async () => {
  db = await createMigratedDb();
  for (const [id, name] of [
    [AIKO, 'Aiko'],
    [BEN, 'Ben'],
    [CHO, 'Cho'],
  ])
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, jsonb_build_object('full_name', $3::text))`,
      [id, `${name}@example.com`, name]
    );
  tea = (
    await rows<{ id: string }>(
      `insert into public.products (name, category, status) values ('Sayaka', 'matcha', 'approved') returning id`
    )
  )[0].id;
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('privacy', () => {
  it('shows public profile fields to everyone and lets people go private', async () => {
    expect(
      await as(null, () =>
        rows('select display_name, is_public from public.public_profiles where id = $1', [AIKO])
      )
    ).toEqual([{ display_name: 'Aiko', is_public: true }]);
    await as(AIKO, () => db.exec('update public.profiles set is_public = false'));
    expect(
      await rows('select is_public from public.public_profiles where id = $1', [AIKO])
    ).toEqual([{ is_public: false }]);
    await as(AIKO, () => db.exec('update public.profiles set is_public = true'));
  });
});

describe('follows', () => {
  it('lets people follow and unfollow for themselves only, never themselves', async () => {
    await follow(AIKO, BEN);
    await expect(
      as(CHO, () =>
        db.query('insert into public.follows (follower_id, followee_id) values ($1, $2)', [
          AIKO,
          CHO,
        ])
      )
    ).rejects.toThrow(/row-level security/);
    await expect(follow(AIKO, AIKO)).rejects.toThrow(/check constraint/);
    expect(await as(null, () => rows('select count(*)::int as n from public.follows'))).toEqual([
      { n: 1 },
    ]);

    await as(CHO, () => db.exec('delete from public.follows'));
    expect(await rows('select count(*)::int as n from public.follows')).toEqual([{ n: 1 }]);
  });

  it('feeds you the latest tastings of people you follow, newest first', async () => {
    await as(BEN, () =>
      db.query(
        'insert into public.reviews (user_id, product_id, stars) values (auth.uid (), $1, 5)',
        [tea]
      )
    );
    await as(CHO, () =>
      db.query(
        'insert into public.reviews (user_id, product_id, stars) values (auth.uid (), $1, 2)',
        [tea]
      )
    );

    expect(
      await as(AIKO, () => rows<{ stars: number }>('select stars from public.following_feed ()'))
    ).toEqual([{ stars: 5 }]);
    await expect(as(null, () => rows('select * from public.following_feed ()'))).rejects.toThrow(
      /permission denied/
    );
  });
});

describe('blocks', () => {
  it('are private, end follows both ways, and stop new ones', async () => {
    await follow(BEN, AIKO);
    await as(BEN, () =>
      db.query('insert into public.blocks (blocker_id, blocked_id) values (auth.uid (), $1)', [
        AIKO,
      ])
    );

    expect(await rows('select count(*)::int as n from public.follows')).toEqual([{ n: 0 }]);
    await expect(follow(AIKO, BEN)).rejects.toThrow(/row-level security/);
    expect(await as(AIKO, () => rows('select * from public.blocks'))).toEqual([]);
    expect(await as(AIKO, () => rows('select * from public.following_feed ()'))).toEqual([]);

    await as(BEN, () => db.exec('delete from public.blocks'));
    await follow(AIKO, BEN);
  });
});
