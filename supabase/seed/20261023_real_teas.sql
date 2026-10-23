-- Real teas for the catalogue, so Explore, the shelves and the regions page have something to
-- show. Names are as the makers list them on their own shops (checked 2026-10-23):
--   Ippodo: global.ippodo-tea.co.jp (matcha collection; Gokujo Hojicha, Organic Hojicha)
--   Marukyu Koyamaen: marukyu-koyamaen.co.jp (principal matcha; hojicha catalogue)
--   Aiya: retailer listings of its Ceremonial Grade matcha; Aiya is based in Nishio, Aichi
-- Region and grade are filled only where the maker states them; the rest stay null rather
-- than guessed. No ratings: those come from real tastings.
--
-- Safe to run more than once: a tea already present (same name and brand) is skipped.
-- Run in the Supabase SQL editor; inserts are recorded in audit_log with no actor.

insert into public.products (name, brand, category, grade, region_id)
select t.name, t.brand, t.category, t.grade, r.id
from (
  values
    ('Ummon-no-mukashi', 'Ippodo', 'matcha', null, null),
    ('Sayaka-no-mukashi', 'Ippodo', 'matcha', null, null),
    ('Ikuyo-no-mukashi', 'Ippodo', 'matcha', null, null),
    ('Kan-no-shiro', 'Ippodo', 'matcha', null, null),
    ('Wakaki-shiro', 'Ippodo', 'matcha', null, null),
    ('Unkaku', 'Marukyu Koyamaen', 'matcha', null, null),
    ('Wako', 'Marukyu Koyamaen', 'matcha', null, null),
    ('Yugen', 'Marukyu Koyamaen', 'matcha', null, null),
    ('Isuzu', 'Marukyu Koyamaen', 'matcha', null, null),
    ('Aoarashi', 'Marukyu Koyamaen', 'matcha', null, null),
    ('Ceremonial Grade Matcha', 'Aiya', 'matcha', 'Ceremonial', 'Nishio, Aichi'),
    ('Gokujo Hojicha', 'Ippodo', 'hojicha', null, null),
    ('Organic Hojicha', 'Ippodo', 'hojicha', null, null),
    ('Gosho Kaori', 'Marukyu Koyamaen', 'hojicha', null, null),
    ('Miyabi Kaori', 'Marukyu Koyamaen', 'hojicha', null, null),
    ('Nishiki Kaori', 'Marukyu Koyamaen', 'hojicha', null, null),
    ('Karigane Kaori', 'Marukyu Koyamaen', 'hojicha', 'Karigane', null),
    ('Hojicha Powder type A', 'Marukyu Koyamaen', 'hojicha', null, null)
) as t (name, brand, category, grade, region_name)
left join public.regions r on r.name = t.region_name
where not exists (
  select 1 from public.products p
  where lower(p.name) = lower(t.name) and lower(coalesce(p.brand, '')) = lower(t.brand)
);
