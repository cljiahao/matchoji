-- Official shop pages for the seeded teas, so a tea's page can send people to check stock
-- themselves. Ippodo links go to its global store (the one serving Singapore and the rest of
-- Asia); Aiya's US shop has no page for this exact tin, so it gets the shop's home page. Fills
-- only empty links, so a link set by hand is kept, and it is safe to rerun.

update public.products p
set shop_url = t.url
from (
  values
    ('Ummon-no-mukashi', 'Ippodo', 'https://global.ippodo-tea.co.jp/products/matcha5010131'),
    ('Sayaka-no-mukashi', 'Ippodo', 'https://global.ippodo-tea.co.jp/products/matcha5010331'),
    ('Kan-no-shiro', 'Ippodo', 'https://global.ippodo-tea.co.jp/products/matcha5010431'),
    ('Ikuyo-no-mukashi', 'Ippodo', 'https://global.ippodo-tea.co.jp/products/matcha5010531'),
    ('Wakaki-shiro', 'Ippodo', 'https://global.ippodo-tea.co.jp/products/matcha5010831'),
    ('Gokujo Hojicha', 'Ippodo', 'https://global.ippodo-tea.co.jp/products/bancha601102'),
    ('Organic Hojicha', 'Ippodo', 'https://global.ippodo-tea.co.jp/products/bancha626995'),
    ('Unkaku', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1141020c1'),
    ('Wako', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1161020c1'),
    ('Yugen', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1171020c1'),
    ('Isuzu', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1191040c1'),
    ('Aoarashi', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/11a1040c1'),
    ('Gosho Kaori', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/111c080c6'),
    ('Nishiki Kaori', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/116c080c6'),
    ('Miyabi Kaori', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1c4c080c6'),
    ('Karigane Kaori', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1297150c6'),
    ('Hojicha Powder type A', 'Marukyu Koyamaen', 'https://www.marukyu-koyamaen.co.jp/english/shop/products/1233100c7'),
    ('Ceremonial Grade Matcha', 'Aiya', 'https://www.aiya-america.com/')
) as t (name, brand, url)
where lower(p.name) = lower(t.name)
  and lower(coalesce(p.brand, '')) = lower(t.brand)
  and p.shop_url is null;
