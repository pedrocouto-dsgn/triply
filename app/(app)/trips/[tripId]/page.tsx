import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { button, PageContainer } from "@/components/ui/page";
import { TripDashboard } from "@/features/dashboard/components/trip-dashboard";
import { getTripDashboard } from "@/features/dashboard/queries";
import type { PlaceImage } from "@/features/media/types";
import { resolveStopImages } from "@/features/route/images";
import { TripHero } from "@/features/trips/components/trip-hero";
import { todayInLisbon } from "@/features/trips/lifecycle";
import { tripIdSchema } from "@/features/trips/schemas";

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!tripIdSchema.safeParse(tripId).success) notFound();
  const today = todayInLisbon();
  const dashboard = await getTripDashboard(tripId, today);
  if (!dashboard) notFound();
  const stops = dashboard.route.status === "ready" ? dashboard.route.data.stops : [];
  const images = await resolveStopImages(stops).catch((): Record<string, PlaceImage> => ({}));
  const cover = stops[0] ? images[stops[0].id] ?? null : null;
  return <PageContainer hero={<TripHero trip={dashboard.trip} active="overview" cover={cover} today={today} size="lg" actions={<><Link href={`/trips/${tripId}/cover`} className={button.glass}><Icon name="image" size={16} />Alterar capa</Link><Link href={`/trips/${tripId}/edit`} className={button.glass}><Icon name="pencil" size={16} />Editar viagem</Link><Link href={`/trips/${tripId}/route`} className={button.primary}><Icon name="route" size={16} />Rota e destinos</Link></>} />}>
    <TripDashboard dashboard={dashboard} today={today} images={images} />
  </PageContainer>;
}
