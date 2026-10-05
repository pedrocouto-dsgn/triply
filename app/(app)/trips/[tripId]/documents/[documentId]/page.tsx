/* eslint-disable @next/next/no-img-element -- private, short-lived signed URL shown as-is, without the image optimizer. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { BackLink, Badge, button, IconBadge, Notice, PageContainer, Panel, type Tone } from "@/components/ui/page";
import { deriveDocumentValidity, expiresDuringTrip, type DocumentValidity } from "@/features/documents/helpers";
import { documentTypeLabels } from "@/features/documents/labels";
import { getOwnedDocument } from "@/features/documents/queries";
import { getOwnedPlanning } from "@/features/planning/queries";
import { getOwnedRoute } from "@/features/route/queries";
import { formatTripDate } from "@/features/trips/date";
import { todayInLisbon } from "@/features/trips/lifecycle";
import { getOwnedTrip, requireTripUser } from "@/features/trips/queries";
import { tripIdSchema } from "@/features/trips/schemas";

const validityLabels: Record<DocumentValidity, string> = { expired: "Expirado", expiring_soon: "Expira em breve", valid: "Válido", no_expiry: "Sem validade indicada" };
const validityTones: Record<DocumentValidity, Tone> = { expired: "danger", expiring_soon: "warning", valid: "success", no_expiry: "neutral" };
const notices: Record<string, string> = { created: "Documento criado.", saved: "Alterações guardadas.", uploaded: "Ficheiro enviado." };
const sizeLabel = (bytes: string | null) => { const value = Number(bytes ?? 0); return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(value / 1024))} KB`; };
const date = (value: string | null) => value ? formatTripDate(value) : "—";

/** Read-only view of a document: its details, a private preview of the attachment and a download button. */
export default async function DocumentPage({ params, searchParams }: { params: Promise<{ tripId: string; documentId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ tripId, documentId }, query] = await Promise.all([params, searchParams]);
  if (!tripIdSchema.safeParse(tripId).success || !tripIdSchema.safeParse(documentId).success) notFound();
  const [trip, document, route, planning] = await Promise.all([getOwnedTrip(tripId), getOwnedDocument(tripId, documentId), getOwnedRoute(tripId), getOwnedPlanning(tripId)]);
  if (!trip || !document || !route || !planning) notFound();
  // Short-lived signed URL for the inline preview, created only after ownership was checked (ADR-004).
  let previewUrl: string | null = null;
  if (document.attachmentPath) {
    const { supabase } = await requireTripUser();
    const { data } = await supabase.storage.from("trip-documents").createSignedUrl(document.attachmentPath, 300);
    previewUrl = data?.signedUrl ?? null;
  }
  const validity = deriveDocumentValidity(document.expiryDate, todayInLisbon());
  const stop = route.stops.find((item) => item.id === document.stopId);
  const leg = route.legs.find((item) => item.id === document.travelLegId);
  const reservation = planning.reservations.find((item) => item.id === document.reservationId);
  const notice = Object.keys(notices).find((key) => query[key]);
  const isImage = document.attachmentMime?.startsWith("image/");
  const downloadHref = `/trips/${tripId}/documents/${documentId}/download`;

  return <PageContainer width="medium">
    <BackLink href={`/trips/${tripId}/documents`}>Voltar aos documentos</BackLink>
    <header className="my-6 flex flex-wrap items-start gap-4">
      <IconBadge icon="file" size="lg" tone={validityTones[validity]} />
      <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-link">{documentTypeLabels[document.type]}</p><h1 className="mt-1 break-words text-3xl font-semibold tracking-tight sm:text-4xl">{document.title}</h1><div className="mt-3"><Badge tone={validityTones[validity]}>{validityLabels[validity]}</Badge></div></div>
      <div className="flex flex-wrap gap-2">{document.attachmentPath ? <a href={downloadHref} className={button.primary}><Icon name="download" size={16} />Descarregar</a> : null}<Link href={`/trips/${tripId}/documents/${documentId}/edit`} className={button.secondary}><Icon name="pencil" size={16} />Editar</Link></div>
    </header>
    <div className="space-y-3">
      {notice ? <Notice tone="success">{notices[notice]}</Notice> : null}
      {query.uploadFailed ? <Notice tone="warning" role="alert">Os dados foram guardados, mas o ficheiro não foi enviado. Use “Editar” para tentar de novo.</Notice> : null}
      {expiresDuringTrip(document, trip.endDate) ? <Notice tone="warning">Atenção: expira antes do fim da viagem. Confirme os requisitos oficiais aplicáveis.</Notice> : null}
      {document.needsReview ? <Notice tone="warning">Rever associação: o item relacionado foi alterado ou removido.</Notice> : null}
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Panel aria-labelledby="details-title">
        <h2 id="details-title" className="text-lg font-semibold">Informações</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Tipo" value={documentTypeLabels[document.type]} />
          <Row label="Titular" value={document.holderLabel ?? "—"} />
          <Row label="Emissão" value={date(document.issueDate)} />
          <Row label="Validade" value={date(document.expiryDate)} />
          <Row label="Destino" value={stop?.placeName ?? "—"} />
          <Row label="Transporte" value={leg ? leg.operator || leg.reference || leg.mode : "—"} />
          <Row label="Reserva" value={reservation?.title ?? "—"} />
        </dl>
        {document.notes ? <div className="mt-5 border-t border-border pt-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Notas</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{document.notes}</p></div> : null}
      </Panel>

      <Panel aria-labelledby="attachment-title">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="attachment-title" className="text-lg font-semibold">Anexo</h2>{document.attachmentPath ? <span className="text-xs text-muted-foreground">{document.attachmentName} · {sizeLabel(document.attachmentSize)}</span> : null}</div>
        {!document.attachmentPath ? <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground"><p>Ainda não existe ficheiro associado.</p><Link href={`/trips/${tripId}/documents/${documentId}/edit`} className={`${button.secondary} mt-4`}><Icon name="plus" size={15} />Adicionar ficheiro</Link></div>
          : !previewUrl ? <p role="alert" className="mt-4 text-sm text-destructive">Não foi possível abrir a pré-visualização. Pode tentar descarregar o ficheiro.</p>
          : isImage ? <img src={previewUrl} alt={`Anexo de ${document.title}`} className="mt-4 max-h-[70vh] w-full rounded-2xl border border-border bg-surface object-contain" />
          : <iframe src={previewUrl} title={`Anexo de ${document.title}`} className="mt-4 h-[70vh] w-full rounded-2xl border border-border bg-white" />}
        {document.attachmentPath ? <div className="mt-4 flex flex-wrap gap-2"><a href={downloadHref} className={button.primary}><Icon name="download" size={16} />Descarregar anexo</a>{previewUrl ? <a href={previewUrl} target="_blank" rel="noreferrer" className={button.secondary}><Icon name="external" size={15} />Abrir noutra janela</a> : null}</div> : null}
      </Panel>
    </div>
  </PageContainer>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-right font-medium">{value}</dd></div>;
}
