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

const SUPPLY = readFileSync(path.join(SUPABASE, 'seed/20261023_region_supply.sql'), 'utf8');

let db: PGlite;

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

const supply = async () =>
  (
    await db.query<{ name: string; matcha: string | null; hojicha: string | null }>(
      `select name, matcha_supply as matcha, hojicha_supply as hojicha from public.regions
       order by name`
    )
  ).rows;

describe('region supply', () => {
  it('rejects a level outside scarce, tight and plentiful', async () => {
    await expect(
      db.exec(`update public.regions set matcha_supply = 'gone' where name = 'Shizuoka'`)
    ).rejects.toThrow(/check constraint/);
  });

  it('seeds sourced levels, hojicha tight everywhere, and keeps values set by hand', async () => {
    await db.exec(
      `update public.regions set matcha_supply = 'plentiful', scarcity_note = 'Hand note'
       where name = 'Shizuoka'`
    );
    await db.exec(SUPPLY);
    await db.exec(SUPPLY);

    expect(await supply()).toEqual([
      { name: 'Ise, Mie', matcha: null, hojicha: 'tight' },
      { name: 'Kagoshima', matcha: 'tight', hojicha: 'tight' },
      { name: 'Nishio, Aichi', matcha: 'tight', hojicha: 'tight' },
      { name: 'Sayama, Saitama', matcha: null, hojicha: 'tight' },
      { name: 'Shizuoka', matcha: 'plentiful', hojicha: 'tight' },
      { name: 'Uji, Kyoto', matcha: 'scarce', hojicha: 'tight' },
      { name: 'Yame, Fukuoka', matcha: null, hojicha: 'tight' },
    ]);
    const notes = await db.query<{ name: string; scarcity_note: string }>(
      `select name, scarcity_note from public.regions where scarcity_note is not null
       order by name`
    );
    expect(notes.rows.map((r) => r.name)).toEqual([
      'Kagoshima',
      'Nishio, Aichi',
      'Shizuoka',
      'Uji, Kyoto',
    ]);
    expect(notes.rows[2].scarcity_note).toBe('Hand note');
  });
});
