"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { getOwnedPlanning } from "@/features/planning/queries";
import { getOwnedRoute } from "@/features/route/queries";
import { getOwnedTrip, requireTripUser } from "@/features/trips/queries";
import { inspectUpload, safeOriginalName } from "./helpers";
import { getOwnedDocument } from "./queries";
import { documentFormValues, documentSchema } from "./schemas";
import type { DocumentActionState } from "./types";

const documentsPath = (tripId: string) => `/trips/${tripId}/documents`;
const nullable = (value: string | null) => value || null;
const fieldErrors = (error: z.ZodError) => Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]));

const failure = (message: string, error?: { code?: string; message?: string } | null): DocumentActionState => ({ status:"error", message: error?.code ? `${message} (código ${error.code})` : message });

/**
 * Create or edit a document's details. Returns the id instead of redirecting, so the form can
 * upload the chosen file straight to private Storage before moving to the document page.
 */
export async function saveDocumentAction(tripId: string, documentId: string | undefined, _state: DocumentActionState, data: FormData): Promise<DocumentActionState> {
  const parsed = documentSchema.safeParse(documentFormValues(data));
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { status:"error", fieldErrors:errors, message: errors.requestId ? "O formulário expirou. Recarregue a página e tente novamente." : "Reveja os campos assinalados." };
  }
  const [trip, route, planning, existing] = await Promise.all([getOwnedTrip(tripId), getOwnedRoute(tripId), getOwnedPlanning(tripId), documentId ? getOwnedDocument(tripId, documentId) : Promise.resolve(null)]);
  if (!trip || !route || !planning || documentId && !existing || parsed.data.stopId && !route.stops.some((item) => item.id === parsed.data.stopId) || parsed.data.travelLegId && !route.legs.some((item) => item.id === parsed.data.travelLegId) || parsed.data.reservationId && !planning.reservations.some((item) => item.id === parsed.data.reservationId)) return { status:"error", message:"Documento ou associação não disponível." };
  const payload = { trip_id:tripId, type:parsed.data.type, title:parsed.data.title, holder_label:parsed.data.holderLabel, stop_id:nullable(parsed.data.stopId), reservation_id:nullable(parsed.data.reservationId), travel_leg_id:nullable(parsed.data.travelLegId), issue_date:nullable(parsed.data.issueDate), expiry_date:nullable(parsed.data.expiryDate), notes:parsed.data.notes, needs_review:false };
  const { supabase } = await requireTripUser();
  if (documentId) {
    const { error } = await supabase.from("travel_documents").update(payload).eq("trip_id", tripId).eq("id", documentId);
    if (error) return failure("Não foi possível guardar o documento.", error);
    revalidatePath(documentsPath(tripId));
    return { status:"saved", documentId };
  }
  const { data: created, error } = await supabase.from("travel_documents").insert({ ...payload, create_request_id:parsed.data.requestId }).select("id").single();
  if (error?.code === "23505") {
    // Same form submitted twice: continue with the document that already exists.
    const { data: repeated } = await supabase.from("travel_documents").select("id").eq("trip_id", tripId).eq("create_request_id", parsed.data.requestId).maybeSingle();
    if (repeated?.id) { revalidatePath(documentsPath(tripId)); return { status:"saved", documentId:String(repeated.id) }; }
  }
  if (error || !created) return failure("Não foi possível criar o documento.", error);
  revalidatePath(documentsPath(tripId));
  return { status:"saved", documentId:String(created.id) };
}

/**
 * Called after the browser uploaded a file directly to private Storage (this avoids the
 * 4.5 MB request limit of server functions). The object is checked here, on the server:
 * it must sit in this user's folder for this document and be a real PDF/JPEG/PNG/WEBP up to 10 MB.
 */
export async function attachUploadedFileAction(tripId: string, documentId: string, objectPath: string, originalName: string): Promise<DocumentActionState> {
  const document = await getOwnedDocument(tripId, documentId);
  if (!document) return { status:"error", message:"Documento não encontrado." };
  const { supabase, user } = await requireTripUser();
  const prefix = `${user.id}/${tripId}/${documentId}/`;
  if (!objectPath.startsWith(prefix) || objectPath.slice(prefix.length).includes("/")) return { status:"error", message:"Ficheiro inválido." };
  const discard = () => supabase.storage.from("trip-documents").remove([objectPath]);
  // Link first: the storage read policy only allows objects referenced by the user's documents.
  const { error: linkError } = await supabase.from("travel_documents").update({ attachment_path:objectPath, attachment_name:safeOriginalName(originalName), attachment_mime:"application/pdf", attachment_size:1 }).eq("trip_id", tripId).eq("id", documentId);
  if (linkError) { await discard(); return failure("Não foi possível associar o ficheiro.", linkError); }
  const restore = () => supabase.from("travel_documents").update({ attachment_path:document.attachmentPath, attachment_name:document.attachmentName, attachment_mime:document.attachmentMime, attachment_size:document.attachmentSize }).eq("trip_id", tripId).eq("id", documentId);
  const { data: blob, error: readError } = await supabase.storage.from("trip-documents").download(objectPath);
  const mime = blob ? await inspectUpload(blob) : null;
  if (readError || !blob || !mime) { await restore(); await discard(); return { status:"error", message: blob && blob.size > 10 * 1024 * 1024 ? "O ficheiro excede o limite de 10 MB." : "Use um PDF, JPEG, PNG ou WEBP válido." }; }
  const { error: updateError } = await supabase.from("travel_documents").update({ attachment_mime:mime, attachment_size:blob.size }).eq("trip_id", tripId).eq("id", documentId);
  if (updateError) { await restore(); await discard(); return failure("Não foi possível associar o ficheiro.", updateError); }
  if (document.attachmentPath && document.attachmentPath !== objectPath) await supabase.storage.from("trip-documents").remove([document.attachmentPath]);
  revalidatePath(documentsPath(tripId));
  return { status:"saved", documentId };
}

export async function removeAttachmentAction(tripId: string, documentId: string, _state: DocumentActionState, data: FormData): Promise<DocumentActionState> {
  const document = await getOwnedDocument(tripId, documentId);
  if (!document?.attachmentPath || data.get("confirm") !== "remove") return { status:"error", message:"Confirme a remoção do ficheiro." };
  const { supabase } = await requireTripUser();
  const { error } = await supabase.from("travel_documents").update({ attachment_path:null, attachment_name:null, attachment_mime:null, attachment_size:null }).eq("trip_id", tripId).eq("id", documentId);
  if (error) return { status:"error", message:"Não foi possível remover o ficheiro." };
  await supabase.storage.from("trip-documents").remove([document.attachmentPath]);
  revalidatePath(documentsPath(tripId)); redirect(`${documentsPath(tripId)}/${documentId}`);
}

export async function deleteDocumentAction(tripId: string, documentId: string, _state: DocumentActionState, data: FormData): Promise<DocumentActionState> {
  const document = await getOwnedDocument(tripId, documentId);
  if (!document || String(data.get("confirmation") ?? "") !== document.title) return { status:"error", message:"Escreva o título exato para confirmar." };
  const { supabase } = await requireTripUser(); const { error } = await supabase.from("travel_documents").delete().eq("trip_id", tripId).eq("id", documentId);
  if (error) return { status:"error", message:"Não foi possível eliminar o documento." };
  if (document.attachmentPath) await supabase.storage.from("trip-documents").remove([document.attachmentPath]);
  revalidatePath(documentsPath(tripId)); redirect(documentsPath(tripId));
}
