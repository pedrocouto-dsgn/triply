"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extensionFor, inspectUpload } from "@/features/documents/helpers";
import { getTripCoverPaths, STOP_IMAGE_BUCKET } from "@/features/route/images";
import { MAX_STOP_IMAGE_BYTES, type StopImageState } from "@/features/route/image-types";
import { getOwnedTrip, requireTripUser } from "./queries";

const imageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

/** The trip banner is its own image: it never touches any destination's image. */
export async function uploadTripCoverAction(tripId: string, _state: StopImageState, data: FormData): Promise<StopImageState> {
  const trip = await getOwnedTrip(tripId);
  const file = data.get("image");
  if (!trip || !(file instanceof File) || file.size === 0) return { status: "error", message: "Escolha uma imagem para carregar." };
  if (file.size > MAX_STOP_IMAGE_BYTES) return { status: "error", message: "A imagem excede o limite de 5 MB." };
  const mime = await inspectUpload(file);
  if (!mime || !imageMimes.has(mime)) return { status: "error", message: "Use uma imagem JPEG, PNG ou WEBP válida." };
  const { supabase, user } = await requireTripUser();
  const previous = (await getTripCoverPaths([tripId])).get(tripId);
  const path = `${user.id}/${tripId}/cover/${crypto.randomUUID()}.${extensionFor(mime)}`;
  const { error: uploadError } = await supabase.storage.from(STOP_IMAGE_BUCKET).upload(path, await file.arrayBuffer(), { contentType: mime, upsert: false });
  if (uploadError) return { status: "error", message: "O upload falhou. Confirme que a migração 202610110017_trip_cover_image.sql foi aplicada no Supabase." };
  const { error: updateError } = await supabase.from("trips").update({ cover_image_path: path }).eq("id", tripId).eq("user_id", user.id);
  if (updateError) { await supabase.storage.from(STOP_IMAGE_BUCKET).remove([path]); return { status: "error", message: "Não foi possível guardar a capa da viagem." }; }
  if (previous) await supabase.storage.from(STOP_IMAGE_BUCKET).remove([previous]);
  revalidatePath(`/trips/${tripId}`, "layout");
  revalidatePath("/trips");
  redirect(`/trips/${tripId}/cover?saved=1`);
}

export async function removeTripCoverAction(tripId: string): Promise<StopImageState> {
  const trip = await getOwnedTrip(tripId);
  const previous = trip ? (await getTripCoverPaths([tripId])).get(tripId) : undefined;
  if (!trip || !previous) return { status: "error", message: "Esta viagem não tem capa própria." };
  const { supabase, user } = await requireTripUser();
  const { error } = await supabase.from("trips").update({ cover_image_path: null }).eq("id", tripId).eq("user_id", user.id);
  if (error) return { status: "error", message: "Não foi possível remover a capa." };
  await supabase.storage.from(STOP_IMAGE_BUCKET).remove([previous]);
  revalidatePath(`/trips/${tripId}`, "layout");
  revalidatePath("/trips");
  redirect(`/trips/${tripId}/cover?removed=1`);
}
