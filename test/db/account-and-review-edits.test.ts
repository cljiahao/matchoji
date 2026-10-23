import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';

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

const review = (stars: number) =>
  db.query('insert into public.reviews (user_id, product_id, stars) values (auth.uid (), $1, $2)', [
    tea,
    stars,
  ]);

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
     ($1, 'alice@example.com', '{"full_name": "Alice"}'), ($2, 'bob@example.com', '{"full_name": "Bob"}')`,
    [ALICE, BOB]
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

describe('editing and deleting tastings', () => {
  it('lets the author edit tasting fields but not the author or tea', async () => {
    await as(ALICE, () => review(3));
    await as(ALICE, () => db.exec(`update public.reviews set stars = 5, notes = 'Better today'`));
    await expect(
      as(ALICE, () => db.query(`update public.reviews set user_id = $1`, [BOB]))
    ).rejects.toThrow(/permission denied/);
    await as(BOB, () => db.exec(`update public.reviews set stars = 1`));

    expect(await rows('select stars, notes from public.reviews')).toEqual([
      { stars: 5, notes: 'Better today' },
    ]);
  });

  it('lets only the author delete a tasting', async () => {
    await as(BOB, () => db.exec('delete from public.reviews'));
    expect(await rows('select count(*)::int as n from public.reviews')).toEqual([{ n: 1 }]);
    await as(ALICE, () => db.exec('delete from public.reviews'));
    expect(await rows('select count(*)::int as n from public.reviews')).toEqual([{ n: 0 }]);
  });
});

describe('deleting an account', () => {
  it('keeps the ratings anonymised, removes the rest, and scrubs the audit trail', async () => {
    await as(ALICE, () => review(5));
    await as(BOB, () => review(3));
    await as(ALICE, () =>
      db.query('insert into public.wishlist (user_id, product_id) values (auth.uid (), $1)', [tea])
    );

    await as(ALICE, () => db.exec('select public.delete_my_account ()'));

    expect(await rows('select id from public.profiles where id = $1', [ALICE])).toEqual([]);
    expect(await rows('select user_id, stars from public.reviews order by stars')).toEqual([
      { user_id: BOB, stars: 3 },
      { user_id: null, stars: 5 },
    ]);
    expect(await rows('select count(*)::int as n from public.wishlist')).toEqual([{ n: 0 }]);
    // Both ratings still count: an anonymised tasting is its own person.
    expect(
      await rows('select review_count::int, avg_stars::text from public.product_ratings')
    ).toEqual([{ review_count: 2, avg_stars: '4.00' }]);
    expect(
      await rows(
        `select count(*)::int as n from public.audit_log
         where actor_id = $1 or old_row::text like '%' || $1 || '%' or new_row::text like '%' || $1 || '%'
            or old_row::text like '%Alice%' or new_row::text like '%Alice%'`,
        [ALICE]
      )
    ).toEqual([{ n: 0 }]);
  });

  it('needs a signed-in caller', async () => {
    await expect(as(null, () => db.exec('select public.delete_my_account ()'))).rejects.toThrow(
      /permission denied/
    );
  });
});

describe('daily limits', () => {
  it('stops the 61st tasting and the 21st suggested tea in a day', async () => {
    // Fill Bob's day to the cap, counting what earlier tests logged for him.
    await db.query(
      `insert into public.reviews (user_id, product_id, stars)
       select $1, $2, 4
       from generate_series(1, 60 - (select count(*)::int from public.reviews where user_id = $1))`,
      [BOB, tea]
    );
    await expect(as(BOB, () => review(4))).rejects.toThrow(/lot for one day/);

    await db.query(
      `insert into public.products (name, category, status, added_by)
       select 'Bulk ' || g, 'matcha', 'pending', $1 from generate_series(1, 20) g`,
      [BOB]
    );
    await expect(
      as(BOB, () =>
        db.exec(`insert into public.products (name, category) values ('One more', 'matcha')`)
      )
    ).rejects.toThrow(/lot for one day/);
  });
});
