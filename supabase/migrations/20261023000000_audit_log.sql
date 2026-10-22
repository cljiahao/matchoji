-- Audit log: docs/CONSTITUTION.md requires every mutation to write one. Triggers do it in the
-- database, so no write path (app, dashboard, a future API route) can skip it.

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  -- auth.uid () is null for writes made outside a signed-in request (dashboard, service role).
  -- Not a foreign key, so a user's entries outlive their account.
  actor_id uuid default auth.uid (),
  table_name text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_row jsonb,
  new_row jsonb
);

create index audit_log_table_occurred_idx on public.audit_log (table_name, occurred_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, occurred_at desc);

-- RLS on with no policies: visitors and signed-in users can neither read nor write the log.
-- Only the dashboard and the service role see it.
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;

-- Trigger arguments name columns left out of the logged rows (e.g. a profile's email), so the
-- log does not become a second copy of personal data.
create function public.audit_row_change () returns trigger language plpgsql security definer
set search_path = '' as $$
declare
  redacted text[] := coalesce(tg_argv::text[], '{}');
begin
  insert into public.audit_log (table_name, action, old_row, new_row)
  values (
    tg_table_name,
    tg_op,
    case when tg_op <> 'INSERT' then to_jsonb(old) - redacted end,
    case when tg_op <> 'DELETE' then to_jsonb(new) - redacted end
  );
  return null;
end;
$$;

create trigger audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.audit_row_change ('email');

create trigger audit_regions
after insert or update or delete on public.regions
for each row execute function public.audit_row_change ();

create trigger audit_products
after insert or update or delete on public.products
for each row execute function public.audit_row_change ();

create trigger audit_reviews
after insert or update or delete on public.reviews
for each row execute function public.audit_row_change ();

create trigger audit_wishlist
after insert or update or delete on public.wishlist
for each row execute function public.audit_row_change ();

create trigger audit_vendors
after insert or update or delete on public.vendors
for each row execute function public.audit_row_change ();

create trigger audit_listings
after insert or update or delete on public.listings
for each row execute function public.audit_row_change ();

create trigger audit_orders
after insert or update or delete on public.orders
for each row execute function public.audit_row_change ();
