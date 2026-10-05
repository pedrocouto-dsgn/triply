-- Triply — owner corrections 2026-10-05.
-- Additive / relaxing only: no data is rewritten or removed.
-- 1. Timezones become optional everywhere: a local time no longer requires a timezone.
-- 2. Checklist tasks gain a priority (high by default).
-- 3. Existing ticket prices are mirrored once into the budget (insert only).
begin;

-- 1a. Travel legs: a time only needs its date; timezone is optional.
alter table public.travel_legs drop constraint if exists travel_legs_departure_time_check;
alter table public.travel_legs drop constraint if exists travel_legs_arrival_time_check;
alter table public.travel_legs add constraint travel_legs_departure_time_check check (departure_time is null or departure_date is not null);
alter table public.travel_legs add constraint travel_legs_arrival_time_check check (arrival_time is null or arrival_date is not null);

create or replace function public.validate_travel_leg() returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_trip_start date; v_trip_end date; v_departure_instant timestamptz; v_arrival_instant timestamptz;
begin
  if not new.review_required and not public.route_points_are_adjacent(new.trip_id, new.from_kind, new.from_stop_id, new.to_kind, new.to_stop_id) then
    raise exception 'leg_endpoints_not_adjacent';
  end if;
  select start_date, end_date into v_trip_start, v_trip_end from public.trips where id = new.trip_id;
  if new.departure_date is not null and (new.departure_date < v_trip_start or new.departure_date > v_trip_end) then raise exception 'leg_departure_outside_trip'; end if;
  if new.arrival_date is not null and (new.arrival_date < v_trip_start or new.arrival_date > v_trip_end) then raise exception 'leg_arrival_outside_trip'; end if;
  if new.departure_timezone is not null and not exists (select 1 from pg_catalog.pg_timezone_names where name = new.departure_timezone) then raise exception 'invalid_departure_timezone'; end if;
  if new.arrival_timezone is not null and not exists (select 1 from pg_catalog.pg_timezone_names where name = new.arrival_timezone) then raise exception 'invalid_arrival_timezone'; end if;
  if new.departure_date is not null and new.arrival_date is not null then
    if new.departure_time is not null and new.arrival_time is not null and new.departure_timezone is not null and new.arrival_timezone is not null then
      v_departure_instant := (new.departure_date + new.departure_time) at time zone new.departure_timezone;
      v_arrival_instant := (new.arrival_date + new.arrival_time) at time zone new.arrival_timezone;
      if v_arrival_instant < v_departure_instant then raise exception 'leg_arrival_before_departure'; end if;
    elsif new.arrival_date < new.departure_date then raise exception 'leg_arrival_before_departure'; end if;
  end if;
  return new;
end;
$$;

-- 1b. Itinerary items: timezone optional when a start time exists.
alter table public.itinerary_items drop constraint if exists itinerary_items_time_shape_check;
alter table public.itinerary_items add constraint itinerary_items_time_shape_check check (
  (start_local_time is null and end_local_time is null) or
  (start_local_time is not null and (end_local_time is null or end_local_time >= start_local_time))
);

-- 1c. Reservations: timezone optional when a start time exists.
alter table public.reservations drop constraint if exists reservations_time_check;
alter table public.reservations add constraint reservations_time_check check (
  (start_local_time is null and end_local_time is null) or
  (start_local_time is not null and (end_local_time is null or end_local_date is not null or end_local_time >= start_local_time))
);

-- 2. Checklist priority.
do $$ begin
  create type public.checklist_priority as enum ('high', 'medium', 'low');
exception when duplicate_object then null; end $$;
alter table public.checklist_items add column if not exists priority public.checklist_priority not null default 'high';
create index if not exists checklist_trip_priority_idx on public.checklist_items (trip_id, is_completed, priority, sort_order);

-- 3. Ticket prices already on travel legs appear in the budget (same rule as the app:
--    base-currency price, leg not cancelled, no expense linked to the leg yet).
insert into public.cost_items (trip_id, category_id, title, scope_type, travel_leg_id, committed_original_minor, committed_currency, committed_base_minor, committed_conversion_rate, create_request_id)
select l.trip_id, '10000000-0000-4000-8000-000000000002',
  left('Passagem: ' || coalesce(fs.place_name, t.origin_label, 'Origem') || ' → ' || coalesce(ts.place_name, t.return_label, 'Regresso'), 120),
  'travel_leg', l.id, l.price_minor, l.price_currency, l.price_minor, 1, gen_random_uuid()
from public.travel_legs l
join public.trips t on t.id = l.trip_id
left join public.stops fs on fs.id = l.from_stop_id
left join public.stops ts on ts.id = l.to_stop_id
where l.price_minor is not null and l.price_currency = t.base_currency and l.status <> 'cancelled'
  and not exists (select 1 from public.cost_items c where c.travel_leg_id = l.id);

commit;
