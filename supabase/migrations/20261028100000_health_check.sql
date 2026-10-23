-- M6 of docs/superpowers/specs/2026-10-24-vivino-parity-roadmap-design.md: /api/health asks the
-- database to answer, so a probe sees an outage instead of a cheerful "ok". PostgREST cannot run
-- a bare "select 1", hence a function anyone may call; it reads nothing.
create function public.health () returns boolean language sql stable
set search_path = '' as $$
  select true
$$;

grant execute on function public.health () to anon, authenticated;
