-- Supply levels and notes for the seeded regions, from public reporting on the 2024-2026
-- matcha shortage. A level is set only where a source covers that region, except hojicha:
-- the bancha shortage is reported nationwide, so every region gets it. Fills only empty
-- fields, so a level or note set by hand is kept, and it is safe to rerun.
--
-- Sources:
--   Ippodo, 19 Feb 2026 (Kyoto first-harvest prices ~2.5x; bancha output "likely to fall
--     substantially" as growers shift to matcha): global.ippodo-tea.co.jp/blogs/news/202602019
--   Intellinews (Nishio output down nearly 25%):
--     intellinews.com/matcha-shortage-in-japan-as-global-demand-soars-389177
--   MAFF data summary (Kagoshima now the top tencha producer; first-flush prices up ~30%
--     there and ~20% in Shizuoka in 2025): matcha-wholesale-japan.com/blogs/news/
--     japans-tea-industry-in-2025-2026-official-maff-data-on-matcha-tencha-production-trends
--   Japan News (tencha ~2% of Shizuoka's tea in 2024): koreaherald.com/article/10762953

update public.regions r
set
  matcha_supply = coalesce(r.matcha_supply, s.matcha_supply),
  hojicha_supply = coalesce(r.hojicha_supply, s.hojicha_supply),
  scarcity_note = coalesce(r.scarcity_note, s.note)
from (
  values
    ('Uji, Kyoto', 'scarce', 'tight',
     'First-harvest tencha sold for about 2.5 times the previous year''s price in 2025, after back-to-back heat waves.'),
    ('Nishio, Aichi', 'tight', 'tight',
     'Matcha output reported down nearly a quarter as the shortage spread beyond Uji.'),
    ('Kagoshima', 'tight', 'tight',
     'Now Japan''s largest tencha producer, yet first-harvest prices still rose about 30% in 2025.'),
    ('Shizuoka', 'tight', 'tight',
     'Mostly a sencha region: tencha was about 2% of its tea in 2024, and first-harvest prices rose about 20% in 2025.'),
    ('Yame, Fukuoka', null, 'tight', null),
    ('Sayama, Saitama', null, 'tight', null),
    ('Ise, Mie', null, 'tight', null)
) as s (name, matcha_supply, hojicha_supply, note)
where r.name = s.name;
