-- Phase 1 schema (Matchoji) — see docs/superpowers/specs/2026-09-14-matchoji-design.md §4.
-- Product is kept seller-agnostic; vendors/listings/orders are schema-only until Phase 3.

-- === profiles ===
-- Extends auth.users with app-specific fields. One row per Supabase Auth user.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'consumer' check (role in ('consumer', 'vendor')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by their owner"
  on public.profiles for select
  using (auth.uid () = id);

create policy "profiles are insertable by their owner"
  on public.profiles for insert
  with check (auth.uid () = id);

create policy "profiles are updatable by their owner"
  on public.profiles for update
  using (auth.uid () = id);

-- Auto-create a profile row when a new Supabase Auth user signs up.
create function public.handle_new_user () returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user ();

-- === regions ===
-- Seeded thin at first (name/prefecture only); e-Stat + scarcity fields filled in as Phase 4 lands.
create table public.regions (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  prefecture text,
  municipality text,
  e_stat_area_ha numeric,
  scarcity_note text,
  created_at timestamptz not null default now()
);

alter table public.regions enable row level security;

create policy "regions are viewable by everyone"
  on public.regions for select
  using (true);

-- No insert/update/delete policy yet — only the service role (which bypasses RLS)
-- writes regions for now, matching "seeded thin, filled in as Phase 4 data work lands".

-- === products ===
-- Canonical catalog item, seller-agnostic. Never gains a required FK to vendors/listings.
create table public.products (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  brand text,
  category text not null check (category in ('hojicha', 'matcha')),
  grade text,
  region_id uuid references public.regions (id),
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products are viewable by everyone"
  on public.products for select
  using (true);

create policy "products are insertable by any authenticated user"
  on public.products for insert
  to authenticated
  with check (true);

-- === reviews ===
-- One user's rating of one product.
create table public.reviews (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "reviews are insertable by their owner"
  on public.reviews for insert
  to authenticated
  with check (auth.uid () = user_id);

-- Aggregate rating lookup for the discover feed (Phase 1) and region browse (Phase 2).
create view public.product_ratings as
select
  product_id,
  count(*) as review_count,
  avg(stars)::numeric(3, 2) as avg_stars
from public.reviews
group by product_id;

-- === vendors (Phase 3 schema, no UI/flow until Phase 3) ===
create table public.vendors (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null,
  profile_info text,
  created_at timestamptz not null default now()
);

alter table public.vendors enable row level security;
-- No policies yet — dormant until Phase 3; only the service role can touch this table.

-- === listings (Phase 3 schema, no UI/flow until Phase 3) ===
-- Many-to-many: one product, many vendors.
create table public.listings (
  id uuid primary key default gen_random_uuid (),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  price numeric(10, 2) not null,
  stock integer not null default 0,
  created_at timestamptz not null default now(),
  unique (vendor_id, product_id)
);

alter table public.listings enable row level security;
-- No policies yet — dormant until Phase 3.

-- === orders (Phase 3 schema stub only) ===
-- payment_ref is an opaque string until Stripe Connect is actually integrated.
create table public.orders (
  id uuid primary key default gen_random_uuid (),
  buyer_user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id),
  qty integer not null default 1,
  status text not null default 'pending',
  payment_ref text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
-- No policies yet — dormant until Phase 3.
