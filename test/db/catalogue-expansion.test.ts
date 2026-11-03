import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb, readSupabaseFile } from '../support/supabase-db';

const MIGRATION = readSupabaseFile('migrations/20261104000000_catalogue_expansion.sql');

let db: PGlite;

const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n);

beforeAll(async () => {
  db = await createMigratedDb();
  await db.exec(MIGRATION);
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('catalogue expansion migration', () => {
  it('adds approved teas, each with a maker shop link and a price for its pack', async () => {
    expect(await count('select count(*)::int as n from public.products')).toBe(31);
    expect(
      await count(`select count(*)::int as n from public.products where status <> 'approved'`)
    ).toBe(0);
    expect(
      await count(
        `select count(*)::int as n from public.products
         where shop_url !~ '^https://' or price_sgd is null or pack_grams is null`
      )
    ).toBe(0);
    expect(
      await count(`select count(*)::int as n from public.products where category = 'hojicha'`)
    ).toBe(7);
  });

  it('has no duplicate tea, even ignoring case', async () => {
    expect(
      await count(
        `select count(*)::int as n from (
           select 1 from public.products group by lower(name), lower(brand) having count(*) > 1
         ) d`
      )
    ).toBe(0);
  });

  it('links a region only where the maker states one', async () => {
    const rows = await db.query<{ name: string; region: string | null }>(
      `select p.name, r.name as region from public.products p
       left join public.regions r on r.id = p.region_id where p.brand = 'Kettl' order by p.name`
    );
    expect(rows.rows.find((r) => r.name === 'Hibiki Matcha')?.region).toBe('Yame, Fukuoka');
    expect(rows.rows.find((r) => r.name === 'Suiteki Matcha')?.region).toBe('Nishio, Aichi');
    expect(
      await count(
        `select count(*)::int as n from public.products where brand = 'Ippodo' and region_id is not null`
      )
    ).toBe(0);
  });

  it('adds the shops next to the two seeded ones', async () => {
    expect(await count('select count(*)::int as n from public.shop_locations')).toBe(6);
    expect(
      await count(
        `select count(*)::int as n from public.shop_locations where source_url !~ '^https://'`
      )
    ).toBe(0);
  });

  it('adds nothing when run again', async () => {
    await db.exec(MIGRATION);
    expect(await count('select count(*)::int as n from public.products')).toBe(31);
    expect(await count('select count(*)::int as n from public.shop_locations')).toBe(6);
  });

  it('skips a tea already present under another case', async () => {
    await db.exec(`delete from public.products where name = 'Kanza'`);
    await db.exec(`insert into public.products (name, brand, category, status)
      values ('KANZA', 'IPPODO', 'matcha', 'approved')`);
    await db.exec(MIGRATION);
    expect(
      await count(`select count(*)::int as n from public.products where lower(name) = 'kanza'`)
    ).toBe(1);
  });
});
