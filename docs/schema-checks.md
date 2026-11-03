# Schema checks

`pnpm schema:check` compares the repository with the live Supabase database, using one read-only,
project-scoped Postgres connection string. It needs no Supabase access token.

1. **Migration drift.** Every file in `supabase/migrations/` must have a row in
   `supabase_migrations.schema_migrations`, and every row must have a file. The failure lists the
   unapplied versions and the versions applied without a file.
2. **Types freshness.** `src/integrations/supabase/database.types.ts` is hand-written, so it is
   compared structurally with `supabase gen types typescript --db-url … --schema public`: the tables
   and views, each column's name, nullability and kind (`string`, `number`, `boolean`, `json`, or an
   array of those), and the enums. It is not an exact diff because the hand-written file names
   CHECK-constrained text columns (`ProductCategory`) and keeps comments, where `gen types` reports
   plain `string`. View columns skip the nullability check, since Postgres cannot prove a view column
   non-null and `gen types` marks every one nullable. Insert and Update shapes and `Functions` are
   not compared.

With no `SUPABASE_DB_URL` the script prints "skipped" and exits 0.

Running the check locally needs Docker (the Supabase CLI runs `postgres-meta` in a container for
`--db-url`) and network access to the pooler. In CI the runner has Docker.

## 1. Create the read-only role

Run this once in the Supabase SQL editor as `postgres`. Replace `<set-me>` with a long random
password and keep it out of git and chat.

```sql
create role schema_checker login password '<set-me>' connection limit 3;
alter role schema_checker set default_transaction_read_only = on;
alter role schema_checker set statement_timeout = '30s';

-- Migration drift: the applied-versions table, nothing else in that schema.
grant usage on schema supabase_migrations to schema_checker;
grant select on supabase_migrations.schema_migrations to schema_checker;

-- Types: gen types lists the public tables, views and functions from the catalog, which shows
-- only relations the role holds some privilege on. REFERENCES is enough for that and does not
-- allow reading a row.
grant usage on schema public to schema_checker;
grant references on all tables in schema public to schema_checker;
alter default privileges in schema public grant references on tables to schema_checker;
```

If `pnpm schema:check` reports a table as missing from the database, grant `select` on it instead
(row-level security still limits what the role can read).

`alter default privileges` covers tables created later by `postgres`, the role the SQL editor and
`supabase db push` run as.

## 2. Build the connection string

GitHub-hosted runners have no IPv6, and the direct `db.<ref>.supabase.co` host is IPv6-only on the
free plan, so use the pooler. In the dashboard open **Connect**, choose **Session pooler**, and copy
the host. Then use the role's name suffixed with the project ref:

```text
postgres://schema_checker.<project-ref>:<set-me>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

URL-encode special characters in the password. Test it from your machine:

```bash
SUPABASE_DB_URL='postgres://…' pnpm schema:check
```

## 3. Add the GitHub secret

Repository **Settings → Secrets and variables → Actions → New repository secret**, name
`SUPABASE_DB_URL`, value the string above. `.github/workflows/schema-check.yml` runs on pull requests
touching `supabase/**` or the types file, weekly (Monday 06:17 UTC), and on demand. Without the secret
it skips cleanly.

## Recording hand-applied migrations

The SQL editor runs a migration but does not record it, so the drift check fails until its version
is in `supabase_migrations.schema_migrations`. After applying a file by hand, record it (the version
is the number before the first underscore):

```sql
insert into supabase_migrations.schema_migrations (version, name)
values ('20261101000000', 'tea_image_credit')
on conflict (version) do nothing;
```

`pnpm db:push` records its own migrations.

## When it fails

- **Unapplied versions:** apply the migration, then record it as above.
- **Applied without a file:** add the missing file under `supabase/migrations/`, or delete the stray row.
- **Types out of date:** edit `database.types.ts` to match the named table or column.
