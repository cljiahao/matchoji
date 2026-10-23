-- M2 of docs/superpowers/specs/2026-10-24-vivino-parity-roadmap-design.md: tasters edit and
-- delete their own tastings, delete their account (keeping their ratings, anonymised, as
-- Vivino does), and new tastings and suggested teas are rate-limited.

-- === editing and deleting your own tastings ===
-- Every tasting field is editable; who wrote it and which tea it is are not.
revoke update on public.reviews from anon, authenticated;
grant update (
  stars,
  notes,
  photo_url,
  flavor_notes,
  sweetness,
  umami,
  bitterness,
  body,
  prep_method,
  dose_g,
  water_ml,
  water_temp_c,
  tasted_on
) on public.reviews to authenticated;

create policy "reviews are updatable by their owner"
  on public.reviews for update
  to authenticated
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

create policy "reviews are deletable by their owner"
  on public.reviews for delete
  to authenticated
  using (auth.uid () = user_id);

-- === ratings outlive a deleted account, anonymised ===
alter table public.reviews alter column user_id drop not null;
alter table public.reviews drop constraint reviews_user_id_fkey;
alter table public.reviews
add constraint reviews_user_id_fkey foreign key (user_id) references public.profiles (id) on delete set null;

-- Anonymised tastings have no author, so each counts as its own person rather than all of
-- them collapsing into one "null" taster.
create or replace view public.latest_reviews
with (security_invoker = true) as
select distinct on (coalesce(user_id, id), product_id) *
from public.reviews
order by coalesce(user_id, id), product_id, tasted_on desc, created_at desc;

-- Deletes the caller's account. Their tastings stay, without an author; want-to-try, stock
-- reports and any shop go with the account; teas they suggested lose the credit. The audit
-- trail keeps what happened but not who: their id and name are removed from it afterwards
-- (including the rows this deletion itself writes). Storage photos are removed by the app
-- first, through the Storage API, since deleting storage rows in SQL would orphan the files.
create function public.delete_my_account () returns void language plpgsql security definer
set search_path = '' as $$
declare
  me uuid := auth.uid ();
  me_text text := me::text;
begin
  if me is null then
    raise exception 'Sign in to delete your account.' using errcode = '42501';
  end if;

  delete from auth.users where id = me;

  update public.audit_log set actor_id = null where actor_id = me;
  -- A profile row's own id is the person, so it goes too.
  update public.audit_log
  set old_row = old_row - 'user_id' - 'added_by' - 'display_name'
    - case when table_name = 'profiles' then 'id' else '' end
  where old_row ->> 'user_id' = me_text
    or old_row ->> 'added_by' = me_text
    or (table_name = 'profiles' and old_row ->> 'id' = me_text);
  update public.audit_log
  set new_row = new_row - 'user_id' - 'added_by' - 'display_name'
    - case when table_name = 'profiles' then 'id' else '' end
  where new_row ->> 'user_id' = me_text
    or new_row ->> 'added_by' = me_text
    or (table_name = 'profiles' and new_row ->> 'id' = me_text);
end;
$$;

revoke execute on function public.delete_my_account () from public, anon;
grant execute on function public.delete_my_account () to authenticated;

-- === rate limits ===
-- Generous for a real taster, firm against a script: 60 tastings and 20 suggested teas a day.
-- Arguments: the daily cap and the column naming the author ('user_id' or 'added_by'). The
-- row is read as JSON so one function serves both tables.
create function public.limit_daily_inserts () returns trigger language plpgsql
security definer set search_path = '' as $$
declare
  cap integer := tg_argv[0]::integer;
  author uuid := (to_jsonb(new) ->> tg_argv[1])::uuid;
  recent integer;
begin
  if author is null then
    return new;
  end if;
  if tg_table_name = 'reviews' then
    select count(*) into recent from public.reviews
    where user_id = author and created_at > now() - interval '1 day';
  else
    select count(*) into recent from public.products
    where added_by = author and created_at > now() - interval '1 day';
  end if;
  if recent >= cap then
    raise exception 'That is a lot for one day. Try again tomorrow.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger reviews_daily_limit
before insert on public.reviews
for each row execute function public.limit_daily_inserts ('60', 'user_id');

create trigger products_daily_limit
before insert on public.products
for each row execute function public.limit_daily_inserts ('20', 'added_by');

create index reviews_user_created_idx on public.reviews (user_id, created_at desc);
create index products_added_by_created_idx on public.products (added_by, created_at desc);
