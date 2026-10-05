import Link from "next/link";
import { ChartLegend, DonutChart } from "@/components/ui/charts";
import { Icon } from "@/components/ui/icons";
import { DestinationImage } from "@/components/ui/media";
import { button, EmptyState, HeroChip, PageContainer, PageHero, SectionHeader, StatTile } from "@/components/ui/page";
import { getTripCovers } from "@/features/route/images";
import { formatTripDateRange } from "@/features/trips/date";
import { countdownText, TripCard } from "@/features/trips/components/trip-card";
import { StatusMessage } from "@/features/trips/components/status-message";
import { deriveTripLifecycle, lifecycleLabels, sortActiveTrips, todayInLisbon } from "@/features/trips/lifecycle";
import { listOwnedTrips } from "@/features/trips/queries";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TripsPage({ searchParams }: PageProps<"/trips">) {
  const [trips, query] = await Promise.all([listOwnedTrips(), searchParams]);
  const today = todayInLisbon();
  const activeTrips = sortActiveTrips(trips.filter((trip) => trip.archivedAt === null), today);
  const archivedTrips = trips.filter((trip) => trip.archivedAt !== null).sort((left, right) => (right.archivedAt ?? "").localeCompare(left.archivedAt ?? ""));
  const status = firstValue(query.archived) ? "archived" : firstValue(query.deleted) ? "deleted" : undefined;
  const featured = activeTrips.find((trip) => deriveTripLifecycle(trip, today) !== "past") ?? null;
  const counts = (["ongoing", "upcoming", "past", "archived"] as const).map((lifecycle) => ({ lifecycle, count: trips.filter((trip) => deriveTripLifecycle(trip, today) === lifecycle).length }));
  const covers = await getTripCovers(trips.map((trip) => trip.id)).catch(() => ({} as Awaited<ReturnType<typeof getTripCovers>>));
  const statusSegments = counts.map(({ lifecycle, count }) => ({ label: lifecycleLabels[lifecycle], value: count, display: String(count) }));

  return (
    <PageContainer hero={trips.length && featured ? <PageHero seed={featured.name} image={covers[featured.id]} size="md"
      eyebrow={<><Icon name="sparkles" size={14} />Planeie. Organize. Parta.</>} title="As suas viagens"
      description={<>Próxima: <strong className="font-semibold text-foreground">{featured.name}</strong> · {formatTripDateRange(featured.startDate, featured.endDate)}</>}
      meta={<HeroChip icon="clock">{countdownText(featured, today)}</HeroChip>}
      actions={<Link href={`/trips/${featured.id}/cover`} className={button.glass}><Icon name="image" size={16} />Alterar capa</Link>} /> : undefined}>
      <div className="mb-6 empty:hidden"><StatusMessage kind={status} /></div>
      {trips.length === 0 ? <section>
        <DestinationImage seed="Primeira viagem" className="rounded-feature border border-border">
          <div className="flex min-h-[420px] flex-col items-start justify-end p-6 text-white sm:p-12">
            <p className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur">O mundo está à sua espera</p>
            <h1 className="mt-5 text-4xl font-light tracking-tight sm:text-6xl">Ainda não tem viagens.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/80">Crie o espaço da sua viagem agora. Depois poderá adicionar todos os destinos pela ordem certa.</p>
            <Link href="/trips/new" className={`${button.primary} mt-7`}><Icon name="plus" size={16} />Criar primeira viagem</Link>
          </div>
        </DestinationImage>
      </section> : <div className="space-y-10">
        <section aria-labelledby={featured ? "trip-status-title" : "active-trips-title"}>
          {featured ? null : <div className="mb-4 rounded-feature border border-border bg-card p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-link">Planeie. Organize. Parta.</p><h1 id="active-trips-title" className="mt-3 text-4xl font-light tracking-tight">As suas viagens</h1><p className="mt-3 text-sm text-muted-foreground">Não há viagens futuras. Crie uma nova para começar a planear.</p></div>}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <section aria-labelledby="trip-status-title" className="rounded-card border border-border bg-card p-6">
              <h2 id="trip-status-title" className="font-semibold">Estado das viagens</h2>
              <div className="mt-5 flex flex-wrap items-center gap-6"><DonutChart size={136} thickness={16} label={`Estado das viagens: ${statusSegments.map((segment) => `${segment.label} ${segment.display}`).join(", ")}`} segments={statusSegments} center={<><span className="text-2xl font-semibold">{trips.length}</span><span className="text-xs text-muted-foreground">{trips.length === 1 ? "viagem" : "viagens"}</span></>} /><ChartLegend segments={statusSegments} className="min-w-36 flex-1" /></div>
            </section>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"><StatTile icon="compass" label="Viagens ativas" value={activeTrips.length} /><StatTile icon="plane" tone="success" label="Próximas e a decorrer" value={counts[0].count + counts[1].count} /><StatTile icon="archive" tone="neutral" label="Arquivadas" value={archivedTrips.length} /></div>
          </div>
          <div className="mt-8"><SectionHeader title="Viagens ativas" description={`${activeTrips.length} ${activeTrips.length === 1 ? "viagem ativa" : "viagens ativas"}`} action={<Link href="/trips/new" className={button.primary}><Icon name="plus" size={16} />Criar viagem</Link>} /></div>
          {activeTrips.length === 0 ? <EmptyState className="mt-5" icon="compass" title="Não existem viagens ativas" description="Pode restaurar uma viagem arquivada ou criar uma nova." action={<Link href="/trips/new" className={button.primary}>Criar viagem</Link>} /> : <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{activeTrips.map((trip) => <TripCard key={trip.id} trip={trip} today={today} image={covers[trip.id]} />)}</div>}
        </section>
        <section aria-labelledby="archived-trips-title" className="border-t border-border pt-8">
          <SectionHeader id="archived-trips-title" title="Arquivadas" description="Continuam privadas e podem ser restauradas ou eliminadas." />
          {archivedTrips.length === 0 ? <p className="mt-5 rounded-card border border-dashed border-border bg-surface p-5 text-sm text-muted-foreground">Não existem viagens arquivadas.</p> : <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{archivedTrips.map((trip) => <TripCard key={trip.id} trip={trip} today={today} image={covers[trip.id]} />)}</div>}
        </section>
      </div>}
    </PageContainer>
  );
}
