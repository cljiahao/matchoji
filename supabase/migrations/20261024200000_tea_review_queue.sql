-- Teas people add while logging a tasting wait for review before they join the public
-- catalogue, the way Vivino holds an unmatched label scan as "processing" until its team
-- matches or adds the wine. The taster can rate it and see it in their journal straight away,
-- and its page works by link; Explore, the home shelves, search and the regions counts list
-- approved teas only. An admin approves from the SQL editor:
--   update products set status = 'approved', reviewed_at = now() where id = '…';

-- Everything already in the catalogue was added deliberately (the seeds), so it starts
-- approved; the default switches to pending for teas added from here on.
alter table public.products
add column status text not null default 'approved' check (
  status in ('pending', 'approved', 'rejected')
),
add column added_by uuid references public.profiles (id) on delete set null,
add column reviewed_at timestamptz;

alter table public.products alter column status set default 'pending';
alter table public.products alter column added_by set default auth.uid ();

create index products_status_idx on public.products (status);

drop policy "products are insertable by any authenticated user" on public.products;

create policy "signed-in users can suggest teas for review"
  on public.products for insert
  to authenticated
  with check (status = 'pending' and added_by = auth.uid () and reviewed_at is null);

-- A rejected tea (a duplicate, a typo, not a real tea) disappears for everyone but the person
-- who added it, so their tastings of it still have a page.
drop policy "products are viewable by everyone" on public.products;

create policy "approved and pending teas are viewable by everyone"
  on public.products for select
  using (status <> 'rejected');

create policy "rejected teas are viewable by whoever added them"
  on public.products for select
  to authenticated
  using (added_by = auth.uid ());
