import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

export const SUPABASE_DIR = path.resolve(import.meta.dirname, '../../supabase');

// The Supabase pieces the migrations rely on: the auth schema, auth.uid() read from the
// request's JWT claim, the API roles, and Supabase's default grant of everything on new public
// tables and views (which RLS and explicit revokes then narrow).
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

// An in-process Postgres with every migration applied in filename order. Storage migrations
// are skipped: PGlite has no storage schema.
export async function createMigratedDb(): Promise<PGlite> {
  const db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(SUPABASE_STUB);
  const dir = path.join(SUPABASE_DIR, 'migrations');
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.includes('storage'))
    .sort())
    await db.exec(readFileSync(path.join(dir, file), 'utf8'));
  return db;
}

export const readSupabaseFile = (relative: string) =>
  readFileSync(path.join(SUPABASE_DIR, relative), 'utf8');
