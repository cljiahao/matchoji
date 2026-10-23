import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb, readSupabaseFile } from '../support/supabase-db';

const TASTER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

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

const id = async (name: string) =>
  (await rows<{ id: string }>('select id from public.products where name = $1', [name]))[0].id;

// Each rater is a separate user with one tasting, as scores count one per person.
async function rate(tea: string, stars: number[]) {
  for (const s of stars) {
    const user = crypto.randomUUID();
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      user,
      `${user}@example.com`,
    ]);
    await db.query('insert into public.reviews (user_id, product_id, stars) values ($1, $2, $3)', [
      user,
      await id(tea),
      s,
    ]);
  }
}

beforeAll(async () => {
  db = await createMigratedDb();
  for (const u of [TASTER, OTHER])
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      u,
      `${u.slice(0, 4)}@example.com`,
    ]);
  await db.exec(readSupabaseFile('seed/20261023_real_teas.sql'));
  await db.exec(readSupabaseFile('seed/20261023_region_supply.sql'));
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('catalogue_teas', () => {
  it('ranks by weighted score, keeping teas with fewer than 3 ratings below', async () => {
    await rate('Wako', [5]);
    await rate('Unkaku', Array(20).fill(5).concat([4]));
    await rate('Isuzu', [4, 4, 4]);

    const top = await rows<{ name: string; review_count: number; top_rank: number }>(
      `select name, review_count, top_rank from public.catalogue_teas
       order by top_rank, weighted_score desc nulls last, name limit 3`
    );
    expect(top.map((t) => t.name)).toEqual(['Unkaku', 'Isuzu', 'Wako']);
    expect(top[2]).toMatchObject({ review_count: 1, top_rank: 1 });
  });

  it('lists approved teas only, with region name, grade key and scarcity rank', async () => {
    await db.exec(
      `insert into public.products (name, category, status) values ('Pending One', 'matcha', 'pending')`
    );
    expect(await rows(`select 1 from public.catalogue_teas where name = 'Pending One'`)).toEqual(
      []
    );
    expect(
      await rows(
        `select region_name, grade_key, supply, supply_rank from public.catalogue_teas
         where name = 'Ceremonial Grade Matcha'`
      )
    ).toEqual([
      { region_name: 'Nishio, Aichi', grade_key: 'ceremonial', supply: 'tight', supply_rank: 1 },
    ]);
    expect(
      await as(null, () => rows('select count(*)::int as n from public.catalogue_teas'))
    ).toEqual([{ n: 18 }]);
  });
});

describe('search_teas', () => {
  const search = (who: string | null, q: string) =>
    as(who, () => rows<{ name: string }>('select name from public.search_teas ($1)', [q])).then(
      (r) => r.map((x) => x.name)
    );

  it('finds teas by part of the name or brand, and forgives a typo', async () => {
    expect(await search(null, 'sayaka')).toEqual(['Sayaka-no-mukashi']);
    expect(await search(null, 'sayak-no-mukashi')).toContain('Sayaka-no-mukashi');
    expect(await search(null, 'koyamaen')).toHaveLength(10);
  });

  it('treats wildcards as plain text and ignores one-letter queries', async () => {
    expect(await search(null, '%')).toEqual([]);
    expect(await search(null, '_a')).toEqual([]);
    expect(await search(null, 's')).toEqual([]);
  });

  it('includes the caller’s own pending tea but no one else’s', async () => {
    await db.query(
      `insert into public.products (name, category, status, added_by) values ('Hoshino Gold', 'matcha', 'pending', $1)`,
      [TASTER]
    );
    expect(await search(TASTER, 'hoshino')).toEqual(['Hoshino Gold']);
    expect(await search(OTHER, 'hoshino')).toEqual([]);
    expect(await search(null, 'hoshino')).toEqual([]);
  });
});
