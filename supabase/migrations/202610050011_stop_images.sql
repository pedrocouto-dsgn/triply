-- Triply — Module 03 amendment (owner request 2026-10-05): optional destination cover image.
-- Additive only: one nullable column, one private bucket and owner-scoped storage policies.
begin;
alter table public.stops add column if not exists image_path text;
alter table public.stops drop constraint if exists stops_image_path_check;
alter table public.stops add constraint stops_image_path_check check(image_path is null or char_length(image_path) between 1 and 400);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('destination-images','destination-images',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

-- Object path: {user_id}/{trip_id}/{stop_id}/{uuid}.{ext}
drop policy if exists "destination_images_owner_select" on storage.objects;
drop policy if exists "destination_images_owner_insert" on storage.objects;
drop policy if exists "destination_images_owner_delete" on storage.objects;
create policy "destination_images_owner_select" on storage.objects for select to authenticated using(bucket_id='destination-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "destination_images_owner_insert" on storage.objects for insert to authenticated with check(bucket_id='destination-images' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.stops s join public.trips t on t.id=s.trip_id where s.id::text=(storage.foldername(name))[3] and s.trip_id::text=(storage.foldername(name))[2] and t.user_id=(select auth.uid())));
create policy "destination_images_owner_delete" on storage.objects for delete to authenticated using(bucket_id='destination-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
