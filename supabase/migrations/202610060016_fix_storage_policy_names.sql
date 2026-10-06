-- Triply — fix 2026-10-06: uploads to trip-documents (and destination-images) were always refused.
-- In the insert/select policies, the unqualified "name" inside the EXISTS subquery resolved to
-- public.trips.name (the trip's name) instead of storage.objects.name, so the folder checks never
-- matched. Same rules, with the object column qualified. Policy replacement only; no data change.
begin;

drop policy if exists "document_objects_owner_insert" on storage.objects;
create policy "document_objects_owner_insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'trip-documents'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.travel_documents d join public.trips t on t.id = d.trip_id
    where d.id::text = (storage.foldername(storage.objects.name))[3]
      and d.trip_id::text = (storage.foldername(storage.objects.name))[2]
      and t.user_id = (select auth.uid())
  )
);

drop policy if exists "document_objects_owner_select" on storage.objects;
create policy "document_objects_owner_select" on storage.objects for select to authenticated using (
  bucket_id = 'trip-documents'
  and exists (
    select 1 from public.travel_documents d join public.trips t on t.id = d.trip_id
    where d.attachment_path = storage.objects.name and t.user_id = (select auth.uid())
  )
);

drop policy if exists "destination_images_owner_insert" on storage.objects;
create policy "destination_images_owner_insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'destination-images'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.stops s join public.trips t on t.id = s.trip_id
    where s.id::text = (storage.foldername(storage.objects.name))[3]
      and s.trip_id::text = (storage.foldername(storage.objects.name))[2]
      and t.user_id = (select auth.uid())
  )
);

commit;
