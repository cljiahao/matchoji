-- M3 of docs/superpowers/specs/2026-10-24-vivino-parity-roadmap-design.md, second part: likes
-- and comments on reviews, reporting content to admins (Vivino's report, statement of reasons
-- and outcome), and in-app notifications.

-- === daily limits, generalised ===
-- Arguments: the daily cap and the column naming the author. Counts the triggering table.
create or replace function public.limit_daily_inserts () returns trigger language plpgsql
security definer set search_path = '' as $$
declare
  cap integer := tg_argv[0]::integer;
  author_column text := tg_argv[1];
  author uuid := (to_jsonb(new) ->> author_column)::uuid;
  recent integer;
begin
  if author is null then
    return new;
  end if;
  execute format(
    'select count(*) from public.%I where %I = $1 and created_at > now() - interval ''1 day''',
    tg_table_name,
    author_column
  ) into recent using author;
  if recent >= cap then
    raise exception 'That is a lot for one day. Try again tomorrow.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- The author of a review, for block checks on reactions.
create function public.review_author (review uuid) returns uuid language sql stable
security definer set search_path = '' as $$
  select user_id from public.reviews where id = review
$$;

-- === likes ===
create table public.review_likes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

alter table public.review_likes enable row level security;

create policy "likes are viewable by everyone"
  on public.review_likes for select
  using (true);

create policy "users can like for themselves, not across a block"
  on public.review_likes for insert
  to authenticated
  with check (
    auth.uid () = user_id
    and not public.is_blocked_between (auth.uid (), public.review_author (review_id))
  );

create policy "users can unlike for themselves"
  on public.review_likes for delete
  to authenticated
  using (auth.uid () = user_id);

create trigger audit_review_likes
after insert or update or delete on public.review_likes
for each row execute function public.audit_row_change ();

-- === comments ===
create table public.review_comments (
  id uuid primary key default gen_random_uuid (),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null default auth.uid () references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index review_comments_review_idx on public.review_comments (review_id, created_at);
create index review_comments_user_created_idx on public.review_comments (user_id, created_at desc);

alter table public.review_comments enable row level security;

create policy "comments are viewable by everyone"
  on public.review_comments for select
  using (true);

create policy "users can comment for themselves, not across a block"
  on public.review_comments for insert
  to authenticated
  with check (
    auth.uid () = user_id
    and not public.is_blocked_between (auth.uid (), public.review_author (review_id))
  );

-- The commenter can delete their comment, and so can the author of the review it is on.
create policy "comments are deletable by their author or the review's author"
  on public.review_comments for delete
  to authenticated
  using (auth.uid () = user_id or auth.uid () = public.review_author (review_id));

create trigger review_comments_daily_limit
before insert on public.review_comments
for each row execute function public.limit_daily_inserts ('100', 'user_id');

create trigger audit_review_comments
after insert or update or delete on public.review_comments
for each row execute function public.audit_row_change ();

-- === notifications ===
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (
    kind in ('follow', 'like', 'comment', 'tea_reviewed', 'shop_reviewed', 'report_resolved')
  ),
  actor_id uuid references public.profiles (id) on delete set null,
  review_id uuid references public.reviews (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  body text check (char_length(body) <= 600),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Written only by the triggers below; recipients read theirs and mark them read.
create policy "notifications are viewable by their recipient"
  on public.notifications for select
  to authenticated
  using (auth.uid () = user_id);

create policy "notifications are updatable by their recipient"
  on public.notifications for update
  to authenticated
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create trigger audit_notifications
after insert or update or delete on public.notifications
for each row execute function public.audit_row_change ();

create function public.notify (
  recipient uuid,
  kind text,
  actor uuid default null,
  review uuid default null,
  product uuid default null,
  body text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Nobody is told about their own actions.
  if recipient is null or recipient = actor then
    return;
  end if;
  insert into public.notifications (user_id, kind, actor_id, review_id, product_id, body)
  values (recipient, kind, actor, review, product, body);
end;
$$;

revoke execute on function public.notify (uuid, text, uuid, uuid, uuid, text) from public, anon, authenticated;

create function public.notify_on_follow () returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  perform public.notify (new.followee_id, 'follow', new.follower_id);
  return new;
end;
$$;

create trigger follows_notify
after insert on public.follows
for each row execute function public.notify_on_follow ();

create function public.notify_on_like () returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  perform public.notify (
    public.review_author (new.review_id), 'like', new.user_id, new.review_id,
    (select product_id from public.reviews where id = new.review_id)
  );
  return new;
end;
$$;

create trigger review_likes_notify
after insert on public.review_likes
for each row execute function public.notify_on_like ();

create function public.notify_on_comment () returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  perform public.notify (
    public.review_author (new.review_id), 'comment', new.user_id, new.review_id,
    (select product_id from public.reviews where id = new.review_id), left(new.body, 200)
  );
  return new;
end;
$$;

create trigger review_comments_notify
after insert on public.review_comments
for each row execute function public.notify_on_comment ();

create function public.notify_on_tea_review () returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform public.notify (
      new.added_by, 'tea_reviewed', null, null, new.id,
      case new.status
        when 'approved' then new.name || ' is now in the catalogue.'
        else new.name || ' was not added' || coalesce(': ' || new.review_note, '.')
      end
    );
  end if;
  return new;
end;
$$;

create trigger products_notify_review
after update of status on public.products
for each row execute function public.notify_on_tea_review ();

create function public.notify_on_shop_review () returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform public.notify (
      new.user_id, 'shop_reviewed', null, null, null,
      case new.status
        when 'approved' then new.name || ' is approved: you can list teas now.'
        else new.name || ' was not approved' || coalesce(': ' || new.review_note, '.')
      end
    );
  end if;
  return new;
end;
$$;

create trigger vendors_notify_review
after update of status on public.vendors
for each row execute function public.notify_on_shop_review ();

-- === reports ===
create table public.content_reports (
  id uuid primary key default gen_random_uuid (),
  reporter_id uuid not null default auth.uid () references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('review', 'comment')),
  target_id uuid not null,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'removed', 'dismissed')),
  resolution_note text check (char_length(resolution_note) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_id, target_type, target_id)
);

alter table public.content_reports enable row level security;

create policy "reports are viewable by their reporter and admins"
  on public.content_reports for select
  to authenticated
  using (auth.uid () = reporter_id or public.is_admin ());

create policy "users can report for themselves, as open"
  on public.content_reports for insert
  to authenticated
  with check (auth.uid () = reporter_id and status = 'open' and resolved_at is null);

create trigger content_reports_daily_limit
before insert on public.content_reports
for each row execute function public.limit_daily_inserts ('30', 'reporter_id');

create trigger audit_content_reports
after insert or update or delete on public.content_reports
for each row execute function public.audit_row_change ();

-- Removing deletes the reported review or comment; either way the reporter is told the outcome
-- and the reason (Vivino's statement of reasons). Other open reports on the same content close
-- with it.
create function public.resolve_report (report uuid, decision text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.content_reports;
begin
  perform public.require_admin ();
  if decision not in ('removed', 'dismissed') then
    raise exception 'Decision must be removed or dismissed.' using errcode = '22023';
  end if;
  select * into r from public.content_reports where id = report and status = 'open';
  if r.id is null then
    raise exception 'No such open report.' using errcode = 'P0002';
  end if;

  if decision = 'removed' then
    if r.target_type = 'review' then
      delete from public.reviews where id = r.target_id;
    else
      delete from public.review_comments where id = r.target_id;
    end if;
  end if;

  update public.content_reports
  set status = decision, resolution_note = nullif(btrim(note), ''), resolved_at = now()
  where target_type = r.target_type and target_id = r.target_id and status = 'open';

  perform public.notify (
    reporter, 'report_resolved', null, null, null,
    case decision
      when 'removed' then 'We removed the ' || r.target_type || ' you reported'
      else 'We kept the ' || r.target_type || ' you reported'
    end || coalesce(': ' || rtrim(nullif(btrim(note), ''), '.'), '') || '.'
  )
  from (select reporter_id as reporter from public.content_reports
        where target_type = r.target_type and target_id = r.target_id) reporters;
end;
$$;

revoke execute on function public.resolve_report (uuid, text, text) from public, anon;
grant execute on function public.resolve_report (uuid, text, text) to authenticated;
