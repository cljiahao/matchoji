-- Label scanning: one row per photo read, kept only to cap how many a person can send a day
-- (each one is a paid vision call). The photo itself is never stored.
create table public.label_scans (
  id uuid primary key,
  user_id uuid not null default auth.uid () references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.label_scans enable row level security;

create policy "scans are viewable by whoever sent them"
  on public.label_scans for select
  to authenticated
  using (auth.uid () = user_id);

create policy "people can record their own scans"
  on public.label_scans for insert
  to authenticated
  with check (auth.uid () = user_id);

-- Only the id comes from the caller: the person and the time are the server's, so a client
-- cannot backdate rows to slip under the cap.
revoke insert, update on public.label_scans from anon, authenticated;
grant insert (id) on public.label_scans to authenticated;

create index label_scans_user_created_idx on public.label_scans (user_id, created_at desc);

create trigger label_scans_daily_limit
before insert on public.label_scans
for each row execute function public.limit_daily_inserts ('20', 'user_id');

create trigger audit_label_scans
after insert or update or delete on public.label_scans
for each row execute function public.audit_row_change ();
