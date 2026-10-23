import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

let db: PGlite;
let tea: string;

async function as<T>(id: string, run: () => Promise<T>): Promise<T> {
  await db.exec(`set request.jwt.claim.sub = '${id}'; set role authenticated;`);
  try {
    return await run();
  } finally {
    await db.exec('reset role; reset request.jwt.claim.sub;');
  }
}

const rows = async <T>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows;

const taster = async () => {
  const id = crypto.randomUUID();
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
    id,
    `${id}@example.com`,
  ]);
  return id;
};

const rate = (user: string, stars: number, year: number | null, flush: string | null) =>
  as(user, () =>
    db.query(
      `insert into public.reviews (user_id, product_id, stars, harvest_year, flush)
       values (auth.uid (), $1, $2, $3, $4)`,
      [tea, stars, year, flush]
    )
  );

beforeAll(async () => {
  db = await createMigratedDb();
  tea = (
    await rows<{ id: string }>(
      `insert into public.products (name, category, status) values ('Sayaka', 'matcha', 'approved') returning id`
    )
  )[0].id;
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('editions', () => {
  it('roll ratings up per harvest and mark the best with 3 or more', async () => {
    for (const stars of [5, 5, 4]) await rate(await taster(), stars, 2025, 'first');
    for (const stars of [3, 4, 3]) await rate(await taster(), stars, 2024, 'first');
    await rate(await taster(), 5, 2025, 'autumn');
    await rate(await taster(), 2, null, null);

    expect(
      await rows(
        `select harvest_year, flush, review_count, avg_stars::text, top_harvest
         from public.edition_ratings order by harvest_year desc, flush`
      )
    ).toEqual([
      {
        harvest_year: 2025,
        flush: 'autumn',
        review_count: 1,
        avg_stars: '5.00',
        top_harvest: false,
      },
      { harvest_year: 2025, flush: 'first', review_count: 3, avg_stars: '4.67', top_harvest: true },
      {
        harvest_year: 2024,
        flush: 'first',
        review_count: 3,
        avg_stars: '3.33',
        top_harvest: false,
      },
    ]);
    // The tea's own score still counts every taster.
    expect(await rows('select review_count::int from public.product_ratings')).toEqual([
      { review_count: 8 },
    ]);
  });

  it('refuse impossible years and unknown flushes', async () => {
    const user = await taster();
    await expect(rate(user, 4, 1890, null)).rejects.toThrow(/check constraint/);
    await expect(rate(user, 4, 2025, 'spring')).rejects.toThrow(/check constraint/);
  });

  it('can be edited on your own tasting', async () => {
    const user = await taster();
    await rate(user, 4, null, null);
    await as(user, () =>
      db.exec(`update public.reviews set harvest_year = 2023, flush = 'second'`)
    );
    expect(
      await rows('select harvest_year, flush from public.reviews where user_id = $1', [user])
    ).toEqual([{ harvest_year: 2023, flush: 'second' }]);
  });
});

describe('stash', () => {
  it('lets owners record quantity and opening date on their own want-to-try only', async () => {
    const me = await taster();
    const other = await taster();
    await as(me, () =>
      db.query('insert into public.wishlist (user_id, product_id) values (auth.uid (), $1)', [tea])
    );
    await as(me, () =>
      db.exec(`update public.wishlist set owned_quantity = 2, opened_on = '2026-10-20'`)
    );
    await as(other, () => db.exec(`update public.wishlist set owned_quantity = 9`));
    await expect(
      as(me, () => db.query('update public.wishlist set product_id = $1', [tea]))
    ).rejects.toThrow(/permission denied/);

    expect(
      await rows('select owned_quantity, opened_on::text from public.wishlist where user_id = $1', [
        me,
      ])
    ).toEqual([{ owned_quantity: 2, opened_on: '2026-10-20' }]);
  });
});
