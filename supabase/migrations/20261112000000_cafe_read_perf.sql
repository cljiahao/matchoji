-- Café read-path fix. Idempotent: safe to run twice. The owner applies this by hand in the
-- Supabase SQL editor; the app reads the same columns before and after, so there is no deploy
-- order to respect.
--
-- cafe_ratings counted people (count distinct user) but averaged reviews, so "3 reviews" could sit
-- beside an average of five. Every count is now one latest review, the unit the average is taken
-- over and the unit drink_ratings already uses. Same columns, types and order, so create or
-- replace keeps the grants and the app's select lists unchanged.
create or replace view public.cafe_ratings
with (security_invoker = false) as
select
  c.id as cafe_id,
  count(distinct d.id)::integer as drink_count,
  count(r.id) filter (where r.by_trusted_taster)::integer as taster_count,
  (avg(r.stars) filter (where r.by_trusted_taster))::numeric(3, 2) as taster_avg,
  count(r.id) filter (where not r.by_trusted_taster)::integer as community_count,
  (avg(r.stars) filter (where not r.by_trusted_taster))::numeric(3, 2) as community_avg,
  count(r.id) filter (where r.by_trusted_taster and r.disclosure <> 'none')::integer
    as taster_disclosed_count
from public.cafes c
left join public.drinks d on d.cafe_id = c.id and d.status = 'approved'
left join internal.latest_reviews r on r.drink_id = d.id
where c.status = 'approved'
group by c.id;

-- One row per approved, un-merged drink at an approved, un-merged café, with the key the top
-- lists rank by (taster-reviewed first, then score, then review count; never recency). The app
-- filters by city, base and style, orders by these columns and pages with an exact count, so a
-- list's total and its rows come from one place instead of a capped read ranked in TypeScript.
-- Owner-rights like drink_ratings: it only aggregates, and exposes no review text.
create or replace view public.drink_ranks
with (security_invoker = false) as
select
  d.id as drink_id,
  d.cafe_id,
  c.city_slug,
  d.base,
  d.style,
  d.name,
  (g.taster_count >= 1 or g.community_count >= 3) as qualifies,
  (g.taster_count > 0) as has_taster,
  coalesce(case when g.taster_count > 0 then g.taster_avg else g.community_avg end, 0)
    as rank_score,
  (case when g.taster_count > 0 then g.taster_count else g.community_count end)::integer
    as rank_count
from public.drinks d
join public.cafes c on c.id = d.cafe_id and c.status = 'approved' and c.merged_into is null
join public.drink_ratings g on g.drink_id = d.id
where d.status = 'approved' and d.merged_into is null;

-- Per trusted, public taster: how many drinks they have reviewed (their latest review of each,
-- approved drinks at approved cafés only) and which review is newest. The /tasters page used to
-- count rows out of a capped read shared by every taster, so an older taster read as zero.
create or replace view public.taster_stats
with (security_invoker = false) as
select
  r.user_id,
  count(*)::integer as drink_review_count,
  (array_agg(r.id order by r.created_at desc, r.id))[1] as latest_review_id
from internal.latest_reviews r
join public.drinks d on d.id = r.drink_id and d.status = 'approved' and d.merged_into is null
join public.cafes c on c.id = d.cafe_id and c.status = 'approved' and c.merged_into is null
join public.profiles p on p.id = r.user_id and p.is_trusted_taster and p.is_public
where r.drink_id is not null
group by r.user_id;

revoke all on public.drink_ranks, public.taster_stats from anon, authenticated;
grant select on public.drink_ranks, public.taster_stats to anon, authenticated;

-- internal.latest_reviews is a distinct on over every review; this index matches its key and
-- order so the scan can run in index order instead of sorting the whole table.
create index if not exists reviews_latest_key_idx
  on public.reviews (
    coalesce(user_id, id),
    coalesce(product_id, drink_id),
    tasted_on desc,
    created_at desc
  );
