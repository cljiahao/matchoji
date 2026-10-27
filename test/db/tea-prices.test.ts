import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const ADMIN = '11111111-1111-4111-8111-111111111111';
const TASTER = '22222222-2222-4222-8222-222222222222';

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

const addTea = async (name: string, category = 'matcha', status = 'approved') =>
  (
    await rows<{ id: string }>(
      `insert into public.products (name, category, status) values ($1, $2, $3) returning id`,
      [name, category, status]
    )
  )[0].id;

const setPrice = (who: string | null, tea: string, price: number | null, grams: number | null) =>
  as(who, () => db.query('select public.set_tea_price ($1, $2, $3)', [tea, price, grams]));

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
     ($1, 'admin@example.com', '{}'), ($2, 'taster@example.com', '{}')`,
    [ADMIN, TASTER]
  );
  await db.query('update public.profiles set is_admin = true where id = $1', [ADMIN]);
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('set_tea_price', () => {
  it('lets an admin set and clear a price, needing both values', async () => {
    const tea = await addTea('Sayaka');
    await setPrice(ADMIN, tea, 32, 40);
    expect(
      await rows('select price_sgd, pack_grams from public.products where id = $1', [tea])
    ).toEqual([{ price_sgd: '32.00', pack_grams: '40.0' }]);

    await expect(setPrice(ADMIN, tea, 32, null)).rejects.toThrow(/both the price and the pack/);
    await setPrice(ADMIN, tea, null, null);
    expect(await rows('select price_sgd from public.products where id = $1', [tea])).toEqual([
      { price_sgd: null },
    ]);
  });

  it('refuses everyone but admins, and unknown teas', async () => {
    const tea = await addTea('Wako');
    await expect(setPrice(TASTER, tea, 10, 20)).rejects.toThrow();
    await expect(setPrice(null, tea, 10, 20)).rejects.toThrow(/permission denied/);
    await expect(setPrice(ADMIN, '99999999-9999-4999-8999-999999999999', 10, 20)).rejects.toThrow(
      /No such tea/
    );
  });

  it('rejects zero or impossible values', async () => {
    const tea = await addTea('Kinrin');
    await expect(setPrice(ADMIN, tea, 0, 20)).rejects.toThrow(/check/);
    await expect(setPrice(ADMIN, tea, 10, 6000)).rejects.toThrow(/check/);
  });
});

describe('suggested teas', () => {
  it('cannot arrive with a price', async () => {
    await expect(
      as(TASTER, () =>
        db.exec(
          `insert into public.products (name, category, status, added_by, price_sgd, pack_grams)
           values ('Priced', 'matcha', 'pending', auth.uid (), 10, 20)`
        )
      )
    ).rejects.toThrow(/row-level security/);
  });
});

describe('tea_prices and catalogue_teas', () => {
  it('give the price per gram and a band once 3 teas of the category are priced', async () => {
    await db.exec('update public.products set price_sgd = null, pack_grams = null');
    const [cheap, middle, dear, hojicha] = [
      await addTea('Cheap'),
      await addTea('Middle'),
      await addTea('Dear'),
      await addTea('Roast', 'hojicha'),
    ];
    await setPrice(ADMIN, cheap, 20, 100);
    await setPrice(ADMIN, middle, 30, 40);
    await setPrice(ADMIN, hojicha, 12, 100);

    // Two priced matcha are not enough to call one of them budget.
    expect(
      await as(null, () =>
        rows('select price_per_gram, price_band from public.tea_prices where product_id = $1', [
          cheap,
        ])
      )
    ).toEqual([{ price_per_gram: '0.2000', price_band: null }]);

    await setPrice(ADMIN, dear, 60, 30);
    const bands = await as(null, () =>
      rows<{ name: string; price_band: string | null }>(
        `select name, price_band from public.catalogue_teas
         where price_sgd is not null order by price_per_gram`
      )
    );
    expect(bands).toEqual([
      { name: 'Roast', price_band: null },
      { name: 'Cheap', price_band: 'budget' },
      { name: 'Middle', price_band: 'mid' },
      { name: 'Dear', price_band: 'premium' },
    ]);
  });

  it('leave pending teas out of the comparison', async () => {
    const pending = await addTea('Awaiting', 'matcha', 'pending');
    await setPrice(ADMIN, pending, 1, 100);
    expect(
      await rows('select product_id from public.tea_prices where product_id = $1', [pending])
    ).toEqual([]);
  });

  it('audit every price change', async () => {
    const changes = await rows<{ n: number }>(
      `select count(*)::int as n from public.audit_log
       where table_name = 'products' and action = 'UPDATE' and new_row ? 'price_sgd'
         and new_row ->> 'price_sgd' is not null`
    );
    expect(changes[0].n).toBeGreaterThan(0);
  });
});
