-- Phase 1 follow-up: public reviewer names, invoker-rights rating view, region seed.

-- === reviewer display names ===
-- profiles RLS is owner-only (it holds email), so other users' reviews could not show who
-- wrote them. Rather than open profiles up and publish emails, store a display name and
-- expose only that column through a view.
alter table public.profiles add column display_name text;

update public.profiles p
set display_name = coalesce(
  u.raw_user_meta_data ->> 'full_name',
  u.raw_user_meta_data ->> 'name',
  split_part(p.email, '@', 1)
)
from auth.users u
where u.id = p.id;

alter table public.profiles alter column display_name set not null;

create or replace function public.handle_new_user () returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

-- Deliberately definer-rights (the default): it must read past profiles' owner-only RLS,
-- and it is the column projection that keeps email private.
create view public.public_profiles as
select id, display_name
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- === product_ratings: run with the caller's rights ===
-- reviews are publicly readable anyway, so invoker rights change nothing today but stop
-- the view silently bypassing any stricter reviews policy added later.
alter view public.product_ratings set (security_invoker = true);

-- === regions seed ===
-- Main Japanese tea-growing regions, so the add-product form has something to pick from.
-- name is "<area>, <prefecture>" to match how the UI displays it.
insert into public.regions (name, prefecture, municipality)
values
  ('Uji, Kyoto', 'Kyoto', 'Uji'),
  ('Nishio, Aichi', 'Aichi', 'Nishio'),
  ('Yame, Fukuoka', 'Fukuoka', 'Yame'),
  ('Shizuoka', 'Shizuoka', null),
  ('Kagoshima', 'Kagoshima', null),
  ('Sayama, Saitama', 'Saitama', 'Sayama'),
  ('Ise, Mie', 'Mie', 'Ise');
