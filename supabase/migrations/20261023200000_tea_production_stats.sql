-- Official tea harvest figures per prefecture and year, behind the /regions/supply page.
-- Prefecture-level is the finest current granularity: MAFF's municipal tea series ended in
-- 2006, and its tea-type breakdown (which had tencha, matcha's leaf) ended in 2016, so recent
-- tencha figures come from the national growers' federation instead. `source` keeps the two
-- apart, since their totals differ and must not be mixed in one comparison.

create table public.tea_production_stats (
  -- English name matching regions.prefecture; 'Japan' for the national figure.
  prefecture text not null,
  year smallint not null check (year between 1956 and 2100),
  metric text not null check (metric in ('cultivated_ha', 'aracha_t', 'tencha_t')),
  value numeric not null check (value >= 0),
  source text not null check (source in ('maff', 'zencharen')),
  -- e-Stat statInfId or document URL the value was read from.
  source_ref text not null,
  primary key (prefecture, year, metric, source)
);

alter table public.tea_production_stats enable row level security;

create policy "tea production stats are viewable by everyone"
  on public.tea_production_stats for select
  using (true);

-- No write policy: the seed is run from the SQL editor, like the catalogue seeds.

create trigger audit_tea_production_stats
after insert or update or delete on public.tea_production_stats
for each row execute function public.audit_row_change ();
