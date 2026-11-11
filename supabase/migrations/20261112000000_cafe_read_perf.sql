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
