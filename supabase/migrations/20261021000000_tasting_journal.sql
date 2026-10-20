-- Tasting journal: richer review entries (flavour notes, taste profile, preparation) and a
-- per-user "want to try" list. See docs/superpowers/specs/2026-10-21-tasting-journal-redesign-design.md.

-- === reviews: tasting profile and preparation ===
-- Every new column is optional so a stars-only log stays a one-tap action. Ranges mirror
-- the app's Zod schema; the database enforces them too because RLS lets users insert directly.
alter table public.reviews
  add column flavor_notes text[] not null default '{}'
    check (cardinality(flavor_notes) <= 6),
  add column sweetness smallint check (sweetness between 1 and 5),
  add column umami smallint check (umami between 1 and 5),
  add column bitterness smallint check (bitterness between 1 and 5),
  add column body smallint check (body between 1 and 5),
  add column prep_method text
    check (prep_method in ('usucha', 'koicha', 'latte', 'iced', 'cold-brew', 'steeped', 'other')),
  add column dose_g numeric(4, 1) check (dose_g between 0 and 50),
  add column water_ml integer check (water_ml between 0 and 1000),
  add column water_temp_c integer check (water_temp_c between 0 and 100),
  add column tasted_on date not null default current_date;

-- The journal lists one user's tastings newest first.
create index reviews_user_tasted_on_idx on public.reviews (user_id, tasted_on desc);

-- === wishlist ("want to try") ===
create table public.wishlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.wishlist enable row level security;

create policy "wishlist rows are viewable by their owner"
  on public.wishlist for select
  to authenticated
  using (auth.uid () = user_id);

create policy "wishlist rows are insertable by their owner"
  on public.wishlist for insert
  to authenticated
  with check (auth.uid () = user_id);

create policy "wishlist rows are deletable by their owner"
  on public.wishlist for delete
  to authenticated
  using (auth.uid () = user_id);
