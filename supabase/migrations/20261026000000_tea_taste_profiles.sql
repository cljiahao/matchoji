-- M2 of docs/superpowers/specs/2026-10-24-vivino-parity-roadmap-design.md: each tea's community
-- taste, the input to the match score. Built from latest_reviews (each person's newest tasting),
-- so one enthusiastic re-logger cannot reshape a tea's profile.
create view public.tea_taste_profiles
with (security_invoker = true) as
select
  l.product_id,
  avg(l.sweetness)::numeric(3, 2) as sweetness,
  avg(l.umami)::numeric(3, 2) as umami,
  avg(l.bitterness)::numeric(3, 2) as bitterness,
  avg(l.body)::numeric(3, 2) as body,
  coalesce(
    (
      select jsonb_object_agg(n.note, n.mentions)
      from (
        select unnest(l2.flavor_notes) as note, count(*) as mentions
        from public.latest_reviews l2
        where l2.product_id = l.product_id
        group by 1
      ) n
    ),
    '{}'::jsonb
  ) as notes
from public.latest_reviews l
group by l.product_id;
