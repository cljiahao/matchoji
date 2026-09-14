-- Phase 1 Storage bucket for review/product photos.
-- Convention: object path is "<user_id>/<filename>" so ownership is enforceable from the path alone.

insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

create policy "review photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'review-photos');

create policy "authenticated users can upload their own review photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  );

create policy "authenticated users can delete their own review photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'review-photos'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  );
