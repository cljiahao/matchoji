-- Reference prices: what a tea costs, per pack and per gram, and where that sits among teas of
-- its kind. Set by admins (from the maker's shop) so prices show before any vendor lists the
-- tea. Prices are in Singapore dollars, Matchoji's home market.

alter table public.products
add column price_sgd numeric(8, 2) check (price_sgd > 0),
add column pack_grams numeric(6, 1) check (pack_grams > 0 and pack_grams <= 5000),
add constraint products_price_has_pack check ((price_sgd is null) = (pack_grams is null));

-- A suggested tea arrives without a price, like its photo and shop link.
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
    and merged_into is null
    and review_note is null
    and price_sgd is null
    and pack_grams is null
  );

-- Price per gram, and its band among approved teas of the same category: the cheapest third
-- is budget, the dearest third premium. A band needs at least 3 priced teas to compare.
create view public.tea_prices
with (security_invoker = true) as
with priced as (
  select
    id as product_id,
    category,
    price_sgd,
    pack_grams,
    (price_sgd / pack_grams)::numeric(10, 4) as price_per_gram
  from public.products
  where status = 'approved' and price_sgd is not null
)
select
  p.product_id,
  p.price_sgd,
  p.pack_grams,
  p.price_per_gram,
  case
    when count(*) over (partition by p.category) < 3 then null
    when percent_rank() over (partition by p.category order by p.price_per_gram) < 1.0 / 3
      then 'budget'
    when percent_rank() over (partition by p.category order by p.price_per_gram) < 2.0 / 3
      then 'mid'
    else 'premium'
  end as price_band
from priced p;

-- Lists carry the price too, appended so the view's existing columns keep their order.
create or replace view public.catalogue_teas
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
  end as top_rank,
  t.price_sgd,
  t.pack_grams,
  t.price_per_gram,
  t.price_band
from public.products p
left join public.product_ratings r on r.product_id = p.id
left join public.regions g on g.id = p.region_id
left join public.tea_prices t on t.product_id = p.id
cross join catalogue_mean m
where p.status = 'approved';

-- Admins set or clear a tea's price; both values or neither.
create function public.set_tea_price (tea uuid, price numeric, grams numeric)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  if (price is null) <> (grams is null) then
    raise exception 'Give both the price and the pack size, or neither.' using errcode = '22023';
  end if;
  update public.products set price_sgd = price, pack_grams = grams where id = tea;
  if not found then
    raise exception 'No such tea.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_tea_price (uuid, numeric, numeric) from public, anon;
grant execute on function public.set_tea_price (uuid, numeric, numeric) to authenticated;
