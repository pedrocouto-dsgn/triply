import { findPlacePhoto } from "@/features/media/photos";
import type { PlaceImage } from "@/features/media/types";
import { STOP_IMAGE_BUCKET } from "@/features/route/images";
import { requireTripUser } from "@/features/trips/queries";

/** Stored path of the user's "Todas as viagens" banner; tolerates a database without the column yet. */
export async function getTripsBannerPath(): Promise<string | null> {
  const { supabase, user } = await requireTripUser();
  const { data, error } = await supabase.from("profiles").select("trips_banner_path").eq("user_id", user.id).maybeSingle();
  return error ? null : ((data as { trips_banner_path?: string | null } | null)?.trips_banner_path ?? null);
}

/** The trips page banner: the user's own upload, otherwise a fixed travel photo unrelated to any destination. */
export async function getTripsBanner(): Promise<{ image: PlaceImage | null; hasUpload: boolean }> {
  const path = await getTripsBannerPath().catch(() => null);
  if (path) {
    const { supabase } = await requireTripUser();
    const { data } = await supabase.storage.from(STOP_IMAGE_BUCKET).createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) return { image: { src: data.signedUrl, alt: "Capa das minhas viagens" }, hasUpload: true };
  }
  return { image: await findPlacePhoto("Dolomitas").catch(() => null), hasUpload: false };
}
