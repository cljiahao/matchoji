-- Real shop locations (a maker's own stores, stockists, cafés) behind the /shops map. Each row
-- carries the page its address was read from. Linked to teas by maker name only: products stay
-- seller-agnostic, with no foreign key either way.

create table public.shop_locations (
  id uuid primary key default gen_random_uuid (),
  brand text not null check (char_length(btrim(brand)) between 1 and 80),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  kind text not null check (kind in ('maker_store', 'stockist', 'cafe')),
  address text not null check (char_length(btrim(address)) between 1 and 300),
  city text not null check (char_length(btrim(city)) between 1 and 80),
  country text not null check (char_length(btrim(country)) between 1 and 80),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  source_url text not null check (source_url ~ '^https://[^[:space:]]+$' and char_length(source_url) <= 500),
  checked_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shop_locations_brand_idx on public.shop_locations (lower(brand));

alter table public.shop_locations enable row level security;

create policy "shop locations are viewable by everyone"
  on public.shop_locations for select
  using (true);

create policy "admins can add shop locations"
  on public.shop_locations for insert
  to authenticated
  with check (public.is_admin ());

create policy "admins can edit shop locations"
  on public.shop_locations for update
  to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

create policy "admins can remove shop locations"
  on public.shop_locations for delete
  to authenticated
  using (public.is_admin ());

create function public.touch_shop_location () returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shop_locations_touch
before update on public.shop_locations
for each row execute function public.touch_shop_location ();

create trigger audit_shop_locations
after insert or update or delete on public.shop_locations
for each row execute function public.audit_row_change ();

-- Addresses below were read from the makers' own store pages (source_url); coordinates are
-- OpenStreetMap's for the same building, so approximate to it.
insert into public.shop_locations (brand, name, kind, address, city, country, lat, lng, source_url, checked_at)
values
  (
    'Ippodo',
    'Ippodo Tea Kyoto Main Store',
    'maker_store',
    '52 Tokiwagi-cho, Nakagyo-ku, Kyoto 604-0915',
    'Kyoto',
    'Japan',
    35.0144549,
    135.7675573,
    'https://global.ippodo-tea.co.jp/pages/store-kyoto',
    '2026-11-03'
  ),
  (
    'Ippodo',
    'Ippodo Tea Shin-Marunouchi Store',
    'maker_store',
    'Shin-Marunouchi Bldg. B1F, 1-5-1 Marunouchi, Chiyoda-ku, Tokyo 100-6590',
    'Tokyo',
    'Japan',
    35.6826907,
    139.7643437,
    'https://global.ippodo-tea.co.jp/pages/store-shin-marunouchi',
    '2026-11-03'
  );
