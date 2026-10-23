-- How easy each region's matcha and hojicha are to get, as a ranked level the Explore and
-- Regions sorts can order by; scarcity_note stays the human-readable reason. Null means no
-- sourced figure yet. Phase 4's e-Stat data work can later replace hand-entered levels.

alter table public.regions
add column matcha_supply text check (matcha_supply in ('scarce', 'tight', 'plentiful')),
add column hojicha_supply text check (hojicha_supply in ('scarce', 'tight', 'plentiful'));
