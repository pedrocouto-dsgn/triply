import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { FormShell } from "@/components/ui/page";
import { StopForm } from "@/features/route/components/stop-form";
import { getOwnedRoute } from "@/features/route/queries";
import { getOwnedTrip } from "@/features/trips/queries";
import { tripIdSchema } from "@/features/trips/schemas";

export default async function NewDestination({ params, searchParams }: PageProps<"/trips/[tripId]/destinations/new">) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  if (!tripIdSchema.safeParse(tripId).success) notFound();
  const [trip, route] = await Promise.all([getOwnedTrip(tripId), getOwnedRoute(tripId)]);
  if (!trip || !route) notFound();
  const afterId = typeof query.after === "string" ? query.after : null;
  const stops = [...route.stops].sort((a, b) => a.position - b.position);
  const index = afterId ? stops.findIndex((stop) => stop.id === afterId) : stops.length - 1;
  const previous = index >= 0 ? stops[index] : undefined, next = stops[index + 1];
  const arrivalDate = previous?.departureDate ?? trip.startDate;
  const departureDate = next?.arrivalDate ?? trip.endDate;
  const where = previous && next ? <>Entre <strong>{previous.placeName}</strong> e <strong>{next.placeName}</strong>. </> : previous ? <>Depois de <strong>{previous.placeName}</strong>. </> : null;
  return <FormShell backHref={`/trips/${tripId}/route`} backLabel="Voltar à rota" eyebrow="Novo destino" icon="mapPin" title="Adicionar destino" description={<>{where}Datas da viagem: {trip.startDate} — {trip.endDate}. O destino fica na posição certa pelas datas.</>}>
    <StopForm tripId={tripId} initial={{ placeName: "", countryCode: "", countryName: "", arrivalDate, departureDate: departureDate < arrivalDate ? arrivalDate : departureDate, timezone: previous?.timezone ?? "", notes: "", createRequestId: randomUUID(), isFinal: "" }} />
  </FormShell>;
}
