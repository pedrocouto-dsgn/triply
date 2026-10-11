import { notFound } from "next/navigation";
import { FormShell, Notice } from "@/components/ui/page";
import type { PlaceImage } from "@/features/media/types";
import { ImageUploadForm } from "@/features/route/components/stop-image-form";
import { getTripCoverUploads, resolveStopImages } from "@/features/route/images";
import { getOwnedRoute } from "@/features/route/queries";
import { removeTripCoverAction, uploadTripCoverAction } from "@/features/trips/cover-actions";
import { getOwnedTrip } from "@/features/trips/queries";
import { tripIdSchema } from "@/features/trips/schemas";

// The trip banner is independent from the destinations: changing it never changes a destination image.
export default async function TripCoverPage({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  if (!tripIdSchema.safeParse(tripId).success) notFound();
  const [trip, route] = await Promise.all([getOwnedTrip(tripId), getOwnedRoute(tripId)]);
  if (!trip || !route) notFound();
  const first = [...route.stops].sort((a, b) => a.position - b.position)[0];
  const [uploads, fallback] = await Promise.all([
    getTripCoverUploads([tripId]).catch((): Record<string, PlaceImage> => ({})),
    first ? resolveStopImages([first]).then((images) => images[first.id] ?? null).catch(() => null) : Promise.resolve(null),
  ]);
  const own = uploads[tripId] ?? null;
  return <FormShell backHref={`/trips/${tripId}`} backLabel={trip.name} eyebrow="Capa" icon="image" title="Capa da viagem" description="Esta imagem é só do banner da viagem. Pode escolher uma imagem diferente da de qualquer destino, sem alterar os destinos.">
    {query.saved ? <div className="mb-4"><Notice tone="success">Capa guardada.</Notice></div> : query.removed ? <div className="mb-4"><Notice tone="success">Capa removida.</Notice></div> : null}
    <ImageUploadForm upload={uploadTripCoverAction.bind(null, tripId)} remove={removeTripCoverAction.bind(null, tripId)} placeName={trip.name} image={own ?? fallback} hasUpload={Boolean(own)} removeHint={first ? `Sem capa própria, o banner usa a imagem do primeiro destino (${first.placeName}).` : "Sem capa própria, o banner usa uma ilustração."} />
  </FormShell>;
}
