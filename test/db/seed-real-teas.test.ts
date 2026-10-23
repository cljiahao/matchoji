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
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;

const SEED = readFileSync(path.join(SUPABASE, 'seed/20261023_real_teas.sql'), 'utf8');

let db: PGlite;

const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const dir = path.join(SUPABASE, 'migrations');
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.includes('storage'))
    .sort())
    await db.exec(readFileSync(path.join(dir, file), 'utf8'));
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('real teas seed', () => {
  it('adds each tea once, links stated regions and logs the inserts', async () => {
    await db.exec(SEED);

    expect(await count('select count(*)::int as n from public.products')).toBe(18);
    expect(
      await count(`select count(*)::int as n from public.products where category = 'hojicha'`)
    ).toBe(7);
    const aiya = await db.query<{ grade: string; region: string }>(
      `select p.grade, r.name as region from public.products p
       join public.regions r on r.id = p.region_id where p.brand = 'Aiya'`
    );
    expect(aiya.rows).toEqual([{ grade: 'Ceremonial', region: 'Nishio, Aichi' }]);
    expect(
      await count('select count(*)::int as n from public.products where region_id is not null')
    ).toBe(1);
    expect(
      await count(`select count(*)::int as n from public.audit_log where table_name = 'products'`)
    ).toBe(18);
  });

  it('adds nothing when run again, even if an existing name differs in case', async () => {
    await db.exec(`update public.products set name = 'WAKO' where name = 'Wako'`);
    await db.exec(SEED);
    expect(await count('select count(*)::int as n from public.products')).toBe(18);
  });
});
