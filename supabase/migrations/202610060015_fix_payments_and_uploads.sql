-- Triply — fixes 2026-10-06.
-- A) Marking an expense as paid failed with 42703.
-- validate_financial_record() read new.paid_on / new.adjusted_on in one shared condition, and
-- PL/pgSQL resolves both fields for every table: payments have no adjusted_on and adjustments
-- have no paid_on, so every payment/refund insert failed. Same rules, table-specific branches.
-- B) Document uploads failed with "new row violates row-level security policy": Storage inserts
--    with RETURNING, so the new object must also pass a SELECT policy, but the existing one only
--    allows objects already referenced by a document. Owners may now also read objects inside
--    their own {user_id}/ folder of trip-documents (bucket stays private; same scope as delete).
-- No data change.
begin;

create or replace function public.validate_financial_record() returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_base text; v_category_owner uuid; v_category_default boolean; v_category_archived timestamptz;
begin
  select base_currency into v_base from public.trips where id = new.trip_id;
  if v_base is null then raise exception 'trip_not_available'; end if;
  if tg_table_name in ('cost_items','actual_expenses') then
    select user_id, is_default, archived_at into v_category_owner, v_category_default, v_category_archived from public.expense_categories where id = new.category_id;
    if not found or (not v_category_default and v_category_owner <> (select auth.uid())) or (v_category_archived is not null and (tg_op = 'INSERT' or old.category_id is distinct from new.category_id)) then raise exception 'category_not_available'; end if;
  end if;
  if tg_table_name = 'cost_items' then
    if new.estimated_currency = v_base and (new.estimated_base_minor <> new.estimated_original_minor or new.estimated_conversion_rate <> 1) then raise exception 'invalid_same_currency_conversion'; end if;
    if new.committed_currency = v_base and (new.committed_base_minor <> new.committed_original_minor or new.committed_conversion_rate <> 1) then raise exception 'invalid_same_currency_conversion'; end if;
  else
    if tg_table_name = 'payments' then
      if new.paid_on > current_date then raise exception 'future_payment_not_allowed'; end if;
    elsif tg_table_name = 'financial_adjustments' then
      if new.adjusted_on > current_date then raise exception 'future_adjustment_not_allowed'; end if;
    end if;
    if new.currency = v_base and (new.base_amount_minor <> new.amount_original_minor or new.conversion_rate <> 1) then raise exception 'invalid_same_currency_conversion'; end if;
  end if;
  return new;
end;
$$;

drop policy if exists "document_objects_owner_folder_select" on storage.objects;
create policy "document_objects_owner_folder_select" on storage.objects for select to authenticated
  using (bucket_id = 'trip-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
