-- M1 of docs/superpowers/specs/2026-10-24-vivino-parity-roadmap-design.md: discovery that
-- scales. Explore and the home shelves filter, sort and page in SQL over one view instead of
-- loading the whole catalogue, "Top rated" uses a weighted score, and "Log a tasting" search
-- tolerates typos.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
-- Supabase already grants this; repeated so a fresh database (and the tests) match.
grant usage on schema extensions to anon, authenticated;

-- === catalogue_teas: approved teas with everything the lists sort and filter on ===
-- weighted_score is a Bayesian average, (v·R + m·C) / (v + m): R the tea's average, v its
-- rating count, C the mean of all rated teas' averages, m = 5. A tea with one 5★ rating no
-- longer outranks one with a hundred at 4.8★ (Vivino weights by count too; its formula is
-- undisclosed, so m = 5 is ours). top_rank keeps teas with fewer than 3 ratings below those
-- with enough, and unrated teas last.
create view public.catalogue_teas
with (security_invoker = true) as
with catalogue_mean as (
  select avg(avg_stars) as c from public.product_ratings
)
select
  p.id,
  p.name,
  p.brand,
  p.category,
  p.grade,
  lower(btrim(p.grade)) as grade_key,
  p.region_id,
  g.name as region_name,
  case p.category when 'matcha' then g.matcha_supply else g.hojicha_supply end as supply,
  case case p.category when 'matcha' then g.matcha_supply else g.hojicha_supply end
    when 'scarce' then 0
    when 'tight' then 1
    when 'plentiful' then 2
    else 3
  end as supply_rank,
  p.image_url,
  p.shop_url,
  p.created_at,
  coalesce(r.review_count, 0)::integer as review_count,
  r.avg_stars,
  case
    when r.review_count is null then null
    else (r.review_count * r.avg_stars + 5 * coalesce(m.c, r.avg_stars)) / (r.review_count + 5)
  end::numeric(4, 3) as weighted_score,
  case
    when r.review_count >= 3 then 0
    when r.review_count > 0 then 1
    else 2
  end as top_rank
from public.products p
left join public.product_ratings r on r.product_id = p.id
left join public.regions g on g.id = p.region_id
cross join catalogue_mean m
where p.status = 'approved';

-- === typo-tolerant search for the "Log a tasting" picker ===
create index products_name_trgm_idx on public.products using gin (
  lower(name) extensions.gin_trgm_ops
);
create index products_brand_trgm_idx on public.products using gin (
  lower(coalesce(brand, '')) extensions.gin_trgm_ops
);

-- Approved teas plus the caller's own teas awaiting review, best match first. Invoker rights,
-- so RLS still decides what the caller can see.
create function public.search_teas (q text)
returns table (id uuid, name text, brand text, category text)
language sql stable
set search_path = '' as $$
  with term as (select lower(btrim(q)) as t)
  select p.id, p.name, p.brand, p.category
  from public.products p, term
  where char_length(term.t) >= 2
    and (p.status = 'approved' or (p.status = 'pending' and p.added_by = auth.uid ()))
    and (
      strpos(lower(p.name), term.t) > 0
      or strpos(lower(coalesce(p.brand, '')), term.t) > 0
      or extensions.similarity(lower(p.name), term.t) > 0.3
      or extensions.similarity(lower(p.name || ' ' || coalesce(p.brand, '')), term.t) > 0.3
    )
  order by
    (strpos(lower(p.name), term.t) = 1) desc,
    greatest(
      extensions.similarity(lower(p.name), term.t),
      extensions.similarity(lower(p.name || ' ' || coalesce(p.brand, '')), term.t)
    ) desc,
    p.name
  limit 10
$$;

revoke execute on function public.search_teas (text) from public;
grant execute on function public.search_teas (text) to anon, authenticated;
