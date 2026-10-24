-- M4 of docs/superpowers/specs/2026-10-24-vivino-parity-roadmap-design.md: editions, tea's
-- vintages. A tasting may say which harvest year and flush it was; ratings roll up per edition
-- as well as per tea, the way Vivino rates each vintage and the wine. Kept on the tasting rather
-- than a separate table, so naming an edition is two optional fields, not a catalogue entry.
-- Plus a personal stash: how many of a want-to-try tea you have, and when you opened it.

alter table public.reviews
add column harvest_year smallint check (harvest_year between 1990 and 2100),
add column flush text check (flush in ('first', 'second', 'autumn', 'unspecified'));

grant update (harvest_year, flush) on public.reviews to authenticated;

-- latest_reviews was defined as reviews.*, which was expanded when it was created; recreate it
-- so the new columns come through (same definition, appended columns).
create or replace view public.latest_reviews
with (security_invoker = true) as
select distinct on (coalesce(user_id, id), product_id) *
from public.reviews
order by coalesce(user_id, id), product_id, tasted_on desc, created_at desc;

-- Ratings per edition, from each person's latest tasting of the tea that named one.
-- top_harvest marks the best-rated edition of a tea among those with at least 3 ratings.
create view public.edition_ratings
with (security_invoker = true) as
with editions as (
  select
    product_id,
    harvest_year,
    coalesce(flush, 'unspecified') as flush,
    count(*)::integer as review_count,
    avg(stars)::numeric(3, 2) as avg_stars
  from public.latest_reviews
  where harvest_year is not null
  group by product_id, harvest_year, coalesce(flush, 'unspecified')
)
select
  e.*,
  e.review_count >= 3
  and e.avg_stars = (
    select max(o.avg_stars) from editions o
    where o.product_id = e.product_id and o.review_count >= 3
  ) as top_harvest
from editions e;

-- === the stash ===
alter table public.wishlist
add column owned_quantity smallint not null default 0 check (owned_quantity between 0 and 99),
add column opened_on date;

create policy "wishlist rows are updatable by their owner"
  on public.wishlist for update
  to authenticated
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

revoke update on public.wishlist from anon, authenticated;
grant update (owned_quantity, opened_on) on public.wishlist to authenticated;
