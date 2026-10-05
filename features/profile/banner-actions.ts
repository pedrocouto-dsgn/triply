"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extensionFor, inspectUpload } from "@/features/documents/helpers";
import { STOP_IMAGE_BUCKET } from "@/features/route/images";
import { MAX_STOP_IMAGE_BYTES, type StopImageState } from "@/features/route/image-types";
import { requireTripUser } from "@/features/trips/queries";
import { getTripsBannerPath } from "./banner";

const imageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadTripsBannerAction(_state: StopImageState, data: FormData): Promise<StopImageState> {
  const file = data.get("image");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Escolha uma imagem para carregar." };
  if (file.size > MAX_STOP_IMAGE_BYTES) return { status: "error", message: "A imagem excede o limite de 5 MB." };
  const mime = await inspectUpload(file);
  if (!mime || !imageMimes.has(mime)) return { status: "error", message: "Use uma imagem JPEG, PNG ou WEBP válida." };
  const { supabase, user } = await requireTripUser();
  const previous = await getTripsBannerPath();
  const path = `${user.id}/banner/${crypto.randomUUID()}.${extensionFor(mime)}`;
  const { error: uploadError } = await supabase.storage.from(STOP_IMAGE_BUCKET).upload(path, await file.arrayBuffer(), { contentType: mime, upsert: false });
  if (uploadError) return { status: "error", message: "O upload falhou. Confirme que a migração 202610050013 foi aplicada no Supabase." };
  const { error } = await supabase.from("profiles").update({ trips_banner_path: path }).eq("user_id", user.id);
  if (error) { await supabase.storage.from(STOP_IMAGE_BUCKET).remove([path]); return { status: "error", message: "Não foi possível guardar a capa." }; }
  if (previous) await supabase.storage.from(STOP_IMAGE_BUCKET).remove([previous]);
  revalidatePath("/trips");
  redirect("/settings/banner?saved=1");
}

export async function removeTripsBannerAction(): Promise<StopImageState> {
  const { supabase, user } = await requireTripUser();
  const previous = await getTripsBannerPath();
  if (!previous) return { status: "error", message: "Não há uma capa própria para remover." };
  const { error } = await supabase.from("profiles").update({ trips_banner_path: null }).eq("user_id", user.id);
  if (error) return { status: "error", message: "Não foi possível remover a capa." };
  await supabase.storage.from(STOP_IMAGE_BUCKET).remove([previous]);
  revalidatePath("/trips");
  redirect("/settings/banner?removed=1");
}
