-- Sweep fixes for the café and drink schema (20261110000000_cafes_and_drinks.sql, already
-- applied, left untouched). Idempotent: safe to run twice.
--
-- The owner applies this by hand in the Supabase SQL editor. One step can refuse: the
-- duplicate-café index (§6) stops with a message naming the duplicates if two live cafés
-- already share a city, name and area; merge or reject one of each pair, then run it again.

-- === 1. cafe_ratings: disclosed taster count ===
-- Appended last: create or replace view cannot reorder existing columns. Like taster_count
-- it counts people, so "N of M taster reviews" never has N larger than M.
create or replace view public.cafe_ratings
with (security_invoker = false) as
select
  c.id as cafe_id,
  count(distinct d.id)::integer as drink_count,
  count(distinct coalesce(r.user_id, r.id)) filter (where r.by_trusted_taster)::integer
    as taster_count,
  (avg(r.stars) filter (where r.by_trusted_taster))::numeric(3, 2) as taster_avg,
  count(distinct coalesce(r.user_id, r.id)) filter (where not r.by_trusted_taster)::integer
    as community_count,
  (avg(r.stars) filter (where not r.by_trusted_taster))::numeric(3, 2) as community_avg,
  count(distinct coalesce(r.user_id, r.id))
    filter (where r.by_trusted_taster and r.disclosure <> 'none')::integer
    as taster_disclosed_count
from public.cafes c
left join public.drinks d on d.cafe_id = c.id and d.status = 'approved'
left join internal.latest_reviews r on r.drink_id = d.id
where c.status = 'approved'
group by c.id;

-- === 2. a drink name is unique among live drinks only ===
-- A rejected or merged drink no longer holds its name. Same index name, so the constraint
-- the app already recognises on a duplicate keeps its name.
drop index if exists public.drinks_cafe_name_key;
create unique index drinks_cafe_name_key
  on public.drinks (cafe_id, lower(btrim(name)))
  where status <> 'rejected' and merged_into is null;

-- === 6a. no duplicate cafés ===
-- Fails with the duplicates listed rather than leaving the index half-built.
do $$
declare
  dupes text;
begin
  select string_agg(format('%s / %s / %s (%s rows)', city_slug, name_key, area_key, n), '; ')
  into dupes
  from (
    select
      city_slug,
      lower(btrim(name)) as name_key,
      lower(btrim(coalesce(area, ''))) as area_key,
      count(*) as n
    from public.cafes
    where status <> 'rejected' and merged_into is null
    group by 1, 2, 3
    having count(*) > 1
  ) d;
  if dupes is not null then
    raise exception
      'Cannot add cafes_city_name_area_key: duplicate live cafés exist: %. Merge or reject them first.',
      dupes;
  end if;
end;
$$;

drop index if exists public.cafes_city_name_area_key;
create unique index cafes_city_name_area_key
  on public.cafes (city_slug, lower(btrim(name)), lower(btrim(coalesce(area, ''))))
  where status <> 'rejected' and merged_into is null;

-- === 6b. daily cap on submissions of any status ===
-- The pending cap alone lets someone submit, get rejected and submit again without limit.
-- Admins are exempt: they seed and import cafés in bulk. Same message as limit_daily_inserts.
create or replace function public.limit_daily_submissions () returns trigger language plpgsql
security definer set search_path = '' as $$
declare
  cap integer := tg_argv[0]::integer;
  author uuid := new.added_by;
  recent integer;
begin
  if author is null
    or coalesce((select is_admin from public.profiles where id = author), false) then
    return new;
  end if;
  if tg_table_name = 'cafes' then
    select count(*) into recent from public.cafes
    where added_by = author and created_at > now() - interval '1 day';
  else
    select count(*) into recent from public.drinks
    where added_by = author and created_at > now() - interval '1 day';
  end if;
  if recent >= cap then
    raise exception 'That is a lot for one day. Try again tomorrow.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_daily_submissions () from public, anon, authenticated;

drop trigger if exists cafes_daily_limit on public.cafes;
create trigger cafes_daily_limit before insert on public.cafes
for each row execute function public.limit_daily_submissions ('15');

drop trigger if exists drinks_daily_limit on public.drinks;
create trigger drinks_daily_limit before insert on public.drinks
for each row execute function public.limit_daily_submissions ('30');

-- === 9. an Instagram handle is not just dots ===
-- "." and ".." would turn instagram.com/<handle> into a path traversal.
update public.profiles set instagram_handle = null where instagram_handle ~ '^\.+$';
update public.cafes set instagram_handle = null where instagram_handle ~ '^\.+$';

alter table public.profiles drop constraint if exists profiles_instagram_handle_not_dots;
alter table public.profiles
add constraint profiles_instagram_handle_not_dots check (instagram_handle !~ '^\.+$');

alter table public.cafes drop constraint if exists cafes_instagram_handle_not_dots;
alter table public.cafes
add constraint cafes_instagram_handle_not_dots check (instagram_handle !~ '^\.+$');

-- === 4. reactions follow the review's own visibility ===
-- A drink review is open to reactions while its drink is viewable (approved at an approved café,
-- or the adder's own pending one), and always to the review's author and admins. A private
-- author's review still shows anonymously on the drink page, so it can be reacted to. Tea reviews
-- keep their existing rule (no drink, so always true here).
create or replace function public.can_see_review (review uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (
    select 1 from public.reviews r
    where r.id = review
      and (
        r.drink_id is null
        or r.user_id = auth.uid ()
        or public.is_admin ()
        or public.can_view_drink (r.drink_id)
      )
  )
$$;

revoke execute on function public.can_see_review (uuid) from public;
grant execute on function public.can_see_review (uuid) to anon, authenticated;

create or replace function public.can_react_to (review uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (select 1 from public.reviews where id = review)
    and public.can_see_review (review)
    and not public.is_blocked_between (
      auth.uid (), (select user_id from public.reviews where id = review)
    )
$$;

drop policy if exists "likes are viewable by everyone" on public.review_likes;
drop policy if exists "likes are viewable where their review is" on public.review_likes;
create policy "likes are viewable where their review is"
  on public.review_likes for select
  using (public.can_see_review (review_id));

drop policy if exists "comments are viewable by everyone" on public.review_comments;
drop policy if exists "comments are viewable where their review is" on public.review_comments;
create policy "comments are viewable where their review is"
  on public.review_comments for select
  using (public.can_see_review (review_id));

-- === 5. disclosure only goes up; the Instagram link is fixed once set ===
-- Direct client updates only: definer functions (delete_my_account, which clears both on
-- purpose, and the merge that moves reviews) run as the table owner and are left alone.
create or replace function public.enforce_taster_rules () returns trigger language plpgsql
set search_path = '' as $$
declare
  rank_old integer;
  rank_new integer;
begin
  if not new.by_trusted_taster and (new.instagram_url is not null or new.disclosure <> 'none') then
    raise exception 'Only trusted tasters can add an Instagram link or a disclosure.'
      using errcode = '42501';
  end if;
  if new.by_trusted_taster and new.drink_id is not null and new.instagram_url is null then
    raise exception 'A taster''s drink review needs the Instagram post link.'
      using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and current_user in ('authenticated', 'anon') then
    rank_old := array_position(array['none', 'invited', 'gifted', 'paid'], old.disclosure);
    rank_new := array_position(array['none', 'invited', 'gifted', 'paid'], new.disclosure);
    if rank_new < rank_old then
      raise exception 'A disclosure can be raised but not lowered after publishing.'
        using errcode = '42501';
    end if;
    if old.instagram_url is not null
      and new.instagram_url is distinct from old.instagram_url
      and not public.is_admin () then
      raise exception 'The Instagram link cannot be changed once it is set.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- === 7. reviewing a merged row is refused ===
create or replace function public.review_cafe (cafe uuid, decision text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = '22023';
  end if;
  if exists (select 1 from public.cafes where id = cafe and merged_into is not null) then
    raise exception 'This café was merged into another one and cannot be reviewed.'
      using errcode = '22023';
  end if;
  begin
    update public.cafes
    set status = decision, reviewed_at = now(), review_note = nullif(btrim(note), '')
    where id = cafe;
  exception when unique_violation then
    raise exception 'Another live café already has this name and area.' using errcode = '23505';
  end;
  if not found then
    raise exception 'No such café.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.review_drink (drink uuid, decision text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = '22023';
  end if;
  if exists (select 1 from public.drinks where id = drink and merged_into is not null) then
    raise exception 'This drink was merged into another one and cannot be reviewed.'
      using errcode = '22023';
  end if;
  if decision = 'approved' and not exists (
    select 1 from public.drinks d
    join public.cafes c on c.id = d.cafe_id
    where d.id = drink and c.status = 'approved'
  ) then
    raise exception 'Approve the café first.' using errcode = '22023';
  end if;
  begin
    update public.drinks
    set status = decision, reviewed_at = now(), review_note = nullif(btrim(note), '')
    where id = drink;
  exception when unique_violation then
    raise exception 'Another live drink at this café already has this name.'
      using errcode = '23505';
  end;
  if not found then
    raise exception 'No such drink.' using errcode = 'P0002';
  end if;
end;
$$;

-- === 3. merge_cafe copes with rejected and merged drinks on the keeper ===
-- Only a live (neither rejected nor merged) drink holds a name, so a rejected one on either side
-- is no clash. A moved drink whose slug is already taken at the keeper gets the next free
-- numbered slug (the one slug change a drink ever has), since (cafe_id, slug) is unique. The
-- renamed drink's old URL under the merged café does not forward to it: drinks have no slug
-- redirect, only merged_into between drinks, and building one is out of scope here.
create or replace function public.merge_cafe (duplicate uuid, keep uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  kept_name text;
  d record;
  clash uuid;
  moved_slug text;
  n integer;
begin
  perform public.require_admin ();
  if duplicate = keep then
    raise exception 'A café cannot be merged into itself.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.cafes where id = duplicate) then
    raise exception 'No such café.' using errcode = 'P0002';
  end if;
  select name into kept_name from public.cafes where id = keep and status = 'approved';
  if kept_name is null then
    raise exception 'Merge into an approved café.' using errcode = '22023';
  end if;
  if (select city_slug from public.cafes where id = duplicate)
    is distinct from (select city_slug from public.cafes where id = keep) then
    raise exception 'Cafés in different cities cannot be merged.' using errcode = '22023';
  end if;

  for d in
    select id, slug, name, status, merged_into from public.drinks where cafe_id = duplicate
  loop
    clash := null;
    if d.status <> 'rejected' and d.merged_into is null then
      select k.id into clash
      from public.drinks k
      where k.cafe_id = keep
        and k.status <> 'rejected'
        and k.merged_into is null
        and lower(btrim(k.name)) = lower(btrim(d.name))
      limit 1;
    end if;
    if clash is not null then
      if (select status from public.drinks where id = clash) <> 'approved' then
        raise exception 'Approve or reject the café''s matching drink "%" first.', d.name
          using errcode = '22023';
      end if;
      -- It stays under the duplicate, rejected and forwarding.
      perform internal.merge_drink_into (d.id, clash);
    else
      moved_slug := d.slug;
      n := 1;
      while exists (select 1 from public.drinks where cafe_id = keep and slug = moved_slug) loop
        n := n + 1;
        moved_slug := d.slug || '-' || n;
      end loop;
      update public.drinks set cafe_id = keep, slug = moved_slug where id = d.id;
    end if;
  end loop;

  update public.notifications set cafe_id = keep where cafe_id = duplicate;
  update public.cafes set merged_into = keep where merged_into = duplicate;

  update public.cafes
  set
    status = 'rejected',
    reviewed_at = now(),
    merged_into = keep,
    review_note = 'Duplicate of ' || kept_name
  where id = duplicate;
end;
$$;

-- === 8. update_cafe / update_drink validate before they write ===
-- A number that does not parse or is out of range is a clean 22023, not a raw cast error. The
-- name is trimmed, and a blank one refused.
create or replace function internal.json_number (fields jsonb, key text) returns numeric
language plpgsql immutable set search_path = '' as $$
declare
  raw text := btrim(fields ->> key);
  parsed numeric;
begin
  if raw is null or raw = '' then
    return null;
  end if;
  begin
    parsed := raw::numeric;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception '% must be a number.', key using errcode = '22023';
  end;
  if parsed in ('NaN', 'Infinity', '-Infinity') then
    raise exception '% must be a number.', key using errcode = '22023';
  end if;
  return parsed;
end;
$$;

revoke execute on function internal.json_number (jsonb, text) from public, anon, authenticated;

create or replace function public.update_cafe (cafe uuid, fields jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  allowed text[] := array[
    'name', 'area', 'address', 'lat', 'lng', 'instagram_handle', 'website_url'
  ];
  unknown text;
  new_name text;
  new_lat numeric;
  new_lng numeric;
begin
  perform public.require_admin ();
  if jsonb_typeof(fields) is distinct from 'object' then
    raise exception 'Fields must be an object.' using errcode = '22023';
  end if;
  select k into unknown from jsonb_object_keys (fields) k where k <> all (allowed) limit 1;
  if unknown is not null then
    raise exception 'Cannot edit %.', unknown using errcode = '22023';
  end if;
  if fields ? 'name' then
    new_name := btrim(fields ->> 'name');
    if new_name is null or char_length(new_name) not between 1 and 120 then
      raise exception 'Name must be 1 to 120 characters.' using errcode = '22023';
    end if;
  end if;
  if fields ? 'lat' then
    new_lat := internal.json_number (fields, 'lat');
    if new_lat not between -90 and 90 then
      raise exception 'lat must be between -90 and 90.' using errcode = '22023';
    end if;
  end if;
  if fields ? 'lng' then
    new_lng := internal.json_number (fields, 'lng');
    if new_lng not between -180 and 180 then
      raise exception 'lng must be between -180 and 180.' using errcode = '22023';
    end if;
  end if;
  begin
    update public.cafes
    set
      name = case when fields ? 'name' then new_name else name end,
      area = case when fields ? 'area' then nullif(btrim(fields ->> 'area'), '') else area end,
      address = case when fields ? 'address' then nullif(btrim(fields ->> 'address'), '') else address end,
      lat = case when fields ? 'lat' then new_lat::double precision else lat end,
      lng = case when fields ? 'lng' then new_lng::double precision else lng end,
      instagram_handle = case
        when fields ? 'instagram_handle' then nullif(btrim(fields ->> 'instagram_handle'), '')
        else instagram_handle
      end,
      website_url = case
        when fields ? 'website_url' then nullif(btrim(fields ->> 'website_url'), '')
        else website_url
      end
    where id = cafe;
  exception
    when unique_violation then
      raise exception 'Another live café already has this name and area.' using errcode = '23505';
    when check_violation then
      raise exception 'That value is not allowed for this café.' using errcode = '22023';
  end;
  if not found then
    raise exception 'No such café.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.update_drink (drink uuid, fields jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  allowed text[] := array[
    'name', 'base', 'style', 'serving', 'price', 'photo_url', 'photo_credit', 'tea_product_id'
  ];
  unknown text;
  new_name text;
  new_price numeric;
  new_tea uuid;
begin
  perform public.require_admin ();
  if jsonb_typeof(fields) is distinct from 'object' then
    raise exception 'Fields must be an object.' using errcode = '22023';
  end if;
  select k into unknown from jsonb_object_keys (fields) k where k <> all (allowed) limit 1;
  if unknown is not null then
    raise exception 'Cannot edit %.', unknown using errcode = '22023';
  end if;
  if fields ? 'name' then
    new_name := btrim(fields ->> 'name');
    if new_name is null or char_length(new_name) not between 1 and 120 then
      raise exception 'Name must be 1 to 120 characters.' using errcode = '22023';
    end if;
  end if;
  if fields ? 'price' then
    new_price := internal.json_number (fields, 'price');
    if new_price < 0 or new_price >= 100000 then
      raise exception 'price must be between 0 and 99999.99.' using errcode = '22023';
    end if;
  end if;
  if fields ? 'tea_product_id' then
    begin
      new_tea := nullif(btrim(fields ->> 'tea_product_id'), '')::uuid;
    exception when invalid_text_representation then
      raise exception 'tea_product_id must be an id.' using errcode = '22023';
    end;
  end if;
  begin
    update public.drinks
    set
      name = case when fields ? 'name' then new_name else name end,
      base = case when fields ? 'base' then fields ->> 'base' else base end,
      style = case when fields ? 'style' then fields ->> 'style' else style end,
      serving = case when fields ? 'serving' then fields ->> 'serving' else serving end,
      price = case when fields ? 'price' then new_price else price end,
      photo_url = case
        when fields ? 'photo_url' then nullif(btrim(fields ->> 'photo_url'), '')
        else photo_url
      end,
      photo_credit = case
        when fields ? 'photo_credit' then nullif(btrim(fields ->> 'photo_credit'), '')
        else photo_credit
      end,
      tea_product_id = case when fields ? 'tea_product_id' then new_tea else tea_product_id end
    where id = drink;
  exception
    when unique_violation then
      raise exception 'Another live drink at this café already has this name.'
        using errcode = '23505';
    when check_violation then
      raise exception 'That value is not allowed for this drink.' using errcode = '22023';
    when foreign_key_violation then
      raise exception 'That tea does not exist.' using errcode = '22023';
  end;
  if not found then
    raise exception 'No such drink.' using errcode = 'P0002';
  end if;
end;
$$;
