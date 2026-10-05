import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { FormShell, IconBadge, Notice } from "@/components/ui/page";
import { StopForm } from "@/features/route/components/stop-form";
import { StopImageForm } from "@/features/route/components/stop-image-form";
import { getStopImagePaths, resolveStopImages } from "@/features/route/images";
import { getOwnedStop } from "@/features/route/queries";
import { uuidSchema } from "@/features/route/schemas";

export default async function EditDestination({ params, searchParams }: PageProps<"/trips/[tripId]/destinations/[stopId]/edit">) {
  const [{ tripId, stopId }, query] = await Promise.all([params, searchParams]);
  if (!uuidSchema.safeParse(tripId).success || !uuidSchema.safeParse(stopId).success) notFound();
  const stop = await getOwnedStop(tripId, stopId);
  if (!stop) notFound();
  const [images, paths] = await Promise.all([resolveStopImages([stop]).catch(() => ({} as Awaited<ReturnType<typeof resolveStopImages>>)), getStopImagePaths([stop.id]).catch(() => new Map<string, string>())]);
  return <FormShell backHref={`/trips/${tripId}/route`} backLabel="Voltar à rota" eyebrow="Editar destino" icon="mapPin" title={stop.placeName} aside={
    <section id="imagem" aria-labelledby="stop-image-title" className="mt-6 scroll-mt-6 rounded-feature border border-border bg-card p-5 sm:p-8">
      <div className="mb-5 flex items-center gap-3"><IconBadge icon="image" size="sm" /><div><h2 id="stop-image-title" className="text-xl font-semibold">Imagem do destino</h2><p className="text-sm text-muted-foreground">Aparece nos banners, no carrossel da rota e nos detalhes do destino.</p></div></div>
      {query.cover ? <div className="mb-4"><Notice tone="neutral">A capa da viagem usa a imagem do primeiro destino ({stop.placeName}). Altere-a aqui.</Notice></div> : null}
      {query.image ? <div className="mb-4"><Notice tone="success">Imagem guardada.</Notice></div> : query.imageRemoved ? <div className="mb-4"><Notice tone="success">Imagem removida.</Notice></div> : null}
      <StopImageForm tripId={tripId} stopId={stopId} placeName={stop.placeName} image={images[stop.id] ?? null} hasUpload={paths.has(stop.id)} />
    </section>
  }>
    <StopForm tripId={tripId} stopId={stopId} initial={{ placeName: stop.placeName, countryCode: stop.countryCode, countryName: stop.countryName, arrivalDate: stop.arrivalDate, departureDate: stop.departureDate, timezone: stop.timezone ?? "", notes: stop.notes ?? "", createRequestId: randomUUID() }} />
  </FormShell>;
}
