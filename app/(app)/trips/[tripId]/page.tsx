import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { BackLink, button, IconBadge, Notice, PageContainer } from "@/components/ui/page";
import { RouteOverview } from "@/features/route/components/overview";
import { TripDashboard } from "@/features/dashboard/components/trip-dashboard";
import { getTripDashboard } from "@/features/dashboard/queries";
import { DeleteTripForm, TripLifecycleAction } from "@/features/trips/components/trip-actions";
import { todayInLisbon } from "@/features/trips/lifecycle";
import { tripIdSchema } from "@/features/trips/schemas";

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!tripIdSchema.safeParse(tripId).success) notFound();
  const today = todayInLisbon();
  const dashboard = await getTripDashboard(tripId, today);
  if (!dashboard) notFound();
  return <PageContainer>
    <div className="mb-4"><BackLink href="/trips">Todas as viagens</BackLink></div>
    <TripDashboard dashboard={dashboard} today={today} actions={<><Link href={`/trips/${tripId}/settings`} className={button.glass}><Icon name="settings" size={16} />Definições</Link><Link href={`/trips/${tripId}/edit`} className={button.glass}><Icon name="pencil" size={16} />Editar viagem</Link></>} />
    <div id="route" className="scroll-mt-6">{dashboard.route.status === "ready" ? <RouteOverview trip={dashboard.trip} route={dashboard.route.data} /> : <div className="mt-8"><Notice tone="danger" role="alert">Não foi possível carregar a rota. Atualize a página para tentar novamente.</Notice></div>}</div>
    <section aria-labelledby="management-title" className="mt-12 rounded-card border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3"><IconBadge icon="settings" tone="neutral" size="sm" /><h2 id="management-title" className="text-xl font-semibold">Gerir viagem</h2></div>
      <div className="mt-5 space-y-5"><TripLifecycleAction tripId={tripId} archived={dashboard.trip.archivedAt !== null} /><DeleteTripForm tripId={tripId} tripName={dashboard.trip.name} /></div>
    </section>
  </PageContainer>;
}
