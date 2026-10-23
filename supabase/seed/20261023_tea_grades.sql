-- Grades for the seeded matcha, from each maker's own classification (checked 2026-10-23):
--   Koicha: suitable for thick tea (and thin). Usucha: recommended for thin tea only.
--   Ippodo: its koicha and usucha product collections (global.ippodo-tea.co.jp/collections/all/koicha,
--     .../usucha); a tea in both is Koicha.
--   Marukyu Koyamaen: each product page ("Suitable for making both thick and thin teas" /
--     "Recommended for making thin tea"). Yugen's page states neither, so it stays ungraded.
-- Regions stay null: neither maker states where an individual product is grown (Ippodo blends
-- from Kyoto, Nara and Shiga; Koyamaen blends tencha "grown on different soils").
--
-- Only fills a grade that is still empty, so a grade someone has since edited is kept.
-- Safe to run more than once.

update public.products p
set grade = t.grade
from (
  values
    ('Ummon-no-mukashi', 'Ippodo', 'Koicha'),
    ('Sayaka-no-mukashi', 'Ippodo', 'Koicha'),
    ('Kan-no-shiro', 'Ippodo', 'Koicha'),
    ('Ikuyo-no-mukashi', 'Ippodo', 'Usucha'),
    ('Wakaki-shiro', 'Ippodo', 'Usucha'),
    ('Unkaku', 'Marukyu Koyamaen', 'Koicha'),
    ('Wako', 'Marukyu Koyamaen', 'Usucha'),
    ('Isuzu', 'Marukyu Koyamaen', 'Usucha'),
    ('Aoarashi', 'Marukyu Koyamaen', 'Usucha')
) as t (name, brand, grade)
where lower(p.name) = lower(t.name)
  and lower(coalesce(p.brand, '')) = lower(t.brand)
  and p.grade is null;
