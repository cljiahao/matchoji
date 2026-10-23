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

const names = async (where = 'true') =>
  (
    await db.query<{ name: string }>(
      `select name from public.products where ${where} order by name`
    )
  ).rows.map((r) => r.name);

// Leaving status out lets the column default (pending) apply, as the app does.
const suggest = (name: string, status?: string) =>
  status
    ? db.query(
        `insert into public.products (name, brand, category, status)
         values ($1, 'Small Farm', 'matcha', $2)`,
        [name, status]
      )
    : db.query(
        `insert into public.products (name, brand, category) values ($1, 'Small Farm', 'matcha')`,
        [name]
      );

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const dir = path.join(SUPABASE, 'migrations');
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.includes('storage'))
    .sort())
    await db.exec(readFileSync(path.join(dir, file), 'utf8'));
  for (const id of [TASTER, OTHER])
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      id,
      `${id.slice(0, 4)}@example.com`,
    ]);
  await db.exec(readFileSync(path.join(SUPABASE, 'seed/20261023_real_teas.sql'), 'utf8'));
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('tea review queue', () => {
  it('seeds the catalogue as approved', async () => {
    expect(await names(`status <> 'approved'`)).toEqual([]);
    expect(await names()).toHaveLength(18);
  });

  it('files a tea a taster adds as pending, credited to them', async () => {
    await as(TASTER, () => suggest('Hoshino Midori'));

    const row = (
      await db.query<{ status: string; added_by: string; reviewed_at: string | null }>(
        `select status, added_by, reviewed_at from public.products where name = 'Hoshino Midori'`
      )
    ).rows[0];
    expect(row).toEqual({ status: 'pending', added_by: TASTER, reviewed_at: null });
  });

  it('refuses a tea added as already approved, or credited to someone else', async () => {
    await expect(as(TASTER, () => suggest('Shortcut', 'approved'))).rejects.toThrow(
      /row-level security/
    );
    await expect(
      as(TASTER, () =>
        db.query(
          `insert into public.products (name, category, added_by) values ('Framed', 'matcha', $1)`,
          [OTHER]
        )
      )
    ).rejects.toThrow(/row-level security/);
  });

  it('keeps a pending tea readable by link, and nobody but an admin can approve it', async () => {
    expect(await as(null, () => names(`name = 'Hoshino Midori'`))).toEqual(['Hoshino Midori']);
    await as(TASTER, () =>
      db.exec(`update public.products set status = 'approved' where name = 'Hoshino Midori'`)
    );
    expect(await names(`status = 'pending'`)).toEqual(['Hoshino Midori']);
  });

  it('hides a rejected tea from everyone but the taster who added it', async () => {
    await db.exec(
      `update public.products set status = 'rejected', reviewed_at = now()
       where name = 'Hoshino Midori'`
    );

    expect(await as(null, () => names(`name = 'Hoshino Midori'`))).toEqual([]);
    expect(await as(OTHER, () => names(`name = 'Hoshino Midori'`))).toEqual([]);
    expect(await as(TASTER, () => names(`name = 'Hoshino Midori'`))).toEqual(['Hoshino Midori']);
  });
});
