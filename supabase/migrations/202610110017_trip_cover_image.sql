-- Triply — owner request 2026-10-11: a trip banner independent from every destination image.
-- Additive only: one nullable column on trips and an owner-only upload policy for
-- {user_id}/{trip_id}/cover/* in the private destination-images bucket (select/delete policies already cover the user's folder).
begin;
alter table public.trips add column if not exists cover_image_path text;
alter table public.trips drop constraint if exists trips_cover_image_path_check;
alter table public.trips add constraint trips_cover_image_path_check check(cover_image_path is null or char_length(cover_image_path) between 1 and 400);
drop policy if exists "trip_cover_owner_insert" on storage.objects;
create policy "trip_cover_owner_insert" on storage.objects for insert to authenticated with check(bucket_id='destination-images' and (storage.foldername(name))[1]=(select auth.uid())::text and (storage.foldername(name))[3]='cover' and exists(select 1 from public.trips t where t.id::text=(storage.foldername(name))[2] and t.user_id=(select auth.uid())));
commit;
