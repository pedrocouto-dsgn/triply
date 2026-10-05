-- Triply — owner request 2026-10-05: an independent banner image for the "Todas as viagens" page.
-- Additive: one nullable profile column and an owner-only upload policy for {user_id}/banner/* in the private destination-images bucket.
begin;
alter table public.profiles add column if not exists trips_banner_path text;
alter table public.profiles drop constraint if exists profiles_trips_banner_path_check;
alter table public.profiles add constraint profiles_trips_banner_path_check check(trips_banner_path is null or char_length(trips_banner_path) between 1 and 400);
drop policy if exists "trips_banner_owner_insert" on storage.objects;
create policy "trips_banner_owner_insert" on storage.objects for insert to authenticated with check(bucket_id='destination-images' and (storage.foldername(name))[1]=(select auth.uid())::text and (storage.foldername(name))[2]='banner');
commit;
