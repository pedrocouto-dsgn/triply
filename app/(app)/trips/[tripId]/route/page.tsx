import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { button, PageContainer } from "@/components/ui/page";
import { RouteMap } from "@/components/ui/route-map";
import { geocodeStops, type Coordinates } from "@/features/media/geocode";
import { RouteOverview } from "@/features/route/components/overview";
import { RouteStatus } from "@/features/route/components/status";
import type { PlaceImage } from "@/features/media/types";
import { resolveStopImages } from "@/features/route/images";
import { getOwnedRoute } from "@/features/route/queries";
import { TripHero } from "@/features/trips/components/trip-hero";
import { getOwnedTrip } from "@/features/trips/queries";
import { tripIdSchema } from "@/features/trips/schemas";

export default async function RoutePage({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  if (!tripIdSchema.safeParse(tripId).success) notFound();
  const [trip, route] = await Promise.all([getOwnedTrip(tripId), getOwnedRoute(tripId)]);
  if (!trip || !route) notFound();
  const images = await resolveStopImages(route.stops).catch((): Record<string, PlaceImage> => ({}));
  const cover = route.stops[0] ? images[route.stops[0].id] ?? null : null;
  const ordered = [...route.stops].sort((a, b) => a.position - b.position);
  const coordinates = await geocodeStops(ordered).catch((): Record<string, Coordinates> => ({}));
  const points = ordered.map((stop, index) => ({ stop, number: index + 1 })).filter(({ stop }) => coordinates[stop.id]).map(({ stop, number }) => ({ ...coordinates[stop.id], label: stop.placeName, number }));
  return <PageContainer hero={<TripHero trip={trip} active="route" cover={cover} size="lg" backdrop={points.length ? <RouteMap points={points} /> : undefined} title="Rota e destinos" description={`${route.stops.length} ${route.stops.length === 1 ? "destino" : "destinos"} pela ordem da viagem, com os trajetos entre eles.`} actions={<Link href={`/trips/${tripId}/destinations/new`} className={button.primary}><Icon name="plus" size={16} />Adicionar destino</Link>} />}>
    <RouteStatus query={query} />
    <RouteOverview trip={trip} route={route} images={images} />
  </PageContainer>;
}
