import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { Notice, PageContainer } from "@/components/ui/page";
import { ItineraryOverview, ItineraryTimeline } from "@/features/itinerary/components/timeline";
import { buildTripDays } from "@/features/itinerary/days";
import { listOwnedItinerary } from "@/features/itinerary/queries";
import type { PlaceImage } from "@/features/media/types";
import { resolveStopImages } from "@/features/route/images";
import { getOwnedRoute } from "@/features/route/queries";
import { TripHero } from "@/features/trips/components/trip-hero";
import { getOwnedTrip } from "@/features/trips/queries";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function ItineraryPage({ params, searchParams }: PageProps<"/trips/[tripId]/itinerary">) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]), [trip, route, items] = await Promise.all([getOwnedTrip(tripId), getOwnedRoute(tripId), listOwnedItinerary(tripId)]);
  if (!trip || !route || !items) notFound();
  const images = await resolveStopImages(route.stops).catch((): Record<string, PlaceImage> => ({}));
  const days = buildTripDays(trip, route.stops, items, route.legs), outside = items.filter((item) => item.tripDate < trip.startDate || item.tripDate > trip.endDate);
  return <PageContainer width="medium" hero={<TripHero trip={trip} active="itinerary" cover={route.stops[0] ? images[route.stops[0].id] ?? null : null} title="Itinerário" description={`${days.length} dia(s), com horas locais, atividades flexíveis e transportes projetados da rota.`} />}>
    {first(query.saved) || first(query.moved) || first(query.reordered) || first(query.deleted) ? <div className="mt-4"><Notice tone="success">Itinerário atualizado.</Notice></div> : null}
    {outside.length ? <section className="mt-4 rounded-card border border-warning/40 bg-warning-muted p-5"><h2 className="flex items-center gap-2 font-semibold text-warning"><Icon name="alert" size={18} />Atividades fora das datas atuais</h2><p className="mt-1 text-sm text-warning">Foram preservadas após uma alteração da viagem. Edite cada atividade e escolha um dia válido.</p>{outside.map((item) => <Link key={item.id} href={`/trips/${tripId}/itinerary/${item.id}/edit`} className="mt-3 block text-sm font-semibold text-warning underline">{item.tripDate} · {item.title}</Link>)}</section> : null}
    <div className="mt-4"><ItineraryOverview days={days} /></div>
    <div className="mt-6"><ItineraryTimeline trip={trip} days={days} images={images} /></div>
  </PageContainer>;
}
