-- Phase 3, first slice: vendors apply, are approved by hand, and list existing teas with a
-- price, stock and a link to buy on their own site. Checkout (Stripe Connect) and orders come
-- later, so `orders` stays dormant. Both tables are still empty, so the new not-null columns
-- need no defaults.

-- === vendors ===
-- Approval is manual at this scale (design spec: no automated KYC): an admin sets
-- status = 'approved' from the SQL editor. Users can apply and edit their profile but never
-- change status, enforced by the insert check and by column-level update grants.
alter table public.vendors
add column status text not null default 'pending' check (
  status in ('pending', 'approved', 'rejected')
),
add column website text check (website ~ '^https://'),
add column country text not null check (country ~ '^[A-Z]{2}$'),
add column ships_to text[] not null default '{}' check (
  array_position(ships_to, null) is null
  and cardinality(ships_to) <= 60
),
add column reviewed_at timestamptz;

alter table public.vendors
add constraint vendors_name_length check (char_length(name) between 1 and 80),
add constraint vendors_profile_length check (char_length(profile_info) <= 1000);

create policy "approved vendors are viewable by everyone"
  on public.vendors for select
  using (status = 'approved');

create policy "vendors are viewable by their owner"
  on public.vendors for select
  to authenticated
  using (auth.uid () = user_id);

create policy "users can apply as a vendor for themselves"
  on public.vendors for insert
  to authenticated
  with check (auth.uid () = user_id and status = 'pending' and reviewed_at is null);

create policy "vendors are updatable by their owner"
  on public.vendors for update
  to authenticated
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

revoke update on public.vendors from anon, authenticated;
grant update (name, profile_info, website, country, ships_to) on public.vendors to authenticated;

-- Keeps profiles.role (from the Phase 1 data model) in step with approval, so a vendor is a
-- user whose shop was approved; reverting the approval reverts the role.
create function public.sync_vendor_role () returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    update public.profiles
    set role = case when new.status = 'approved' then 'vendor' else 'consumer' end
    where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger vendors_sync_role
after update of status on public.vendors
for each row execute function public.sync_vendor_role ();

-- === listings ===
alter table public.listings
add column currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
add column url text not null check (url ~ '^https://'),
add column updated_at timestamptz not null default now();

alter table public.listings
add constraint listings_price_positive check (price > 0),
add constraint listings_stock_non_negative check (stock >= 0);

-- A listing is public only while its vendor is approved, so rejecting a vendor hides their
-- listings without deleting them.
create function public.is_approved_vendor (vendor uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (select 1 from public.vendors where id = vendor and status = 'approved')
$$;

create function public.owns_vendor (vendor uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (select 1 from public.vendors where id = vendor and user_id = auth.uid ())
$$;

create policy "listings of approved vendors are viewable by everyone"
  on public.listings for select
  using (public.is_approved_vendor (vendor_id));

create policy "listings are viewable by their vendor"
  on public.listings for select
  to authenticated
  using (public.owns_vendor (vendor_id));

create policy "approved vendors can add listings"
  on public.listings for insert
  to authenticated
  with check (public.owns_vendor (vendor_id) and public.is_approved_vendor (vendor_id));

create policy "approved vendors can update their listings"
  on public.listings for update
  to authenticated
  using (public.owns_vendor (vendor_id) and public.is_approved_vendor (vendor_id))
  with check (public.owns_vendor (vendor_id) and public.is_approved_vendor (vendor_id));

create policy "vendors can delete their listings"
  on public.listings for delete
  to authenticated
  using (public.owns_vendor (vendor_id));

create function public.touch_listing () returns trigger language plpgsql
set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger listings_touch
before update on public.listings
for each row execute function public.touch_listing ();
