-- Café-drink repositioning, slice S1 (docs/superpowers/specs/2026-11-10-cafe-drinks-repositioning-design.md):
-- cities, cafés and drinks, drink reviews, trusted tasters, and the rating views and admin
-- functions around them. Additive: existing teas, reviews and notifications are unchanged.
-- Section numbers (§6.1, §7.5.n) refer to that spec.
--
-- The owner applies this by hand in the Supabase SQL editor before any code that reads the
-- new schema is merged (§7.5.11).

-- === cities ===
-- Rows rather than a hard-coded list, so a third city is an insert (§3).
create table public.cities (
  slug text primary key check (slug ~ '^[a-z]+(-[a-z]+)*$'),
  name text not null,
  country text not null check (country in ('SG', 'MY')),
  currency text not null check (currency in ('SGD', 'MYR')),
  sort_order integer not null default 0
);

alter table public.cities enable row level security;

create policy "cities are viewable by everyone"
  on public.cities for select
  using (true);

revoke all on public.cities from anon, authenticated;
grant select on public.cities to anon, authenticated;

insert into public.cities (slug, name, country, currency, sort_order)
values
  ('singapore', 'Singapore', 'SG', 'SGD', 1),
  ('johor-bahru', 'Johor Bahru', 'MY', 'MYR', 2);

create trigger audit_cities
after insert or update or delete on public.cities
for each row execute function public.audit_row_change ();

-- === helpers ===
-- Lowercase ASCII with dashes: common Latin accents fold to their base letter, anything else
-- that is not a letter or digit becomes a separator.
create function public.slugify (txt text) returns text language sql immutable
set search_path = '' as $$
  select trim(
    both '-' from regexp_replace(
      translate(
        lower(coalesce(txt, '')),
        'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ',
        'aaaaaaceeeeiiiinooooouuuuyy'
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  )
$$;

create function public.touch_updated_at () returns trigger language plpgsql
set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- === cafés ===
create table public.cafes (
  id uuid primary key default gen_random_uuid (),
  -- Set by cafes_set_slug on insert and never updated, so a link posted on Instagram keeps
  -- working through renames, merges and rejections (§7.5.8).
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  city_slug text not null references public.cities (slug),
  area text check (char_length(area) <= 80),
  address text check (char_length(address) <= 300),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  instagram_handle text check (instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  website_url text check (website_url ~ '^https://[^[:space:]]+$' and char_length(website_url) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  added_by uuid default auth.uid () references public.profiles (id) on delete set null,
  review_note text check (char_length(review_note) <= 500),
  -- Set when a duplicate is merged; its page then forwards to the café it repeats.
  merged_into uuid references public.cafes (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cafes_city_status_idx on public.cafes (city_slug, status);
create index cafes_added_by_idx on public.cafes (added_by, status);
create index cafes_merged_into_idx on public.cafes (merged_into) where merged_into is not null;

-- === drinks ===
create table public.drinks (
  id uuid primary key default gen_random_uuid (),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  -- Unique per café, set on insert, never updated (see cafes.slug).
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  base text not null check (base in ('hojicha', 'matcha')),
  style text not null check (style in ('latte', 'straight', 'iced_latte', 'float', 'other')),
  serving text not null check (serving in ('hot', 'iced', 'both')),
  price numeric(7, 2) check (price >= 0),
  -- Copied from the café's city by drinks_set_currency; prices are never compared across cities.
  currency text not null check (currency in ('SGD', 'MYR')),
  photo_url text check (photo_url ~ '^https://[^[:space:]]+$' and char_length(photo_url) <= 500),
  photo_credit text check (char_length(photo_credit) <= 200),
  -- "Tea used here". A product never points back at a drink (CONSTITUTION §2).
  tea_product_id uuid references public.products (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  added_by uuid default auth.uid () references public.profiles (id) on delete set null,
  review_note text check (char_length(review_note) <= 500),
  merged_into uuid references public.drinks (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cafe_id, slug)
);

create unique index drinks_cafe_name_key on public.drinks (cafe_id, lower(btrim(name)));
create index drinks_status_idx on public.drinks (status, base, style);
create index drinks_added_by_idx on public.drinks (added_by, status);
create index drinks_merged_into_idx on public.drinks (merged_into) where merged_into is not null;
create index drinks_tea_product_idx on public.drinks (tea_product_id) where tea_product_id is not null;

-- === slugs, currency, timestamps ===
-- Definer-rights so a collision is seen whatever the caller's read rules hide (a pending café
-- is invisible to everyone but its adder). A client-supplied slug is overwritten.
create function public.set_cafe_slug () returns trigger language plpgsql security definer
set search_path = '' as $$
declare
  base text := coalesce(
    nullif(public.slugify (new.name || ' ' || coalesce(new.area, '')), ''), 'cafe'
  );
  candidate text := base;
  n integer := 1;
begin
  -- Two simultaneous inserts of one name would otherwise both pick the same free slug.
  perform pg_advisory_xact_lock (hashtext ('cafe-slug:' || base));
  while exists (select 1 from public.cafes where slug = candidate) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  new.slug := candidate;
  return new;
end;
$$;

create trigger cafes_set_slug before insert on public.cafes
for each row execute function public.set_cafe_slug ();

create function public.set_drink_slug () returns trigger language plpgsql security definer
set search_path = '' as $$
declare
  base text := coalesce(nullif(public.slugify (new.name), ''), 'drink');
  candidate text := base;
  n integer := 1;
begin
  perform pg_advisory_xact_lock (hashtext ('drink-slug:' || new.cafe_id::text || ':' || base));
  while exists (
    select 1 from public.drinks where cafe_id = new.cafe_id and slug = candidate
  ) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  new.slug := candidate;
  return new;
end;
$$;

create trigger drinks_set_slug before insert on public.drinks
for each row execute function public.set_drink_slug ();

create function public.set_drink_currency () returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  new.currency := (
    select ci.currency
    from public.cafes c
    join public.cities ci on ci.slug = c.city_slug
    where c.id = new.cafe_id
  );
  return new;
end;
$$;

create trigger drinks_set_currency before insert on public.drinks
for each row execute function public.set_drink_currency ();

create trigger cafes_touch before update on public.cafes
for each row execute function public.touch_updated_at ();
create trigger drinks_touch before update on public.drinks
for each row execute function public.touch_updated_at ();

create trigger cafes_stamp_created_at before insert on public.cafes
for each row execute function public.stamp_created_at ();
create trigger drinks_stamp_created_at before insert on public.drinks
for each row execute function public.stamp_created_at ();

-- === pending caps (§7.5.6) ===
-- Arguments: the cap and the plural noun for the message. Definer-rights: a person's pending
-- rows are theirs to see, but counting through a definer keeps the cap independent of RLS.
create function public.limit_pending_rows () returns trigger language plpgsql security definer
set search_path = '' as $$
declare
  cap integer := tg_argv[0]::integer;
  pending integer;
begin
  if new.added_by is null or new.status <> 'pending' then
    return new;
  end if;
  -- Serialise one person's inserts so parallel requests cannot all pass the count.
  perform pg_advisory_xact_lock (hashtext (tg_table_name || ':' || new.added_by::text));
  execute format(
    'select count(*) from public.%I where added_by = $1 and status = ''pending''',
    tg_table_name
  ) into pending using new.added_by;
  if pending >= cap then
    raise exception 'You have too many % waiting for review.', tg_argv[1] using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger limit_pending_cafes before insert on public.cafes
for each row execute function public.limit_pending_rows ('10', 'cafés');
create trigger limit_pending_drinks before insert on public.drinks
for each row execute function public.limit_pending_rows ('20', 'drinks');

-- === audit ===
create trigger audit_cafes
after insert or update or delete on public.cafes
for each row execute function public.audit_row_change ();
create trigger audit_drinks
after insert or update or delete on public.drinks
for each row execute function public.audit_row_change ();

-- === engage helpers ===
-- Approved, or pending and added by the caller (who may rate what they added while it waits),
-- mirroring can_engage_product. Definer-rights so the check sees rows the caller's read rules
-- would not.
create function public.can_engage_cafe (cafe uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (
    select 1 from public.cafes
    where id = cafe
      and (status = 'approved' or (status = 'pending' and added_by = auth.uid ()))
  )
$$;

create function public.can_engage_drink (drink uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (
    select 1 from public.drinks
    where id = drink
      and (status = 'approved' or (status = 'pending' and added_by = auth.uid ()))
  )
$$;

-- Who may see a drink and its reviews: everyone for an approved drink at an approved café,
-- the adder for their own pending one, admins for all. A rejected café hides its drinks.
create function public.can_view_drink (drink uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select public.is_admin ()
    or public.can_engage_drink (drink)
      and exists (
        select 1 from public.drinks d
        join public.cafes c on c.id = d.cafe_id
        where d.id = drink and (d.status = 'pending' or c.status = 'approved')
      )
    or exists (
      select 1 from public.drinks d
      join public.cafes c on c.id = d.cafe_id
      where d.id = drink and d.status = 'approved' and c.status = 'approved'
    )
$$;

revoke execute on function public.can_view_drink (uuid) from public;
grant execute on function public.can_view_drink (uuid) to anon, authenticated;

revoke execute on function public.can_engage_cafe (uuid) from public, anon;
revoke execute on function public.can_engage_drink (uuid) from public, anon;
grant execute on function public.can_engage_cafe (uuid) to authenticated;
grant execute on function public.can_engage_drink (uuid) to authenticated;

-- === RLS: cafés and drinks ===
-- Writes after the first insert go through the admin functions below, so there are no update
-- or delete policies and no update or delete grants.
alter table public.cafes enable row level security;
alter table public.drinks enable row level security;

revoke all on public.cafes from anon, authenticated;
revoke all on public.drinks from anon, authenticated;
-- Visitors do not get who added a row, the reviewer's note or when it was reviewed; signed-in
-- users do (their own rows and the admin queue need them), so a visitor's query must name its
-- columns rather than select *.
grant select (
  id, slug, name, city_slug, area, address, lat, lng, instagram_handle, website_url, status,
  merged_into, created_at, updated_at
) on public.cafes to anon;
grant select (
  id, cafe_id, slug, name, base, style, serving, price, currency, photo_url, photo_credit,
  tea_product_id, status, merged_into, created_at, updated_at
) on public.drinks to anon;
grant select on public.cafes, public.drinks to authenticated;
grant insert on public.cafes, public.drinks to authenticated;

create policy "approved cafés are viewable by everyone"
  on public.cafes for select
  using (status = 'approved');

-- A merged duplicate stays readable so a posted link to it can forward to the survivor.
create policy "merged cafés are viewable so their links can forward"
  on public.cafes for select
  using (merged_into is not null);

create policy "people see the cafés they added"
  on public.cafes for select
  to authenticated
  using (added_by = auth.uid ());

create policy "admins can view every café"
  on public.cafes for select
  to authenticated
  using (public.is_admin ());

create policy "signed-in users can suggest cafés for review"
  on public.cafes for insert
  to authenticated
  with check (
    status = 'pending'
    and added_by = auth.uid ()
    and reviewed_at is null
    and merged_into is null
    and review_note is null
  );

create policy "approved drinks at approved cafés are viewable by everyone"
  on public.drinks for select
  using (
    status = 'approved'
    and exists (select 1 from public.cafes c where c.id = cafe_id and c.status = 'approved')
  );

create policy "merged drinks are viewable so their links can forward"
  on public.drinks for select
  using (merged_into is not null);

create policy "people see the drinks they added"
  on public.drinks for select
  to authenticated
  using (added_by = auth.uid ());

create policy "admins can view every drink"
  on public.drinks for select
  to authenticated
  using (public.is_admin ());

-- A suggested drink cannot carry a photo: the page would load whatever URL it named, the
-- tracking-pixel route the 2026-10-26 sweep closed for review photos. An admin sets it.
create policy "signed-in users can suggest drinks for review"
  on public.drinks for insert
  to authenticated
  with check (
    status = 'pending'
    and added_by = auth.uid ()
    and reviewed_at is null
    and merged_into is null
    and review_note is null
    and photo_url is null
    and photo_credit is null
    and (tea_product_id is null or public.is_approved_product (tea_product_id))
    and public.can_engage_cafe (cafe_id)
  );

-- === profiles: trusted tasters ===
alter table public.profiles
add column is_trusted_taster boolean not null default false,
add column instagram_handle text check (instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
add column bio text check (char_length(bio) <= 280);

-- is_trusted_taster is deliberately outside every grant: only set_trusted_taster writes it.
grant update (instagram_handle, bio) on public.profiles to authenticated;

-- The handle and bio are personal data; the log does not copy them.
drop trigger audit_profiles on public.profiles;
create trigger audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.audit_row_change ('email', 'instagram_handle', 'bio');

-- A taster score must always have visible reviews behind it (§7.5.2).
create function public.keep_taster_public () returns trigger language plpgsql
set search_path = '' as $$
begin
  if new.is_trusted_taster and not new.is_public then
    raise exception 'A trusted taster profile stays public.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profiles_taster_stays_public before update on public.profiles
for each row execute function public.keep_taster_public ();

-- Appended columns: the taster badge and, for public profiles only, the handle and bio.
create or replace view public.public_profiles as
select
  id,
  display_name,
  is_public,
  created_at,
  is_trusted_taster,
  case when is_public then instagram_handle end as instagram_handle,
  case when is_public then bio end as bio
from public.profiles;

create function public.set_trusted_taster (person uuid, value boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  update public.profiles
  set is_trusted_taster = value, is_public = case when value then true else is_public end
  where id = person;
  if not found then
    raise exception 'No such person.' using errcode = 'P0002';
  end if;
end;
$$;

-- === reviews: drink reviews, tasters, disclosure ===
alter table public.reviews alter column product_id drop not null;

alter table public.reviews
add column drink_id uuid references public.drinks (id) on delete cascade,
add column instagram_url text check (
  instagram_url ~ '^https://www\.instagram\.com/(p|reel)/[A-Za-z0-9_-]+/?$'
  and char_length(instagram_url) <= 300
),
add column disclosure text not null default 'none'
  check (disclosure in ('none', 'invited', 'gifted', 'paid')),
add column tea_strength smallint check (tea_strength between 1 and 5),
add column roast smallint check (roast between 1 and 5),
-- Stamped at insert from the author's profile, so revoking the badge does not rewrite
-- history and a review written before a grant stays a community review (§7.5.3).
add column by_trusted_taster boolean not null default false,
add constraint reviews_one_target check (num_nonnulls(product_id, drink_id) = 1);

create index reviews_drink_id_idx on public.reviews (drink_id);

grant update (tea_strength, roast, instagram_url, disclosure) on public.reviews to authenticated;

drop policy "reviews are insertable by their owner" on public.reviews;
create policy "reviews are insertable by their owner"
  on public.reviews for insert
  to authenticated
  with check (
    auth.uid () = user_id
    and (
      (product_id is not null and public.can_engage_product (product_id))
      or (drink_id is not null and public.can_engage_drink (drink_id))
    )
  );

-- A review of a drink is readable only where the drink is: a pending or rejected drink, or one
-- at a rejected café, keeps its reviews to the adder and admins. Authors always read their own.
drop policy "reviews by public tasters are viewable by everyone" on public.reviews;
drop policy "reviews are viewable unless the author is private" on public.reviews;

create policy "reviews by public tasters are viewable by everyone"
  on public.reviews for select
  to anon
  using (
    (user_id is null or public.is_public_profile (user_id))
    and (drink_id is null or public.can_view_drink (drink_id))
  );

create policy "reviews are viewable unless the author is private"
  on public.reviews for select
  to authenticated
  using (
    user_id = auth.uid ()
    or public.is_admin ()
    or (
      (user_id is null or public.is_public_profile (user_id))
      and (drink_id is null or public.can_view_drink (drink_id))
    )
  );

create function public.stamp_taster () returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  new.by_trusted_taster := coalesce(
    (select is_trusted_taster from public.profiles where id = new.user_id), false
  );
  return new;
end;
$$;

create trigger reviews_stamp_taster before insert on public.reviews
for each row execute function public.stamp_taster ();

-- Only a taster's review may carry an Instagram link or a disclosure, and a taster's drink
-- review must link its post.
create function public.enforce_taster_rules () returns trigger language plpgsql
set search_path = '' as $$
begin
  if not new.by_trusted_taster and (new.instagram_url is not null or new.disclosure <> 'none') then
    raise exception 'Only trusted tasters can add an Instagram link or a disclosure.'
      using errcode = '42501';
  end if;
  if new.by_trusted_taster and new.drink_id is not null and new.instagram_url is null then
    raise exception 'A taster''s drink review needs the Instagram post link.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger reviews_taster_rules before insert or update on public.reviews
for each row execute function public.enforce_taster_rules ();

-- Each person's latest review of a thing counts once, whether the thing is a tea or a drink
-- (§7.5.1). Anonymised reviews (no author) each count as their own person.
create or replace view internal.latest_reviews as
select distinct on (coalesce(user_id, id), coalesce(product_id, drink_id)) *
from public.reviews
order by coalesce(user_id, id), coalesce(product_id, drink_id), tasted_on desc, created_at desc;

create or replace view public.latest_reviews
with (security_invoker = true) as
select distinct on (coalesce(user_id, id), coalesce(product_id, drink_id)) *
from public.reviews
order by coalesce(user_id, id), coalesce(product_id, drink_id), tasted_on desc, created_at desc;

-- The tea views read the shared latest-reviews view, so they now skip drink reviews.
create or replace view public.product_ratings
with (security_invoker = false) as
select
  product_id,
  count(*) as review_count,
  avg(stars)::numeric(3, 2) as avg_stars
from internal.latest_reviews
where product_id is not null
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
where l.product_id is not null
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
  where product_id is not null and harvest_year is not null
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

-- === notifications: drink and café targets ===
alter table public.notifications alter column product_id drop not null;

alter table public.notifications
add column drink_id uuid references public.drinks (id) on delete cascade,
-- A café decision has no drink to point at; the café itself is the target.
add column cafe_id uuid references public.cafes (id) on delete cascade,
add constraint notifications_one_target check (num_nonnulls(product_id, drink_id, cafe_id) <= 1);

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications
add constraint notifications_kind_check check (
  kind in (
    'follow', 'like', 'comment', 'tea_reviewed', 'shop_reviewed', 'report_resolved',
    'cafe_reviewed', 'drink_reviewed'
  )
);

-- Two new optional targets at the end; the six-argument callers keep working.
drop function public.notify (uuid, text, uuid, uuid, uuid, text);
create function public.notify (
  recipient uuid,
  kind text,
  actor uuid default null,
  review uuid default null,
  product uuid default null,
  body text default null,
  drink uuid default null,
  cafe uuid default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Nobody is told about their own actions.
  if recipient is null or recipient = actor then
    return;
  end if;
  insert into public.notifications (user_id, kind, actor_id, review_id, product_id, body, drink_id, cafe_id)
  values (recipient, kind, actor, review, product, body, drink, cafe);
end;
$$;

revoke execute on function public.notify (uuid, text, uuid, uuid, uuid, text, uuid, uuid)
from public, anon, authenticated;

create or replace function public.notify_on_like () returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  perform public.notify (
    public.review_author (new.review_id), 'like', new.user_id, new.review_id,
    (select product_id from public.reviews where id = new.review_id), null,
    (select drink_id from public.reviews where id = new.review_id)
  );
  return new;
end;
$$;

create or replace function public.notify_on_comment () returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  perform public.notify (
    public.review_author (new.review_id), 'comment', new.user_id, new.review_id,
    (select product_id from public.reviews where id = new.review_id), left(new.body, 200),
    (select drink_id from public.reviews where id = new.review_id)
  );
  return new;
end;
$$;

create function public.notify_on_cafe_review () returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform public.notify (
      new.added_by, 'cafe_reviewed', null, null, null,
      case new.status
        when 'approved' then new.name || ' is now listed.'
        else new.name || ' was not added' || coalesce(': ' || new.review_note, '.')
      end,
      null, new.id
    );
  end if;
  return new;
end;
$$;

create trigger cafes_notify_review
after update of status on public.cafes
for each row execute function public.notify_on_cafe_review ();

create function public.notify_on_drink_review () returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform public.notify (
      new.added_by, 'drink_reviewed', null, null, null,
      case new.status
        when 'approved' then new.name || ' is now listed.'
        else new.name || ' was not added' || coalesce(': ' || new.review_note, '.')
      end,
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger drinks_notify_review
after update of status on public.drinks
for each row execute function public.notify_on_drink_review ();

-- === ratings ===
-- Approved drinks at approved cafés only (§7.5.5), from each person's latest review. Taster
-- and community numbers are never blended (§6.4). Owner-rights, like product_ratings, so a
-- private profile's review still counts. count(r.id), not count(*): a drink with no reviews
-- joins one empty row and must read as zero.
create view public.drink_ratings
with (security_invoker = false) as
select
  d.id as drink_id,
  count(r.id) filter (where r.by_trusted_taster)::integer as taster_count,
  (avg(r.stars) filter (where r.by_trusted_taster))::numeric(3, 2) as taster_avg,
  count(r.id) filter (where r.by_trusted_taster and r.disclosure <> 'none')::integer
    as taster_disclosed_count,
  count(r.id) filter (where not r.by_trusted_taster)::integer as community_count,
  (avg(r.stars) filter (where not r.by_trusted_taster))::numeric(3, 2) as community_avg
from public.drinks d
join public.cafes c on c.id = d.cafe_id and c.status = 'approved'
left join internal.latest_reviews r on r.drink_id = d.id
where d.status = 'approved'
group by d.id;

create view public.cafe_ratings
with (security_invoker = false) as
select
  c.id as cafe_id,
  count(distinct d.id)::integer as drink_count,
  -- People, not reviews: someone who rated three drinks counts once.
  count(distinct coalesce(r.user_id, r.id)) filter (where r.by_trusted_taster)::integer
    as taster_count,
  (avg(r.stars) filter (where r.by_trusted_taster))::numeric(3, 2) as taster_avg,
  count(distinct coalesce(r.user_id, r.id)) filter (where not r.by_trusted_taster)::integer
    as community_count,
  (avg(r.stars) filter (where not r.by_trusted_taster))::numeric(3, 2) as community_avg
from public.cafes c
left join public.drinks d on d.cafe_id = c.id and d.status = 'approved'
left join internal.latest_reviews r on r.drink_id = d.id
where c.status = 'approved'
group by c.id;

revoke all on public.drink_ratings, public.cafe_ratings from anon, authenticated;
grant select on public.drink_ratings, public.cafe_ratings to anon, authenticated;

-- A drink's latest reviews for its page, shaped like product_reviews. A private author's
-- review keeps its rating and notes but loses the author and photo; trusted tasters are always
-- public, so theirs never lose them. Visible for drinks the caller may engage with (approved,
-- or their own pending one) and to admins.
create function public.drink_reviews (drink uuid)
returns table (
  id uuid,
  product_id uuid,
  drink_id uuid,
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
  flush text,
  instagram_url text,
  disclosure text,
  tea_strength smallint,
  roast smallint,
  by_trusted_taster boolean
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
    where r.drink_id = drink
      and public.can_view_drink (drink)
  )
  select
    v.id,
    v.product_id,
    v.drink_id,
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
    v.flush,
    v.instagram_url,
    v.disclosure,
    v.tea_strength,
    v.roast,
    v.by_trusted_taster
  from visible v
  order by v.created_at desc
$$;

revoke execute on function public.drink_reviews (uuid) from public;
grant execute on function public.drink_reviews (uuid) to anon, authenticated;

-- === admin: review and merge ===
create function public.review_cafe (cafe uuid, decision text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = '22023';
  end if;
  update public.cafes
  set status = decision, reviewed_at = now(), review_note = nullif(btrim(note), '')
  where id = cafe;
  if not found then
    raise exception 'No such café.' using errcode = 'P0002';
  end if;
end;
$$;

create function public.review_drink (drink uuid, decision text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = '22023';
  end if;
  if decision = 'approved' and not exists (
    select 1 from public.drinks d
    join public.cafes c on c.id = d.cafe_id
    where d.id = drink and c.status = 'approved'
  ) then
    raise exception 'Approve the café first.' using errcode = '22023';
  end if;
  update public.drinks
  set status = decision, reviewed_at = now(), review_note = nullif(btrim(note), '')
  where id = drink;
  if not found then
    raise exception 'No such drink.' using errcode = 'P0002';
  end if;
end;
$$;

-- The merge itself, with no admin or same-café check, so merge_cafe can fold a clashing
-- drink into the keeper's. Moves the reviews and notifications that point at the duplicate,
-- keeps its "tea used here" when the survivor has none, collapses earlier forwards so every
-- old link is one hop from the survivor, then rejects the duplicate with a forward link.
create function internal.merge_drink_into (duplicate uuid, keep uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  kept_name text;
begin
  select name into kept_name from public.drinks where id = keep;

  update public.reviews set drink_id = keep where drink_id = duplicate;
  update public.notifications set drink_id = keep where drink_id = duplicate;
  update public.drinks
  set tea_product_id = coalesce(
    tea_product_id, (select tea_product_id from public.drinks where id = duplicate)
  )
  where id = keep;
  update public.drinks set merged_into = keep where merged_into = duplicate;

  update public.drinks
  set
    status = 'rejected',
    reviewed_at = now(),
    merged_into = keep,
    review_note = 'Duplicate of ' || kept_name
  where id = duplicate;
end;
$$;

create function public.merge_drink (duplicate uuid, keep uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  if duplicate = keep then
    raise exception 'A drink cannot be merged into itself.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.drinks where id = duplicate) then
    raise exception 'No such drink.' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.drinks k
    join public.drinks d on d.id = duplicate and d.cafe_id = k.cafe_id
    where k.id = keep and k.status = 'approved'
  ) then
    raise exception 'Merge into an approved drink at the same café.' using errcode = '22023';
  end if;
  perform internal.merge_drink_into (duplicate, keep);
end;
$$;

-- Moves the duplicate's drinks to the café it repeats. Where the keeper already has a drink
-- with the same slug or name, the keeper's drink survives and the duplicate's is merged into
-- it, since a café holds one of each. Then the duplicate is rejected with a forward link.
create function public.merge_cafe (duplicate uuid, keep uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  kept_name text;
  d record;
  clash uuid;
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
  -- Drinks are priced in their city's currency, so a merge across cities would mislabel them.
  if (select city_slug from public.cafes where id = duplicate)
    is distinct from (select city_slug from public.cafes where id = keep) then
    raise exception 'Cafés in different cities cannot be merged.' using errcode = '22023';
  end if;

  for d in select id, slug, name from public.drinks where cafe_id = duplicate loop
    select k.id into clash
    from public.drinks k
    where k.cafe_id = keep
      and (k.slug = d.slug or lower(btrim(k.name)) = lower(btrim(d.name)))
    limit 1;
    if clash is not null then
      if (select status from public.drinks where id = clash) <> 'approved' then
        raise exception 'Approve or reject the café''s matching drink "%" first.', d.name
          using errcode = '22023';
      end if;
      -- It stays under the duplicate, rejected and forwarding: moving it would repeat the slug.
      perform internal.merge_drink_into (d.id, clash);
    else
      update public.drinks set cafe_id = keep where id = d.id;
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

revoke execute on function public.review_cafe (uuid, text, text) from public, anon;
revoke execute on function public.review_drink (uuid, text, text) from public, anon;
revoke execute on function public.merge_cafe (uuid, uuid) from public, anon;
revoke execute on function public.merge_drink (uuid, uuid) from public, anon;
revoke execute on function public.set_trusted_taster (uuid, boolean) from public, anon;
grant execute on function public.review_cafe (uuid, text, text) to authenticated;
grant execute on function public.review_drink (uuid, text, text) to authenticated;
grant execute on function public.merge_cafe (uuid, uuid) to authenticated;
grant execute on function public.merge_drink (uuid, uuid) to authenticated;
grant execute on function public.set_trusted_taster (uuid, boolean) to authenticated;

-- The internal merge has no admin check of its own: only the definer functions above call it.
revoke execute on function internal.merge_drink_into (uuid, uuid) from public, anon, authenticated;

-- === admin: edit details ===
-- Slug, status, credit and review fields are not editable here. fields holds only the keys to
-- change; an empty string clears an optional text field.
create function public.update_cafe (cafe uuid, fields jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  allowed text[] := array[
    'name', 'area', 'address', 'lat', 'lng', 'instagram_handle', 'website_url'
  ];
  unknown text;
begin
  perform public.require_admin ();
  select k into unknown from jsonb_object_keys (fields) k where k <> all (allowed) limit 1;
  if unknown is not null then
    raise exception 'Cannot edit %.', unknown using errcode = '22023';
  end if;
  update public.cafes
  set
    name = case when fields ? 'name' then fields ->> 'name' else name end,
    area = case when fields ? 'area' then nullif(btrim(fields ->> 'area'), '') else area end,
    address = case when fields ? 'address' then nullif(btrim(fields ->> 'address'), '') else address end,
    lat = case when fields ? 'lat' then (fields ->> 'lat')::double precision else lat end,
    lng = case when fields ? 'lng' then (fields ->> 'lng')::double precision else lng end,
    instagram_handle = case
      when fields ? 'instagram_handle' then nullif(btrim(fields ->> 'instagram_handle'), '')
      else instagram_handle
    end,
    website_url = case
      when fields ? 'website_url' then nullif(btrim(fields ->> 'website_url'), '')
      else website_url
    end
  where id = cafe;
  if not found then
    raise exception 'No such café.' using errcode = 'P0002';
  end if;
end;
$$;

create function public.update_drink (drink uuid, fields jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  allowed text[] := array[
    'name', 'base', 'style', 'serving', 'price', 'photo_url', 'photo_credit', 'tea_product_id'
  ];
  unknown text;
begin
  perform public.require_admin ();
  select k into unknown from jsonb_object_keys (fields) k where k <> all (allowed) limit 1;
  if unknown is not null then
    raise exception 'Cannot edit %.', unknown using errcode = '22023';
  end if;
  update public.drinks
  set
    name = case when fields ? 'name' then fields ->> 'name' else name end,
    base = case when fields ? 'base' then fields ->> 'base' else base end,
    style = case when fields ? 'style' then fields ->> 'style' else style end,
    serving = case when fields ? 'serving' then fields ->> 'serving' else serving end,
    price = case when fields ? 'price' then (fields ->> 'price')::numeric else price end,
    photo_url = case
      when fields ? 'photo_url' then nullif(btrim(fields ->> 'photo_url'), '')
      else photo_url
    end,
    photo_credit = case
      when fields ? 'photo_credit' then nullif(btrim(fields ->> 'photo_credit'), '')
      else photo_credit
    end,
    tea_product_id = case
      when fields ? 'tea_product_id' then nullif(fields ->> 'tea_product_id', '')::uuid
      else tea_product_id
    end
  where id = drink;
  if not found then
    raise exception 'No such drink.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.update_cafe (uuid, jsonb) from public, anon;
revoke execute on function public.update_drink (uuid, jsonb) from public, anon;
grant execute on function public.update_cafe (uuid, jsonb) to authenticated;
grant execute on function public.update_drink (uuid, jsonb) to authenticated;

-- === delete_my_account: a deleted taster stays unidentifiable ===
-- Their reviews stay as anonymous ratings, but lose the Instagram post link (which names them)
-- and the taster stamp, so the badge and link cannot point back. One statement, so the
-- taster-rules trigger never sees a taster review without its link.
create or replace function public.delete_my_account () returns void language plpgsql
security definer set search_path = '' as $$
declare
  me uuid := auth.uid ();
  me_text text := me::text;
  person_keys text[] := array[
    'user_id', 'added_by', 'follower_id', 'followee_id', 'blocker_id', 'blocked_id',
    'reporter_id', 'actor_id'
  ];
  my_reviews text[];
begin
  if me is null then
    raise exception 'Sign in to delete your account.' using errcode = '42501';
  end if;

  select coalesce(array_agg(id::text), '{}') into my_reviews
  from public.reviews where user_id = me;

  update public.reviews set photo_url = null where user_id = me and photo_url is not null;
  update public.reviews
  set by_trusted_taster = false, instagram_url = null, disclosure = 'none'
  where user_id = me and (by_trusted_taster or instagram_url is not null or disclosure <> 'none');
  delete from auth.users where id = me;

  update public.audit_log set actor_id = null where actor_id = me;
  -- A review photo's path holds the person's id.
  update public.audit_log set old_row = old_row - 'photo_url'
  where old_row ->> 'photo_url' like '%/' || me_text || '/%';
  update public.audit_log set new_row = new_row - 'photo_url'
  where new_row ->> 'photo_url' like '%/' || me_text || '/%';
  -- The post link, disclosure and taster stamp of their reviews, in every logged version.
  update public.audit_log
  set
    old_row = old_row - 'instagram_url' - 'disclosure' - 'by_trusted_taster',
    new_row = new_row - 'instagram_url' - 'disclosure' - 'by_trusted_taster'
  where table_name = 'reviews'
    and (old_row ->> 'id' = any (my_reviews) or new_row ->> 'id' = any (my_reviews));
  -- A profile row's own id is the person, so it goes too, with their name, handle and bio.
  update public.audit_log
  set old_row = old_row - person_keys - 'display_name' - 'instagram_handle' - 'bio'
    - case when table_name = 'profiles' then 'id' else '' end
  where exists (
      select 1 from jsonb_each_text(old_row) e where e.key = any (person_keys) and e.value = me_text
    )
    or (table_name = 'profiles' and old_row ->> 'id' = me_text);
  update public.audit_log
  set new_row = new_row - person_keys - 'display_name' - 'instagram_handle' - 'bio'
    - case when table_name = 'profiles' then 'id' else '' end
  where exists (
      select 1 from jsonb_each_text(new_row) e where e.key = any (person_keys) and e.value = me_text
    )
    or (table_name = 'profiles' and new_row ->> 'id' = me_text);
end;
$$;
