import Link from "next/link";
import { notFound } from "next/navigation";
import { IconBadge, Notice, PageContainer } from "@/components/ui/page";
import { TripPreferencesForm } from "@/features/settings/components/forms";
import { DeleteTripForm, TripLifecycleAction } from "@/features/trips/components/trip-actions";
import { getTripPreferenceData } from "@/features/settings/queries";
import { TripHero } from "@/features/trips/components/trip-hero";
import { getOwnedTrip } from "@/features/trips/queries";

export default async function TripSettingsPage({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]), [trip, preferences] = await Promise.all([getOwnedTrip(tripId), getTripPreferenceData(tripId)]);
  if (!trip || !preferences) notFound();
  return <PageContainer width="medium" hero={<TripHero trip={trip} active="settings" title="Definições" description="Preferências desta viagem." />}>
    {query.saved ? <div className="mt-4"><Notice tone="success">Preferências guardadas.</Notice></div> : null}
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <section className="rounded-feature border border-border bg-card p-5 sm:p-8"><TripPreferencesForm trip={trip} preferences={preferences} /></section>
      <div className="space-y-4">
        <section className="rounded-feature border border-border bg-card p-5 sm:p-6"><div className="flex items-center gap-3"><IconBadge icon="pencil" size="sm" /><h2 className="text-xl font-semibold">Dados gerais</h2></div><p className="mt-3 text-sm text-muted-foreground">Nome, datas, origem, regresso, viajantes e orçamento.</p><Link href={`/trips/${tripId}/edit`} className="mt-4 inline-block font-semibold text-link underline">Editar dados da viagem</Link></section>
        <section id="management" aria-labelledby="management-title" className="scroll-mt-6 rounded-feature border border-border bg-card p-5 sm:p-6"><div className="flex items-center gap-3"><IconBadge icon="archive" tone="neutral" size="sm" /><h2 id="management-title" className="text-xl font-semibold">Gerir viagem</h2></div><p className="mt-3 text-sm text-muted-foreground">Arquive a viagem para a esconder das ativas, ou elimine-a de forma permanente.</p><div className="mt-5 space-y-5"><TripLifecycleAction tripId={tripId} archived={trip.archivedAt !== null} /><DeleteTripForm tripId={tripId} tripName={trip.name} /></div></section>
      </div>
    </div>
  </PageContainer>;
}
