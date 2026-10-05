import { notFound } from "next/navigation";
import { FormShell, IconBadge } from "@/components/ui/page";
import { AttachmentForm, DeleteDocumentForm, DocumentForm, RemoveAttachmentForm } from "@/features/documents/components/forms";
import { getOwnedDocument } from "@/features/documents/queries";
import { getOwnedPlanning } from "@/features/planning/queries";
import { getOwnedRoute } from "@/features/route/queries";

export default async function EditDocumentPage({ params }: { params: Promise<{ tripId: string; documentId: string }> }) {
  const { tripId, documentId } = await params;
  const [document, route, planning] = await Promise.all([getOwnedDocument(tripId, documentId), getOwnedRoute(tripId), getOwnedPlanning(tripId)]);
  if (!document || !route || !planning) notFound();
  return <FormShell backHref={`/trips/${tripId}/documents/${documentId}`} backLabel="Voltar ao documento" eyebrow="Documentos privados" icon="file" title="Editar documento" aside={<>
    <section className="mt-6 rounded-feature border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3"><IconBadge icon="shield" size="sm" /><h2 className="text-xl font-semibold">Ficheiro privado</h2></div>
      {document.attachmentPath ? <p className="my-3 break-all text-sm">Atual: {document.attachmentName} · <a className="font-semibold text-link underline" href={`/trips/${tripId}/documents/${document.id}/download`}>Abrir / descarregar</a></p> : <p className="my-3 text-sm text-muted-foreground">Ainda não existe ficheiro associado.</p>}
      <AttachmentForm tripId={tripId} document={document} />
      {document.attachmentPath ? <div className="mt-6 border-t border-border pt-5"><RemoveAttachmentForm tripId={tripId} documentId={document.id} /></div> : null}
    </section>
    <section className="mt-6 rounded-feature border border-destructive/50 bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3"><IconBadge icon="trash" tone="danger" size="sm" /><h2 className="text-xl font-semibold text-destructive">Zona destrutiva</h2></div>
      <div className="mt-4"><DeleteDocumentForm tripId={tripId} document={document} /></div>
    </section>
  </>}>
    <DocumentForm tripId={tripId} document={document} stops={route.stops} legs={route.legs} reservations={planning.reservations} />
  </FormShell>;
}
