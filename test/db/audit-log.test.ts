import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const MIGRATIONS = path.resolve(import.meta.dirname, '../../supabase/migrations');

// The slice of Supabase the migrations lean on: the auth schema with users and auth.uid(),
// the API roles, and the default grants Supabase gives them on public tables. Storage is
// left out, so its migration is skipped.
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

const USER = '11111111-1111-4111-8111-111111111111';

let db: PGlite;

async function asUser<T>(id: string, run: () => Promise<T>): Promise<T> {
  await db.exec(`set request.jwt.claim.sub = '${id}'; set role authenticated;`);
  try {
    return await run();
  } finally {
    await db.exec(`reset role; reset request.jwt.claim.sub;`);
  }
}

const entries = async (table: string) =>
  (
    await db.query<{
      actor_id: string | null;
      action: string;
      old_row: Record<string, unknown> | null;
      new_row: Record<string, unknown> | null;
    }>(
      'select actor_id, action, old_row, new_row from public.audit_log where table_name = $1 order by id',
      [table]
    )
  ).rows;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql') && !f.includes('storage'))
    .sort();
  for (const file of files) await db.exec(readFileSync(path.join(MIGRATIONS, file), 'utf8'));
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
    USER,
    'taster@example.com',
    { full_name: 'Taster' },
  ]);
}, 30_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.exec('truncate public.audit_log');
});

describe('audit log', () => {
  it('logs a sign-up’s profile without its email, with no actor outside a request', async () => {
    const other = '22222222-2222-4222-8222-222222222222';
    await db.query(`insert into auth.users (id, email) values ($1, 'other@example.com')`, [other]);

    const [entry] = await entries('profiles');
    expect(entry).toMatchObject({ actor_id: null, action: 'INSERT', old_row: null });
    expect(entry.new_row).toMatchObject({ id: other, display_name: 'other' });
    expect(entry.new_row).not.toHaveProperty('email');
  });

  it('logs a signed-in user’s review as theirs and an admin’s edits with no actor', async () => {
    const [{ id: productId }] = (
      await db.query<{ id: string }>(
        `insert into public.products (name, category) values ('Uji', 'matcha') returning id`
      )
    ).rows;

    const id = await asUser(USER, async () => {
      const [review] = (
        await db.query<{ id: string }>(
          `insert into public.reviews (user_id, product_id, stars) values ($1, $2, 4) returning id`,
          [USER, productId]
        )
      ).rows;
      // RLS gives users no update or delete on reviews, so this changes nothing and logs nothing.
      await db.query('update public.reviews set stars = 1 where id = $1', [review.id]);
      return review.id;
    });
    await db.query('update public.reviews set stars = 5 where id = $1', [id]);
    await db.query('delete from public.reviews where id = $1', [id]);

    const log = await entries('reviews');
    expect(log.map((e) => [e.action, e.actor_id])).toEqual([
      ['INSERT', USER],
      ['UPDATE', null],
      ['DELETE', null],
    ]);
    expect(log[0]).toMatchObject({ old_row: null, new_row: { stars: 4, user_id: USER } });
    expect(log[1]).toMatchObject({ old_row: { stars: 4 }, new_row: { stars: 5 } });
    expect(log[2]).toMatchObject({ old_row: { stars: 5 }, new_row: null });
    expect(await entries('products')).toHaveLength(1);
  });

  it('logs want-to-try changes', async () => {
    const [{ id: productId }] = (
      await db.query<{ id: string }>(
        `insert into public.products (name, category) values ('Kyoto', 'hojicha') returning id`
      )
    ).rows;

    await asUser(USER, async () => {
      await db.query('insert into public.wishlist (user_id, product_id) values ($1, $2)', [
        USER,
        productId,
      ]);
      await db.query('delete from public.wishlist where product_id = $1', [productId]);
    });

    expect((await entries('wishlist')).map((e) => [e.action, e.actor_id])).toEqual([
      ['INSERT', USER],
      ['DELETE', USER],
    ]);
  });

  it('is closed to signed-in users and visitors', async () => {
    await asUser(USER, async () => {
      await expect(db.query('select * from public.audit_log')).rejects.toThrow(/permission denied/);
      await expect(
        db.query(`insert into public.audit_log (table_name, action) values ('x', 'INSERT')`)
      ).rejects.toThrow(/permission denied/);
    });
  });
});
