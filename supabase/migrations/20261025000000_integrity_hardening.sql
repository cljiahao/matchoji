-- M0 of docs/superpowers/specs/2026-10-24-vivino-parity-roadmap-design.md: integrity and
-- security fixes found by the 2026-10-24 sweeps. Section ids (S1, I1, …) refer to that spec.

-- === S1: public_profiles is read-only ===
-- The view is definer-rights and auto-updatable, so Supabase's default grants let anyone edit
-- or delete any profile through it (and a deleted profile cascades to its reviews). Applied by
-- hand on 2026-10-24; recorded here so it cannot come back.
revoke insert, update, delete on public.public_profiles from anon, authenticated;

-- === S2: users edit only their display name ===
-- Profiles are created by handle_new_user (security definer), never by the client.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

drop policy "profiles are insertable by their owner" on public.profiles;
drop policy "profiles are updatable by their owner" on public.profiles;

create policy "profiles are updatable by their owner"
  on public.profiles for update
  to authenticated
  using (auth.uid () = id)
  with check (auth.uid () = id);

-- Existing names are left as they are; new and edited names must fit.
alter table public.profiles
add constraint profiles_display_name_length check (
  char_length(btrim(display_name)) between 1 and 40
) not valid;

-- === S5: a default name never comes from the email ===
create or replace function public.handle_new_user () returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        'Tea drinker ' || substr(md5(new.id::text), 1, 4)
      ),
      40
    )
  );
  return new;
end;
$$;

update public.profiles
set display_name = 'Tea drinker ' || substr(md5(id::text), 1, 4)
where display_name = split_part(email, '@', 1);

-- === I1: public numbers count each person's latest tasting of a tea ===
-- The journal keeps every tasting; the score, its distribution, taste profile and notes use
-- only the most recent one per person, so logging a tea repeatedly cannot move them.
create view public.latest_reviews
with (security_invoker = true) as
select distinct on (user_id, product_id) *
from public.reviews
order by user_id, product_id, tasted_on desc, created_at desc;

create or replace view public.product_ratings
with (security_invoker = true) as
select
  product_id,
  count(*) as review_count,
  avg(stars)::numeric(3, 2) as avg_stars
from public.latest_reviews
group by product_id;

-- === S3: writes attach only to teas that are in the catalogue ===
-- Definer-rights so the check sees the tea whatever its own read rules say.
create function public.is_approved_product (product uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (select 1 from public.products where id = product and status = 'approved')
$$;

-- A taster may also rate and save the tea they added while it awaits review.
create function public.can_engage_product (product uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (
    select 1 from public.products
    where id = product
      and (status = 'approved' or (status = 'pending' and added_by = auth.uid ()))
  )
$$;

drop policy "reviews are insertable by their owner" on public.reviews;
create policy "reviews are insertable by their owner"
  on public.reviews for insert
  to authenticated
  with check (auth.uid () = user_id and public.can_engage_product (product_id));

drop policy "wishlist rows are insertable by their owner" on public.wishlist;
create policy "wishlist rows are insertable by their owner"
  on public.wishlist for insert
  to authenticated
  with check (auth.uid () = user_id and public.can_engage_product (product_id));

drop policy "stock reports are insertable by their author" on public.stock_reports;
create policy "stock reports are insertable by their author"
  on public.stock_reports for insert
  to authenticated
  with check (auth.uid () = user_id and public.is_approved_product (product_id));

drop policy "approved vendors can add listings" on public.listings;
create policy "approved vendors can add listings"
  on public.listings for insert
  to authenticated
  with check (
    public.owns_vendor (vendor_id)
    and public.is_approved_vendor (vendor_id)
    and public.is_approved_product (product_id)
  );

drop policy "approved vendors can update their listings" on public.listings;
create policy "approved vendors can update their listings"
  on public.listings for update
  to authenticated
  using (public.owns_vendor (vendor_id) and public.is_approved_vendor (vendor_id))
  with check (
    public.owns_vendor (vendor_id)
    and public.is_approved_vendor (vendor_id)
    and public.is_approved_product (product_id)
  );

-- === S4: a taster cannot set a pending tea's photo or shop link ===
drop policy "signed-in users can suggest teas for review" on public.products;
create policy "signed-in users can suggest teas for review"
  on public.products for insert
  to authenticated
  with check (
    status = 'pending'
    and added_by = auth.uid ()
    and reviewed_at is null
    and image_url is null
    and shop_url is null
  );

-- === S4: a review photo must be the author's own upload ===
-- Uploads go to review-photos/<user_id>/…; any other URL (a tracking pixel, another host's
-- image) is refused. Not validated against existing rows, which all came from the app.
alter table public.reviews
add constraint reviews_photo_is_own_upload check (
  photo_url is null
  or (
    photo_url ~ '^https://'
    and strpos(photo_url, '/storage/v1/object/public/review-photos/' || user_id::text || '/') > 0
  )
) not valid;

-- === I2: the database repeats the form's limits ===
alter table public.products
add constraint products_name_length check (char_length(btrim(name)) between 1 and 120),
add constraint products_brand_length check (char_length(brand) <= 120),
add constraint products_grade_length check (char_length(grade) <= 60);

-- A day of slack: the form uses the taster's local date, which can be ahead of UTC.
alter table public.reviews
add constraint reviews_notes_length check (char_length(notes) <= 2000),
add constraint reviews_tasted_on_not_future check (tasted_on <= current_date + 1);

-- === I4: one entry per tea ===
create unique index products_name_brand_key on public.products (
  lower(btrim(name)),
  lower(btrim(coalesce(brand, '')))
);

-- === I7: people keep seeing a rejected tea they tasted or saved ===
create policy "rejected teas are viewable by people who tasted or saved them"
  on public.products for select
  to authenticated
  using (
    status = 'rejected'
    and (
      exists (
        select 1 from public.reviews r where r.product_id = products.id and r.user_id = auth.uid ()
      )
      or exists (
        select 1 from public.wishlist w where w.product_id = products.id and w.user_id = auth.uid ()
      )
    )
  );

-- === I9: indexes for the per-tea reads ===
create index reviews_product_id_idx on public.reviews (product_id);
create index listings_product_id_idx on public.listings (product_id);
