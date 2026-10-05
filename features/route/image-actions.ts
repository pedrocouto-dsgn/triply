"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extensionFor, inspectUpload } from "@/features/documents/helpers";
import { requireTripUser } from "@/features/trips/queries";
import { getStopImagePaths, STOP_IMAGE_BUCKET } from "./images";
import { MAX_STOP_IMAGE_BYTES, type StopImageState } from "./image-types";
import { getOwnedStop } from "./queries";

const imageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

function refresh(tripId: string) {
  revalidatePath(`/trips/${tripId}`, "layout");
}

export async function uploadStopImageAction(tripId: string, stopId: string, _state: StopImageState, data: FormData): Promise<StopImageState> {
  const stop = await getOwnedStop(tripId, stopId);
  const file = data.get("image");
  if (!stop || !(file instanceof File) || file.size === 0) return { status: "error", message: "Escolha uma imagem para carregar." };
  if (file.size > MAX_STOP_IMAGE_BYTES) return { status: "error", message: "A imagem excede o limite de 5 MB." };
  const mime = await inspectUpload(file);
  if (!mime || !imageMimes.has(mime)) return { status: "error", message: "Use uma imagem JPEG, PNG ou WEBP válida." };
  const { supabase, user } = await requireTripUser();
  const previous = (await getStopImagePaths([stopId])).get(stopId);
  const path = `${user.id}/${tripId}/${stopId}/${crypto.randomUUID()}.${extensionFor(mime)}`;
  const { error: uploadError } = await supabase.storage.from(STOP_IMAGE_BUCKET).upload(path, await file.arrayBuffer(), { contentType: mime, upsert: false });
  if (uploadError) return { status: "error", message: "O upload falhou. A imagem anterior, se existir, foi preservada." };
  const { error: updateError } = await supabase.from("stops").update({ image_path: path }).eq("trip_id", tripId).eq("id", stopId);
  if (updateError) { await supabase.storage.from(STOP_IMAGE_BUCKET).remove([path]); return { status: "error", message: "Não foi possível associar a imagem ao destino." }; }
  if (previous) await supabase.storage.from(STOP_IMAGE_BUCKET).remove([previous]);
  refresh(tripId);
  redirect(`/trips/${tripId}/destinations/${stopId}/edit?image=1`);
}

export async function removeStopImageAction(tripId: string, stopId: string): Promise<StopImageState> {
  const stop = await getOwnedStop(tripId, stopId);
  const previous = stop ? (await getStopImagePaths([stopId])).get(stopId) : undefined;
  if (!stop || !previous) return { status: "error", message: "Este destino não tem imagem carregada." };
  const { supabase } = await requireTripUser();
  const { error } = await supabase.from("stops").update({ image_path: null }).eq("trip_id", tripId).eq("id", stopId);
  if (error) return { status: "error", message: "Não foi possível remover a imagem." };
  await supabase.storage.from(STOP_IMAGE_BUCKET).remove([previous]);
  refresh(tripId);
  redirect(`/trips/${tripId}/destinations/${stopId}/edit?imageRemoved=1`);
}
