-- Learn tab courses: which lessons each person has finished. Courses and lessons are content in
-- the repo (features/learn), so rows hold their slugs rather than foreign keys. Private to the
-- learner, like the journal.
create table public.lesson_progress (
  user_id uuid not null default auth.uid () references public.profiles (id) on delete cascade,
  course_slug text not null check (course_slug ~ '^[a-z0-9-]{1,60}$'),
  lesson_slug text not null check (lesson_slug ~ '^[a-z0-9-]{1,60}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, course_slug, lesson_slug)
);

alter table public.lesson_progress enable row level security;

create policy "lesson progress is viewable by its learner"
  on public.lesson_progress for select
  to authenticated
  using (auth.uid () = user_id);

create policy "learners can mark lessons done for themselves"
  on public.lesson_progress for insert
  to authenticated
  with check (auth.uid () = user_id);

create policy "learners can unmark their own lessons"
  on public.lesson_progress for delete
  to authenticated
  using (auth.uid () = user_id);

-- Only the slugs come from the client: the learner and the time are the server's.
revoke insert, update on public.lesson_progress from anon, authenticated;
grant insert (course_slug, lesson_slug) on public.lesson_progress to authenticated;

create trigger lesson_progress_daily_limit
before insert on public.lesson_progress
for each row execute function public.limit_daily_inserts ('200', 'user_id');

create trigger audit_lesson_progress
after insert or update or delete on public.lesson_progress
for each row execute function public.audit_row_change ();
