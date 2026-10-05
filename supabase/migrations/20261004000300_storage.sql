-- =============================================================================
-- Storage: one public bucket "media" for portfolio photos and site images.
--   portfolio/...  portfolio photos
--   site/...       logo, favicon, hero, about, social sharing image
--   services/...   service images
--   packages/...   package images
-- Public read happens through the bucket's public URL. Listing, upload, replace
-- and delete are allowed for admins only. Safe to run more than once.
--
-- The size limit (15 MB) and allowed types must match lib/config/media.ts.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- RLS is enabled on storage.objects by Supabase. Policies:

drop policy if exists "media bucket: admin read" on storage.objects;
create policy "media bucket: admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "media bucket: admin upload" on storage.objects;
create policy "media bucket: admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "media bucket: admin update" on storage.objects;
create policy "media bucket: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "media bucket: admin delete" on storage.objects;
create policy "media bucket: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
