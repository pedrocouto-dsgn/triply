import Link from "next/link";
import { notFound } from "next/navigation";
import { IconBadge, Notice, PageContainer } from "@/components/ui/page";
import { TripPreferencesForm } from "@/features/settings/components/forms";
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
      <section className="rounded-feature border border-border bg-card p-5 sm:p-6"><div className="flex items-center gap-3"><IconBadge icon="pencil" size="sm" /><h2 className="text-xl font-semibold">Dados gerais e gestão</h2></div><p className="mt-3 text-sm text-muted-foreground">Nome, datas, origem, regresso, arquivo e eliminação continuam nas superfícies canónicas da viagem.</p><div className="mt-4 flex flex-wrap gap-4"><Link href={`/trips/${tripId}/edit`} className="font-semibold text-link underline">Editar dados da viagem</Link><Link href={`/trips/${tripId}#management-title`} className="font-semibold text-link underline">Gerir viagem</Link></div></section>
    </div>
  </PageContainer>;
}
