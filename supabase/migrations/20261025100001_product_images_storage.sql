-- M1: a public bucket for tea photos (maker-permitted packshots) that only admins can write.
-- Taster photos stay in review-photos and are never promoted automatically.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "admins can upload tea photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin ());

create policy "admins can read tea photo objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin ());

create policy "admins can delete tea photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin ());
