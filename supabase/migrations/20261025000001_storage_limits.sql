-- M0 (spec S4): review photos are images of at most 5 MB, and the bucket can no longer be
-- listed by anyone. Public URLs keep working without a read policy because the bucket is public;
-- owners keep a read policy on their own folder, which Storage needs before it will delete.

update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif']
where id = 'review-photos';

drop policy "review photos are publicly readable" on storage.objects;

create policy "users can read their own review photo objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'review-photos'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  );
