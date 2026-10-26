-- Fixes from the 2026-10-26 security sweep. Each section names the finding it closes.

-- === 1: the server stamps created_at ===
-- Clients could send created_at, which slipped every daily limit (backdated rows never count
-- as "today"), pinned a stock report or a feed entry on top (future-dated), and faked
-- timelines. API inserts now always get the server's time; scripts run by the owner (seeds,
-- tests) keep whatever they set.
create function public.stamp_created_at () returns trigger language plpgsql
set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.created_at := now();
  end if;
  return new;
end;
$$;

create trigger reviews_stamp_created_at before insert on public.reviews
for each row execute function public.stamp_created_at ();
create trigger products_stamp_created_at before insert on public.products
for each row execute function public.stamp_created_at ();
create trigger wishlist_stamp_created_at before insert on public.wishlist
for each row execute function public.stamp_created_at ();
create trigger stock_reports_stamp_created_at before insert on public.stock_reports
for each row execute function public.stamp_created_at ();
create trigger vendors_stamp_created_at before insert on public.vendors
for each row execute function public.stamp_created_at ();
create trigger listings_stamp_created_at before insert on public.listings
for each row execute function public.stamp_created_at ();
create trigger blocks_stamp_created_at before insert on public.blocks
for each row execute function public.stamp_created_at ();
create trigger follows_stamp_created_at before insert on public.follows
for each row execute function public.stamp_created_at ();
create trigger review_likes_stamp_created_at before insert on public.review_likes
for each row execute function public.stamp_created_at ();
create trigger review_comments_stamp_created_at before insert on public.review_comments
for each row execute function public.stamp_created_at ();
create trigger content_reports_stamp_created_at before insert on public.content_reports
for each row execute function public.stamp_created_at ();

-- Rows already dated in the future are brought back to now.
update public.reviews set created_at = now() where created_at > now();
update public.products set created_at = now() where created_at > now();
update public.wishlist set created_at = now() where created_at > now();
update public.stock_reports set created_at = now() where created_at > now();
update public.vendors set created_at = now() where created_at > now();
update public.listings set created_at = now() where created_at > now();
update public.review_comments set created_at = now() where created_at > now();
update public.content_reports set created_at = now() where created_at > now();

-- Likes and follows each send a notification, so they get daily limits too.
create trigger review_likes_daily_limit
before insert on public.review_likes
for each row execute function public.limit_daily_inserts ('300', 'user_id');

create trigger follows_daily_limit
before insert on public.follows
for each row execute function public.limit_daily_inserts ('100', 'follower_id');

-- === 2: a review photo must be on this project's storage ===
-- The old check only looked for the folder path anywhere in the URL, so
-- https://tracker.example/p.gif?/storage/v1/object/public/review-photos/<uid>/ passed and
-- every visitor to the tea page loaded the tracker. The whole URL is matched now.
alter table public.reviews drop constraint reviews_photo_is_own_upload;

update public.reviews
set photo_url = null
where photo_url is not null
  and photo_url !~ (
    '^https://skajpelucxgovxajlzvo\.supabase\.co/storage/v1/object/public/review-photos/'
    || user_id::text || '/[A-Za-z0-9._-]+$'
  );

alter table public.reviews
add constraint reviews_photo_is_own_upload check (
  photo_url is null
  or photo_url ~ (
    '^https://skajpelucxgovxajlzvo\.supabase\.co/storage/v1/object/public/review-photos/'
    || user_id::text || '/[A-Za-z0-9._-]+$'
  )
);

-- === 3: a private profile keeps its tastings off the API ===
-- Reviews were readable by everyone, so GET /reviews?user_id=eq.<id> listed a private
-- taster's whole journal. Now a private author's reviews are readable only by them (and
-- admins); tea pages get every tasting through product_reviews(), with the author withheld.
create function public.is_public_profile (person uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select coalesce((select is_public from public.profiles where id = person), false)
$$;

drop policy "reviews are viewable by everyone" on public.reviews;

create policy "reviews by public tasters are viewable by everyone"
  on public.reviews for select
  to anon
  using (user_id is null or public.is_public_profile (user_id));

create policy "reviews are viewable unless the author is private"
  on public.reviews for select
  to authenticated
  using (
    user_id is null
    or user_id = auth.uid ()
    or public.is_public_profile (user_id)
    or public.is_admin ()
  );

-- Scores, taste profiles and editions still count every taster: these views only aggregate,
-- so they read as their owner, from internal.latest_reviews (every row; not exposed by the
-- API). public.latest_reviews stays caller-rights, since it returns rows; a caller-rights view
-- nested in an owner-rights one would still apply the caller's row rules.
create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;

create view internal.latest_reviews as
select distinct on (coalesce(user_id, id), product_id) *
from public.reviews
order by coalesce(user_id, id), product_id, tasted_on desc, created_at desc;

create or replace view public.product_ratings
with (security_invoker = false) as
select
  product_id,
  count(*) as review_count,
  avg(stars)::numeric(3, 2) as avg_stars
from internal.latest_reviews
group by product_id;

create or replace view public.tea_taste_profiles
with (security_invoker = false) as
select
  l.product_id,
  avg(l.sweetness)::numeric(3, 2) as sweetness,
  avg(l.umami)::numeric(3, 2) as umami,
  avg(l.bitterness)::numeric(3, 2) as bitterness,
  avg(l.body)::numeric(3, 2) as body,
  coalesce(
    (
      select jsonb_object_agg(n.note, n.mentions)
      from (
        select unnest(l2.flavor_notes) as note, count(*) as mentions
        from internal.latest_reviews l2
        where l2.product_id = l.product_id
        group by 1
      ) n
    ),
    '{}'::jsonb
  ) as notes
from internal.latest_reviews l
group by l.product_id;

create or replace view public.edition_ratings
with (security_invoker = false) as
with editions as (
  select
    product_id,
    harvest_year,
    coalesce(flush, 'unspecified') as flush,
    count(*)::integer as review_count,
    avg(stars)::numeric(3, 2) as avg_stars
  from internal.latest_reviews
  where harvest_year is not null
  group by product_id, harvest_year, coalesce(flush, 'unspecified')
)
select
  e.*,
  e.review_count >= 3
  and e.avg_stars = (
    select max(o.avg_stars) from editions o
    where o.product_id = e.product_id and o.review_count >= 3
  ) as top_harvest
from editions e;

-- A tea's latest tastings for its page. A private author's tasting keeps its rating and notes
-- but loses the author and the photo (the photo's path holds the author's id). The author and
-- admins still see it as theirs.
create function public.product_reviews (product uuid)
returns table (
  id uuid,
  product_id uuid,
  user_id uuid,
  author_private boolean,
  stars smallint,
  notes text,
  photo_url text,
  created_at timestamptz,
  flavor_notes text[],
  sweetness smallint,
  umami smallint,
  bitterness smallint,
  body smallint,
  prep_method text,
  dose_g numeric,
  water_ml integer,
  water_temp_c integer,
  tasted_on date,
  harvest_year smallint,
  flush text
)
language sql stable security definer set search_path = '' as $$
  with visible as (
    select
      r.*,
      coalesce(
        r.user_id is null
          or r.user_id = auth.uid ()
          or public.is_public_profile (r.user_id)
          or (select p.is_admin from public.profiles p where p.id = auth.uid ()),
        false
      ) as shown
    from internal.latest_reviews r
    where r.product_id = product
  )
  select
    v.id,
    v.product_id,
    case when v.shown then v.user_id end,
    not v.shown,
    v.stars,
    v.notes,
    case when v.shown then v.photo_url end,
    v.created_at,
    v.flavor_notes,
    v.sweetness,
    v.umami,
    v.bitterness,
    v.body,
    v.prep_method,
    v.dose_g,
    v.water_ml,
    v.water_temp_c,
    v.tasted_on,
    v.harvest_year,
    v.flush
  from visible v
  order by v.created_at desc
$$;

grant execute on function public.product_reviews (uuid) to anon, authenticated;

-- Who follows whom is visible when both people are public, or to either of them.
drop policy "follows are viewable by everyone" on public.follows;
create policy "follows between public tasters are viewable by everyone"
  on public.follows for select
  using (
    auth.uid () in (follower_id, followee_id)
    or (public.is_public_profile (follower_id) and public.is_public_profile (followee_id))
  );

-- === 4: blocks stay private to the people involved ===
-- is_blocked_between was callable by anyone for any pair, which mapped every block. It now
-- answers only for pairs that include the caller, and only signed-in users may call it.
create or replace function public.is_blocked_between (a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid () in (a, b) and exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;

revoke execute on function public.is_blocked_between (uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between (uuid, uuid) to authenticated;

-- review_author() named the author of any review, private or not; reaction policies now ask
-- yes/no questions instead, and only the notification triggers (owner rights) use it.
create function public.can_react_to (review uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (select 1 from public.reviews where id = review)
    and not public.is_blocked_between (
      auth.uid (), (select user_id from public.reviews where id = review)
    )
$$;

create function public.is_review_author (review uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (select 1 from public.reviews where id = review and user_id = auth.uid ())
$$;

revoke execute on function public.can_react_to (uuid) from public, anon;
revoke execute on function public.is_review_author (uuid) from public, anon;
grant execute on function public.can_react_to (uuid) to authenticated;
grant execute on function public.is_review_author (uuid) to authenticated;

drop policy "users can like for themselves, not across a block" on public.review_likes;
create policy "users can like for themselves, not across a block"
  on public.review_likes for insert
  to authenticated
  with check (auth.uid () = user_id and public.can_react_to (review_id));

drop policy "users can comment for themselves, not across a block" on public.review_comments;
create policy "users can comment for themselves, not across a block"
  on public.review_comments for insert
  to authenticated
  with check (auth.uid () = user_id and public.can_react_to (review_id));

drop policy "comments are deletable by their author or the review's author" on public.review_comments;
create policy "comments are deletable by their author or the review's author"
  on public.review_comments for delete
  to authenticated
  using (auth.uid () = user_id or public.is_review_author (review_id));

revoke execute on function public.review_author (uuid) from public, anon, authenticated;

-- Helpers only signed-in policies use; visitors never needed them.
revoke execute on function public.can_engage_product (uuid) from public, anon;
revoke execute on function public.is_approved_product (uuid) from public, anon;
revoke execute on function public.owns_vendor (uuid) from public, anon;
grant execute on function public.can_engage_product (uuid) to authenticated;
grant execute on function public.is_approved_product (uuid) to authenticated;
grant execute on function public.owns_vendor (uuid) to authenticated;

-- === 5: deleting an account leaves no id behind ===
-- The audit trail also named the person in follows, blocks, reports and notifications, and
-- their anonymous reviews kept a photo whose path holds their id.
create or replace function public.delete_my_account () returns void language plpgsql
security definer set search_path = '' as $$
declare
  me uuid := auth.uid ();
  me_text text := me::text;
  person_keys text[] := array[
    'user_id', 'added_by', 'follower_id', 'followee_id', 'blocker_id', 'blocked_id',
    'reporter_id', 'actor_id'
  ];
begin
  if me is null then
    raise exception 'Sign in to delete your account.' using errcode = '42501';
  end if;

  update public.reviews set photo_url = null where user_id = me and photo_url is not null;
  delete from auth.users where id = me;

  update public.audit_log set actor_id = null where actor_id = me;
  -- A review photo's path holds the person's id.
  update public.audit_log set old_row = old_row - 'photo_url'
  where old_row ->> 'photo_url' like '%/' || me_text || '/%';
  update public.audit_log set new_row = new_row - 'photo_url'
  where new_row ->> 'photo_url' like '%/' || me_text || '/%';
  -- A profile row's own id is the person, so it goes too, with their name.
  update public.audit_log
  set old_row = old_row - person_keys - 'display_name'
    - case when table_name = 'profiles' then 'id' else '' end
  where exists (
      select 1 from jsonb_each_text(old_row) e where e.key = any (person_keys) and e.value = me_text
    )
    or (table_name = 'profiles' and old_row ->> 'id' = me_text);
  update public.audit_log
  set new_row = new_row - person_keys - 'display_name'
    - case when table_name = 'profiles' then 'id' else '' end
  where exists (
      select 1 from jsonb_each_text(new_row) e where e.key = any (person_keys) and e.value = me_text
    )
    or (table_name = 'profiles' and new_row ->> 'id' = me_text);
end;
$$;

-- === low: admin-only fields stay admin-only ===
-- A suggested tea could arrive already "merged" into another (forwarding its page) or with a
-- review_note posing as the admin's reasons; a shop application likewise.
drop policy "signed-in users can suggest teas for review" on public.products;
create policy "signed-in users can suggest teas for review"
  on public.products for insert
  to authenticated
  with check (
    status = 'pending'
    and added_by = auth.uid ()
    and reviewed_at is null
    and image_url is null
    and shop_url is null
    and merged_into is null
    and review_note is null
  );

drop policy "users can apply as a vendor for themselves" on public.vendors;
create policy "users can apply as a vendor for themselves"
  on public.vendors for insert
  to authenticated
  with check (
    auth.uid () = user_id and status = 'pending' and reviewed_at is null and review_note is null
  );

-- === low: the sign-up trigger resolves nothing through search_path ===
create or replace function public.handle_new_user () returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        'Tea drinker ' || substr(md5(new.id::text), 1, 4)
      ),
      40
    )
  );
  return new;
end;
$$;
