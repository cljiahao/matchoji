#!/usr/bin/env node
// Fails when a migration in supabase/migrations/ is not recorded as applied on the hosted
// project. Migrations are run by hand, so this is what stops a PR merging (and Vercel deploying
// code) ahead of its schema. Reads supabase_migrations.schema_migrations through the Management
// API, which needs only an access token: no database password lives in CI.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));

export function localVersions(files) {
  return files
    .map((file) => /^(\d{14})_.+\.sql$/.exec(file)?.[1])
    .filter((version) => version !== undefined)
    .sort();
}

export function missingVersions(local, applied) {
  const done = new Set(applied);
  return local.filter((version) => !done.has(version));
}

export async function appliedVersions({ projectRef, token, fetchImpl = fetch }) {
  const response = await fetchImpl(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'select version from supabase_migrations.schema_migrations order by version',
        read_only: true,
      }),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Supabase Management API answered ${response.status}: ${await response.text()}`
    );
  }
  const rows = await response.json();
  return rows.map((row) => String(row.version));
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  if (!token || !projectRef) {
    console.error('SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF must be set.');
    process.exit(2);
  }
  const local = localVersions(readdirSync(MIGRATIONS_DIR));
  const missing = missingVersions(local, await appliedVersions({ projectRef, token }));
  if (missing.length > 0) {
    console.error(`Not applied on the hosted project (${missing.length}):`);
    for (const version of missing) console.error(`  - ${version}`);
    console.error('Run them in the SQL editor (and record them), or `pnpm db:push`.');
    process.exit(1);
  }
  console.log(`All ${local.length} migrations are applied.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
