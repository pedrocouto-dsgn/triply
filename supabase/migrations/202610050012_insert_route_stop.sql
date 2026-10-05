-- Triply — Module 03 amendment (owner request 2026-10-05): add a destination between existing ones.
-- Additive: a new function; existing stops shift one position and legs that stop being adjacent are flagged for review.
begin;
create or replace function public.create_route_stop_at(
  p_trip_id uuid, p_place_name text, p_country_code text, p_country_name text,
  p_arrival_date date, p_departure_date date, p_timezone text, p_notes text, p_request_id uuid, p_position integer
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_max integer; v_position integer;
begin
  perform 1 from public.trips where id = p_trip_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'trip_not_available'; end if;
  select id into v_id from public.stops where trip_id = p_trip_id and create_request_id = p_request_id;
  if v_id is not null then return v_id; end if;
  select coalesce(max(position), 0) into v_max from public.stops where trip_id = p_trip_id;
  v_position := least(greatest(coalesce(p_position, v_max + 1), 1), v_max + 1);
  set constraints stops_trip_position_unique deferred;
  update public.stops set position = position + 1 where trip_id = p_trip_id and position >= v_position;
  insert into public.stops (trip_id, position, place_name, country_code, country_name, arrival_date, departure_date, timezone, notes, create_request_id)
  values (p_trip_id, v_position, trim(p_place_name), upper(p_country_code), trim(p_country_name), p_arrival_date, p_departure_date, nullif(trim(p_timezone), ''), nullif(trim(p_notes), ''), p_request_id)
  returning id into v_id;
  update public.travel_legs leg set review_required = true
  where leg.trip_id = p_trip_id and leg.review_required = false
    and not public.route_points_are_adjacent(leg.trip_id, leg.from_kind, leg.from_stop_id, leg.to_kind, leg.to_stop_id);
  return v_id;
end;
$$;
revoke all on function public.create_route_stop_at(uuid,text,text,text,date,date,text,text,uuid,integer) from public;
grant execute on function public.create_route_stop_at(uuid,text,text,text,date,date,text,text,uuid,integer) to authenticated;
commit;
