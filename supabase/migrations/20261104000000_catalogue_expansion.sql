-- Catalogue expansion: more real matcha and hojicha, and more real shop locations. Data only,
-- no schema change. Every tea was read on the maker's own shop page (shop_url), checked 2026-11-03:
--   Ippodo: global.ippodo-tea.co.jp (JPY). Grade from its koicha / usucha collections; a tea in
--     both is Koicha, as in 20261023_tea_grades.sql.
--   Marukyu Koyamaen: marukyu-koyamaen.co.jp/english/shop (JPY). Grade only where the page says
--     "thick tea" (Koicha) or "thin tea" (Usucha); Choan and Eiju say "a thin tea with a thicker
--     texture", so stay ungraded. Hojicha priced at the 80g bag.
--   Horii Shichimeien: horiishichimeien.com/en (JPY, tax included). Grade from "Recommended
--     Uses"; "Usucha / Koicha" is Koicha. The matcha say "Origin: Kyoto, Japan" only, so no region;
--     the two hojicha are titled Uji hojicha, so they link to Uji, Kyoto.
--   Kettl: kettl.co (US storefront, "$" read as USD). Region from its "Production Area" line;
--     grade only where it says "koicha grade" (Hibiki) or "top usucha grade" (Shinme).
-- price_sgd is the maker's price for pack_grams converted at the ECB reference rates of
-- 2026-11-02 (1 EUR = 177.10 JPY = 1.1216 USD = 1.4344 SGD): 1 JPY = 0.0080994 SGD,
-- 1 USD = 1.2789 SGD, rounded to cents. The rate moves; the price is a reference, like the rest.
-- Seeded teas skip the review queue (status 'approved'). No ratings, no photos.
--
-- Safe to rerun: a tea already present (same name and brand, ignoring case) and a shop already
-- present (same brand and name) are skipped. Run in the Supabase SQL editor.

insert into public.products (name, brand, category, grade, region_id, status, shop_url, price_sgd, pack_grams)
select t.name, t.brand, t.category, t.grade, r.id, 'approved', t.shop_url, t.price_sgd, t.pack_grams
from (
  values
    ('Shoin-no-mukashi', 'Ippodo', 'matcha', 'Koicha', null, 'https://global.ippodo-tea.co.jp/products/matcha5018231', 32.40, 20),
    ('Kanza', 'Ippodo', 'matcha', 'Koicha', null, 'https://global.ippodo-tea.co.jp/products/matcha5038731', 121.49, 20),
    ('Kuon', 'Ippodo', 'matcha', 'Koicha', null, 'https://global.ippodo-tea.co.jp/products/matcha5030631', 72.89, 20),
    ('Hatsu-mukashi', 'Ippodo', 'matcha', 'Usucha', null, 'https://global.ippodo-tea.co.jp/products/matcha5010931', 6.48, 20),
    ('Tsukikage Special Autumn Matcha', 'Ippodo', 'matcha', 'Koicha', null, 'https://global.ippodo-tea.co.jp/products/matcha399061', 18.63, 20),
    ('Organic Matcha', 'Ippodo', 'matcha', 'Usucha', null, 'https://global.ippodo-tea.co.jp/products/matcha5014831', 14.58, 20),
    ('Hojicha (Roasted Tea)', 'Ippodo', 'hojicha', null, null, 'https://global.ippodo-tea.co.jp/products/bancha5060141', 8.10, 80),
    ('Tenju', 'Marukyu Koyamaen', 'matcha', 'Koicha', null, 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1111020c1', 162.80, 20),
    ('Kiwami Choan', 'Marukyu Koyamaen', 'matcha', null, null, 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1g36020c1', 102.05, 20),
    ('Choan', 'Marukyu Koyamaen', 'matcha', null, null, 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1121020c1', 57.91, 20),
    ('Eiju', 'Marukyu Koyamaen', 'matcha', null, null, 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1131020c1', 38.07, 20),
    ('Kinrin', 'Marukyu Koyamaen', 'matcha', null, null, 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1151020c1', 24.30, 20),
    ('Chigi no Shiro', 'Marukyu Koyamaen', 'matcha', 'Usucha', null, 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1181040c1', 23.65, 40),
    ('Ogura Kaori', 'Marukyu Koyamaen', 'hojicha', null, null, 'https://www.marukyu-koyamaen.co.jp/english/shop/products/114c040c1', 5.75, 80),
    ('Kiku Kaori', 'Marukyu Koyamaen', 'hojicha', null, null, 'https://www.marukyu-koyamaen.co.jp/english/shop/products/113c040c1', 7.05, 80),
    ('Beni Kaori', 'Marukyu Koyamaen', 'hojicha', null, null, 'https://www.marukyu-koyamaen.co.jp/english/shop/products/115c040c1', 5.10, 80),
    ('Narino', 'Horii Shichimeien', 'matcha', 'Koicha', null, 'https://horiishichimeien.com/en/products/matcha-narino', 43.74, 20),
    ('Okunoyama', 'Horii Shichimeien', 'matcha', 'Koicha', null, 'https://horiishichimeien.com/en/products/matcha-okunoyama', 39.36, 20),
    ('Mumon', 'Horii Shichimeien', 'matcha', 'Koicha', null, 'https://horiishichimeien.com/en/products/matcha-mumon', 39.36, 20),
    ('Agata no Shiro', 'Horii Shichimeien', 'matcha', 'Usucha', null, 'https://horiishichimeien.com/en/products/matcha-agatanoshiro', 26.24, 30),
    ('Uji Mukashi', 'Horii Shichimeien', 'matcha', 'Usucha', null, 'https://horiishichimeien.com/en/products/matcha-ujimukashi', 20.12, 30),
    ('Hojicha Powder', 'Horii Shichimeien', 'hojicha', null, 'Uji, Kyoto', 'https://horiishichimeien.com/en/products/%E3%81%BB%E3%81%86%E3%81%98%E8%8C%B6%E3%83%91%E3%82%A6%E3%83%80%E3%83%BC-100g', 7.87, 100),
    ('Oyatoko no Hojicha', 'Horii Shichimeien', 'hojicha', null, 'Uji, Kyoto', 'https://horiishichimeien.com/en/products/hojicha-oyatokonohojicha', 4.37, 100),
    ('Hibiki Matcha', 'Kettl', 'matcha', 'Koicha', 'Yame, Fukuoka', 'https://kettl.co/products/hibiki-matcha', 66.50, 20),
    ('Hanaka Matcha', 'Kettl', 'matcha', null, 'Yame, Fukuoka', 'https://kettl.co/products/hanaka-matcha', 46.04, 20),
    ('Shinme Matcha', 'Kettl', 'matcha', 'Usucha', 'Yame, Fukuoka', 'https://kettl.co/products/shinme-matcha', 48.60, 20),
    ('Okuju Matcha', 'Kettl', 'matcha', null, 'Uji, Kyoto', 'https://kettl.co/products/okuju-matcha', 57.55, 30),
    ('Kiyona Matcha', 'Kettl', 'matcha', null, 'Uji, Kyoto', 'https://kettl.co/products/kiyona-matcha', 57.55, 40),
    ('Satsuma Organic Saemidori Matcha', 'Kettl', 'matcha', null, 'Kagoshima', 'https://kettl.co/products/satsuma-organic-saemidori-matcha', 51.16, 20),
    ('Suiteki Matcha', 'Kettl', 'matcha', null, 'Nishio, Aichi', 'https://kettl.co/products/suiteki-matcha-100g', 102.31, 100),
    ('Shirakawa Houjicha Powder', 'Kettl', 'hojicha', null, 'Uji, Kyoto', 'https://kettl.co/products/shirakawa-houjicha-powder', 44.76, 100)
) as t (name, brand, category, grade, region_name, shop_url, price_sgd, pack_grams)
left join public.regions r on r.name = t.region_name
where not exists (
  select 1 from public.products p
  where lower(p.name) = lower(t.name) and lower(coalesce(p.brand, '')) = lower(t.brand)
);

-- Shops: addresses as the brand's own page gives them (source_url). Coordinates are
-- OpenStreetMap's for the same building or street number, so approximate to it.
insert into public.shop_locations (brand, name, kind, address, city, country, lat, lng, source_url, checked_at)
select s.brand, s.name, s.kind, s.address, s.city, s.country, s.lat, s.lng, s.source_url, s.checked_at
from (
  values
    ('Marukyu Koyamaen', 'Marukyu Koyamaen at Kyoto Takashimaya', 'stockist', 'Kyoto Takashimaya Dept. Store B1F, Nishiiru Shin-cho, Shijo-dori Kawaramachi, Shimogyo-ku, Kyoto', 'Kyoto', 'Japan', 35.0030743::double precision, 135.7684253::double precision, 'https://www.marukyu-koyamaen.co.jp/english/company.html', date '2026-11-03'),
    ('Horii Shichimeien', 'Horii Shichimeien Uji Store', 'maker_store', '84 Uji Myoraku, Uji City, Kyoto Prefecture 611-0021', 'Uji', 'Japan', 34.8885484, 135.8053494, 'https://horiishichimeien.com/en/pages/company', date '2026-11-03'),
    ('Kettl', 'Kettl Greenpoint', 'cafe', '70 Greenpoint Ave, Brooklyn, NY 11222', 'Brooklyn', 'United States', 40.7296813, -73.9581821, 'https://kettl.co/pages/faq', date '2026-11-03'),
    ('Kettl', 'Kettl Los Feliz', 'cafe', '4677 Hollywood Blvd, Los Angeles, CA 90027', 'Los Angeles', 'United States', 34.1009268, -118.2911494, 'https://kettl.co/pages/faq', date '2026-11-03')
) as s (brand, name, kind, address, city, country, lat, lng, source_url, checked_at)
where not exists (
  select 1 from public.shop_locations l
  where lower(l.brand) = lower(s.brand) and lower(l.name) = lower(s.name)
);
