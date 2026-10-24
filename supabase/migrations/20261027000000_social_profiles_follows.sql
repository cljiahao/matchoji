-- M3 of docs/superpowers/specs/2026-10-24-vivino-parity-roadmap-design.md, first part: public
-- taster profiles, following, blocking, and a feed of the people you follow, as on Vivino.

-- === privacy ===
-- Profiles are public by default, as Vivino's are; a private one shows only its name. Reviews
-- stay on tea pages either way, since rating a tea is a public act.
alter table public.profiles add column is_public boolean not null default true;
grant update (is_public) on public.profiles to authenticated;

-- Definer-rights, read-only (writes were revoked in M0): exposes no email or role.
create or replace view public.public_profiles as
select id, display_name, is_public, created_at
from public.profiles;

-- === blocks ===
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "blocks are viewable by the blocker"
  on public.blocks for select
  to authenticated
  using (auth.uid () = blocker_id);

create policy "users can block for themselves"
  on public.blocks for insert
  to authenticated
  with check (auth.uid () = blocker_id);

create policy "users can unblock for themselves"
  on public.blocks for delete
  to authenticated
  using (auth.uid () = blocker_id);

create trigger audit_blocks
after insert or update or delete on public.blocks
for each row execute function public.audit_row_change ();

-- Either person blocking the other; definer-rights because blocks are private to the blocker.
create function public.is_blocked_between (a uuid, b uuid) returns boolean language sql stable
security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;

-- === follows ===
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

-- Who follows whom is public, as on Vivino, so follower counts can be shown.
create policy "follows are viewable by everyone"
  on public.follows for select
  using (true);

create policy "users can follow for themselves, unless either has blocked the other"
  on public.follows for insert
  to authenticated
  with check (
    auth.uid () = follower_id and not public.is_blocked_between (follower_id, followee_id)
  );

create policy "users can unfollow for themselves"
  on public.follows for delete
  to authenticated
  using (auth.uid () = follower_id);

create trigger audit_follows
after insert or update or delete on public.follows
for each row execute function public.audit_row_change ();

-- Blocking someone also ends any follow between the two of you.
create function public.drop_follows_on_block () returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and followee_id = new.blocked_id)
     or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  return new;
end;
$$;

create trigger blocks_drop_follows
after insert on public.blocks
for each row execute function public.drop_follows_on_block ();

-- === the feed ===
-- The latest tastings by people you follow (blocked people excluded either way), newest first.
-- Invoker rights: reviews are public, so RLS adds nothing to hide here.
create function public.following_feed (max_rows integer default 30)
returns setof public.reviews
language sql stable
set search_path = '' as $$
  select r.*
  from public.reviews r
  join public.follows f on f.followee_id = r.user_id and f.follower_id = auth.uid ()
  where not public.is_blocked_between (auth.uid (), r.user_id)
  order by r.created_at desc
  limit least(greatest(max_rows, 1), 100)
$$;

revoke execute on function public.following_feed (integer) from public, anon;
grant execute on function public.following_feed (integer) to authenticated;
