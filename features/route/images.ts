import { findPlacePhoto } from "@/features/media/photos";
import type { PlaceImage } from "@/features/media/types";
import { requireTripUser } from "@/features/trips/queries";
import type { Stop } from "./types";

export const STOP_IMAGE_BUCKET = "destination-images";
const SIGNED_URL_SECONDS = 60 * 60;

/** Stored image paths for the given stops. Tolerates a database without the image column yet. */
export async function getStopImagePaths(stopIds: string[]): Promise<Map<string, string>> {
  if (!stopIds.length) return new Map();
  const { supabase } = await requireTripUser();
  const { data, error } = await supabase.from("stops").select("id,image_path").in("id", stopIds);
  if (error || !data) return new Map();
  return new Map((data as { id: string; image_path: string | null }[]).filter((row) => row.image_path).map((row) => [row.id, row.image_path!]));
}

/** Cover image per stop: the owner's upload first, then a place photo, otherwise none (placeholder art). */
export async function resolveStopImages(stops: Pick<Stop, "id" | "placeName" | "countryName">[]): Promise<Record<string, PlaceImage>> {
  const result: Record<string, PlaceImage> = {};
  if (!stops.length) return result;
  const paths = await getStopImagePaths(stops.map((stop) => stop.id));
  if (paths.size) {
    const { supabase } = await requireTripUser();
    const { data } = await supabase.storage.from(STOP_IMAGE_BUCKET).createSignedUrls([...paths.values()], SIGNED_URL_SECONDS);
    const byPath = new Map((data ?? []).filter((item) => item.signedUrl && item.path).map((item) => [item.path!, item.signedUrl]));
    for (const stop of stops) {
      const signed = byPath.get(paths.get(stop.id) ?? "");
      if (signed) result[stop.id] = { src: signed, alt: stop.placeName };
    }
  }
  const missing = stops.filter((stop) => !result[stop.id]);
  const photos = await Promise.all(missing.map((stop) => findPlacePhoto(stop.placeName, stop.countryName)));
  missing.forEach((stop, index) => { const photo = photos[index]; if (photo) result[stop.id] = { ...photo, alt: stop.placeName }; });
  return result;
}

/** First stop per trip, used for trip list covers. */
export async function getTripCovers(tripIds: string[]): Promise<Record<string, PlaceImage>> {
  if (!tripIds.length) return {};
  const { supabase } = await requireTripUser();
  const { data, error } = await supabase.from("stops").select("id,trip_id,position,place_name,country_name").in("trip_id", tripIds).order("position");
  if (error || !data) return {};
  const first = new Map<string, { id: string; placeName: string; countryName: string }>();
  for (const row of data as { id: string; trip_id: string; place_name: string; country_name: string }[]) if (!first.has(row.trip_id)) first.set(row.trip_id, { id: row.id, placeName: row.place_name, countryName: row.country_name });
  const images = await resolveStopImages([...first.values()]);
  return Object.fromEntries([...first.entries()].filter(([, stop]) => images[stop.id]).map(([tripId, stop]) => [tripId, images[stop.id]]));
}
