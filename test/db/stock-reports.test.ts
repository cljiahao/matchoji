import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SUPABASE = path.resolve(import.meta.dirname, '../../supabase');

// Same Supabase stub as audit-log.test.ts: auth schema, auth.uid() and the API roles.
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid () returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on function auth.uid () to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;

const read = (file: string) => readFileSync(path.join(SUPABASE, file), 'utf8');

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';

let db: PGlite;
let wako: string;

async function asUser<T>(id: string, run: () => Promise<T>): Promise<T> {
  await db.exec(`set request.jwt.claim.sub = '${id}'; set role authenticated;`);
  try {
    return await run();
  } finally {
    await db.exec(`reset role; reset request.jwt.claim.sub;`);
  }
}

const report = (status: string) =>
  db.query(`insert into public.stock_reports (product_id, status) values ($1, $2)`, [wako, status]);

const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const dir = path.join(SUPABASE, 'migrations');
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.includes('storage'))
    .sort())
    await db.exec(readFileSync(path.join(dir, file), 'utf8'));
  for (const [id, email] of [
    [ALICE, 'alice@example.com'],
    [BOB, 'bob@example.com'],
  ])
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      id,
      email,
    ]);
  await db.exec(read('seed/20261023_real_teas.sql'));
  wako = (await db.query<{ id: string }>(`select id from public.products where name = 'Wako'`))
    .rows[0].id;
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('shop links', () => {
  it('links every seeded tea to an https shop page, keeping a link set by hand', async () => {
    await db.exec(`update public.products set shop_url = 'https://example.com/isuzu'
      where name = 'Isuzu'`);
    await db.exec(read('seed/20261024_shop_urls.sql'));
    await db.exec(read('seed/20261024_shop_urls.sql'));

    expect(
      await count('select count(*)::int as n from public.products where shop_url is null')
    ).toBe(0);
    expect(
      await count(`select count(*)::int as n from public.products
        where name = 'Isuzu' and shop_url = 'https://example.com/isuzu'`)
    ).toBe(1);
    await expect(
      db.exec(`update public.products set shop_url = 'http://example.com' where name = 'Wako'`)
    ).rejects.toThrow(/check constraint/);
  });
});

describe('stock reports', () => {
  it('lets a signed-in user report as themselves, and logs it', async () => {
    await asUser(ALICE, () => report('sold_out'));

    const rows = await db.query<{ user_id: string; status: string }>(
      'select user_id, status from public.stock_reports'
    );
    expect(rows.rows).toEqual([{ user_id: ALICE, status: 'sold_out' }]);
    expect(
      await count(`select count(*)::int as n from public.audit_log
        where table_name = 'stock_reports' and actor_id = '${ALICE}'`)
    ).toBe(1);
  });

  it('refuses a repeat report on the same tea within ten minutes, but not someone else’s', async () => {
    await expect(asUser(ALICE, () => report('in_stock'))).rejects.toThrow(
      /reported this tea a moment ago/
    );
    await asUser(BOB, () => report('in_stock'));

    await db.exec(
      `update public.stock_reports set created_at = now() - interval '11 minutes'
       where user_id = '${ALICE}'`
    );
    await asUser(ALICE, () => report('in_stock'));
    expect(await count('select count(*)::int as n from public.stock_reports')).toBe(3);
  });

  it('rejects other statuses and reports filed as someone else', async () => {
    // The rate brake runs before the checks, so these use a tea nobody has reported.
    await expect(
      asUser(BOB, () =>
        db.query(
          `insert into public.stock_reports (product_id, status)
           select id, 'low' from public.products where name = 'Yugen'`
        )
      )
    ).rejects.toThrow(/check constraint/);
    await expect(
      asUser(BOB, () =>
        db.query(
          `insert into public.stock_reports (product_id, user_id, status)
           select id, $1, 'in_stock' from public.products where name = 'Yugen'`,
          [ALICE]
        )
      )
    ).rejects.toThrow(/row-level security/);
  });

  it('is readable by visitors, who cannot report, and nobody can edit or delete a report', async () => {
    await db.exec('set role anon');
    try {
      expect(await count('select count(*)::int as n from public.stock_reports')).toBe(3);
      await expect(report('in_stock')).rejects.toThrow(/row-level security|null value/);
    } finally {
      await db.exec('reset role');
    }

    await asUser(ALICE, async () => {
      await db.exec(`update public.stock_reports set status = 'in_stock'`);
      await db.exec(`delete from public.stock_reports`);
    });
    expect(
      await count(`select count(*)::int as n from public.stock_reports where status = 'sold_out'`)
    ).toBe(1);
    expect(await count('select count(*)::int as n from public.stock_reports')).toBe(3);
  });
});
