"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { RequestIdInput } from "@/components/ui/request-id";
import { createClient } from "@/lib/supabase/client";
import type { Reservation } from "@/features/planning/types";
import type { Stop, TravelLeg } from "@/features/route/types";
import { attachUploadedFileAction, deleteDocumentAction, removeAttachmentAction, saveDocumentAction } from "../actions";
import { extensionFor, inspectUpload } from "../helpers";
import type { DocumentActionState, TravelDocument } from "../types";
import { documentTypeLabels } from "../labels";
import { initialDocumentState } from "../types";

const input = "mt-2 h-11 w-full rounded-control border border-input bg-card px-3";
const MAX_BYTES = 10 * 1024 * 1024;

/** Upload straight to the private bucket (no 4.5 MB server limit), then let the server verify and link it. */
async function uploadAttachment(tripId: string, documentId: string, file: File): Promise<string | null> {
  if (file.size < 1 || file.size > MAX_BYTES) return "O ficheiro tem de ter até 10 MB.";
  const mime = await inspectUpload(file);
  if (!mime) return "Use um PDF, JPEG, PNG ou WEBP válido.";
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return "A sessão expirou. Entre novamente para enviar o ficheiro.";
  const path = `${auth.user.id}/${tripId}/${documentId}/${crypto.randomUUID()}.${extensionFor(mime)}`;
  const { error } = await supabase.storage.from("trip-documents").upload(path, file, { contentType: mime, upsert: false });
  if (error) return /bucket not found/i.test(error.message) ? "O armazenamento de documentos não está configurado no Supabase (bucket trip-documents em falta)." : /row-level security/i.test(error.message) ? "O envio foi recusado pelo Supabase. Aplique a migração 202610060016_fix_storage_policy_names.sql no Supabase." : "O envio do ficheiro falhou. Tente novamente.";
  const result = await attachUploadedFileAction(tripId, documentId, path, file.name);
  return result.status === "error" ? result.message ?? "Não foi possível associar o ficheiro." : null;
}

function FileField({ label, onChange }: { label: string; onChange: (file: File | null) => void }) {
  return <label className="block text-sm font-medium">{label}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => onChange(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm file:mr-3 file:min-h-10 file:rounded-full file:border-0 file:bg-elevated file:px-4 file:text-sm file:font-semibold file:text-foreground" /><span className="mt-1 block text-xs font-normal text-muted-foreground">PDF, JPEG, PNG ou WEBP, até 10 MB. O ficheiro fica privado.</span></label>;
}

export function DocumentForm({ tripId, document, stops, legs, reservations }: { tripId:string; document?:TravelDocument; stops:Stop[]; legs:TravelLeg[]; reservations:Reservation[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [state, action, saving] = useActionState(async (previous: DocumentActionState, data: FormData) => {
    setUploadError(null);
    const result = await saveDocumentAction(tripId, document?.id, previous, data);
    if (result.status === "saved" && result.documentId) {
      if (file) {
        setUploading(true);
        const failure = await uploadAttachment(tripId, result.documentId, file);
        setUploading(false);
        if (failure) { setUploadError(`Os dados foram guardados, mas o ficheiro não: ${failure}`); router.push(`/trips/${tripId}/documents/${result.documentId}?uploadFailed=1`); return result; }
      }
      router.push(`/trips/${tripId}/documents/${result.documentId}?${document ? "saved" : "created"}=1`);
    }
    return result;
  }, initialDocumentState);
  const [, startTransition] = useTransition();
  const pending = saving || uploading || state.status === "saved";
  const error = (name: string) => state.fieldErrors?.[name] ? <p className="mt-1 text-sm text-destructive">{state.fieldErrors[name]}</p> : null;
  // Submitted manually so React does not clear the fields when validation fails.
  return <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => action(data)); }} className="space-y-5" noValidate><RequestIdInput />
    <label className="block text-sm font-medium">Tipo *<select name="type" defaultValue={document?.type ?? "passport"} className={input}>{Object.entries(documentTypeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label className="block text-sm font-medium">Título *<input name="title" defaultValue={document?.title} maxLength={160} required className={input} aria-invalid={Boolean(state.fieldErrors?.title)}/>{error("title")}</label>
    <label className="block text-sm font-medium">Titular / viajante (opcional)<input name="holderLabel" defaultValue={document?.holderLabel ?? ""} maxLength={120} className={input}/>{error("holderLabel")}</label>
    <div className="grid gap-4 sm:grid-cols-2"><Association name="stopId" label="Destino" value={document?.stopId} items={stops.map((x)=>[x.id,x.placeName])}/><Association name="travelLegId" label="Transporte" value={document?.travelLegId} items={legs.map((x)=>[x.id,x.operator || x.reference || x.mode])}/><Association name="reservationId" label="Reserva" value={document?.reservationId} items={reservations.map((x)=>[x.id,x.title])}/></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Data de emissão<input name="issueDate" type="date" defaultValue={document?.issueDate ?? ""} className={input}/>{error("issueDate")}</label><label className="block text-sm font-medium">Data de validade<input name="expiryDate" type="date" defaultValue={document?.expiryDate ?? ""} className={input}/>{error("expiryDate")}</label></div>
    <label className="block text-sm font-medium">Notas<textarea name="notes" defaultValue={document?.notes ?? ""} maxLength={4000} className="mt-2 min-h-28 w-full rounded-control border border-input p-3"/>{error("notes")}</label>
    <p className="text-xs text-muted-foreground">Evite inserir números completos de passaporte ou identificação, cartões, PINs, palavras-passe ou outros segredos nas notas.</p>
    {document ? null : <FileField label="Anexo (opcional)" onChange={setFile} />}
    {state.status === "error" && state.message ? <p role="alert" className="rounded-control border border-destructive bg-destructive-muted p-3 text-sm text-destructive">{state.message}</p> : null}
    {uploadError ? <p role="alert" className="rounded-control border border-destructive bg-destructive-muted p-3 text-sm text-destructive">{uploadError}</p> : null}
    <button disabled={pending} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{uploading ? "A enviar ficheiro…" : pending ? "A guardar…" : "Guardar documento"}</button>
  </form>;
}

function Association({ name, label, value, items }: { name:string; label:string; value?:string|null; items:[string,string][] }) { return <label className="block text-sm font-medium">{label} (opcional)<select name={name} defaultValue={value ?? ""} className={input}><option value="">Sem associação</option>{items.map(([id,text])=><option key={id} value={id}>{text}</option>)}</select></label>; }

export function AttachmentForm({ tripId, document }: { tripId:string; document:TravelDocument }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submit = () => startTransition(async () => {
    if (!file) { setMessage("Escolha um ficheiro."); return; }
    setMessage(null);
    const failure = await uploadAttachment(tripId, document.id, file);
    if (failure) { setMessage(failure); return; }
    router.push(`/trips/${tripId}/documents/${document.id}?uploaded=1`);
  });
  return <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-3"><FileField label={document.attachmentPath ? "Substituir ficheiro" : "Adicionar ficheiro"} onChange={setFile} />{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}<button disabled={pending} className="rounded-full border border-input px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{pending ? "A enviar…" : "Enviar ficheiro"}</button></form>;
}

export function RemoveAttachmentForm({ tripId, documentId }: { tripId:string; documentId:string }) { const [state, action, pending] = useActionState(removeAttachmentAction.bind(null,tripId,documentId),initialDocumentState); return <form action={action} className="space-y-3"><label className="flex items-start gap-2 text-sm"><input required type="checkbox" name="confirm" value="remove" className="mt-1"/>Confirmo que quero remover permanentemente o ficheiro, mantendo os metadados.</label>{state.message?<p role="alert" className="text-sm text-destructive">{state.message}</p>:null}<button disabled={pending} className="rounded-full border border-destructive px-5 py-2.5 text-sm font-semibold text-destructive">Remover ficheiro</button></form>; }

export function DeleteDocumentForm({ tripId, document }: { tripId:string; document:TravelDocument }) { const [state, action, pending] = useActionState(deleteDocumentAction.bind(null,tripId,document.id),initialDocumentState); return <form action={action} className="space-y-3"><label className="block text-sm font-medium">Para eliminar o registo e o ficheiro, escreva <strong>{document.title}</strong><input name="confirmation" required autoComplete="off" className={input}/></label>{state.message?<p role="alert" className="text-sm text-destructive">{state.message}</p>:null}<button disabled={pending} className="rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-primary-foreground">Eliminar documento</button></form>; }
