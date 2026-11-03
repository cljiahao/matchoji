import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const ADMIN = '11111111-1111-4111-8111-111111111111';

let db: PGlite;

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

const addTea = async (name: string, price?: number, grams?: number) =>
  (
    await rows<{ id: string }>(
      `insert into public.products (name, category, status, price_sgd, pack_grams)
       values ($1, 'matcha', 'approved', $2, $3) returning id`,
      [name, price ?? null, grams ?? null]
    )
  )[0].id;

const history = (tea: string) =>
  rows<{ price: string; pack_grams: string; currency: string }>(
    `select price, pack_grams, currency from public.tea_price_history
     where product_id = $1 order by recorded_at, id`,
    [tea]
  );

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'a@x.com', '{}')`,
    [ADMIN]
  );
  await db.query('update public.profiles set is_admin = true where id = $1', [ADMIN]);
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('tea_price_history trigger', () => {
  it('records a tea created with a price, and none for an unpriced one', async () => {
    const priced = await addTea('Priced', 32, 40);
    const unpriced = await addTea('Unpriced');
    expect(await history(priced)).toEqual([
      { price: '32.00', pack_grams: '40.0', currency: 'SGD' },
    ]);
    expect(await history(unpriced)).toEqual([]);
  });

  it('keeps the old price when an admin changes the price or the pack size', async () => {
    const tea = await addTea('Changing', 30, 40);
    await as(ADMIN, () => db.query('select public.set_tea_price ($1, 33, 40)', [tea]));
    await as(ADMIN, () => db.query('select public.set_tea_price ($1, 33, 50)', [tea]));
    expect(await history(tea)).toEqual([
      { price: '30.00', pack_grams: '40.0', currency: 'SGD' },
      { price: '33.00', pack_grams: '40.0', currency: 'SGD' },
      { price: '33.00', pack_grams: '50.0', currency: 'SGD' },
    ]);
  });

  it('adds nothing for an update that leaves the price alone or clears it', async () => {
    const tea = await addTea('Steady', 20, 100);
    await db.query(`update public.products set grade = 'ceremonial' where id = $1`, [tea]);
    await as(ADMIN, () => db.query('select public.set_tea_price ($1, 20, 100)', [tea]));
    await as(ADMIN, () => db.query('select public.set_tea_price ($1, null, null)', [tea]));
    expect(await history(tea)).toHaveLength(1);
  });

  it('is removed with the tea', async () => {
    const tea = await addTea('Gone', 10, 20);
    await db.query('delete from public.products where id = $1', [tea]);
    expect(await history(tea)).toEqual([]);
  });
});

describe('tea_price_history access', () => {
  it('is readable by everyone and writable by no client', async () => {
    const tea = await addTea('Open', 15, 30);
    expect(
      await as(null, () =>
        rows('select price from public.tea_price_history where product_id = $1', [tea])
      )
    ).toHaveLength(1);

    for (const who of [null, ADMIN]) {
      await expect(
        as(who, () =>
          db.query(
            `insert into public.tea_price_history (product_id, price, pack_grams) values ($1, 1, 1)`,
            [tea]
          )
        )
      ).rejects.toThrow(/permission denied|row-level security/);
    }
    await as(ADMIN, () =>
      db.query(`delete from public.tea_price_history where product_id = $1`, [tea])
    );
    await as(ADMIN, () =>
      db.query(`update public.tea_price_history set price = 99 where product_id = $1`, [tea])
    );
    expect(await history(tea)).toEqual([{ price: '15.00', pack_grams: '30.0', currency: 'SGD' }]);
  });

  it('is audited', async () => {
    const [{ n }] = await rows<{ n: number }>(
      `select count(*)::int as n from public.audit_log where table_name = 'tea_price_history'`
    );
    expect(n).toBeGreaterThan(0);
  });
});
