import Link from "next/link";
import { Icon, travelModeIcons } from "@/components/ui/icons";
import { DestinationImage } from "@/components/ui/media";
import { button, EmptyState, SectionHeader } from "@/components/ui/page";
import type { PlaceImage } from "@/features/media/types";
import type { Trip } from "@/features/trips/types";
import { formatTripDateRange } from "@/features/trips/date";
import { buildAdjacencies, buildRoutePoints, isLegForPoints } from "../route-model";
import type { RouteData } from "../types";
import { DeleteStop } from "./destructive";
import { LegCard } from "./leg-card";
import { ReorderStops } from "./reorder";

const modes = { plane: "Avião", train: "Comboio", bus: "Autocarro", car: "Carro", ferry: "Ferry", other: "Outro" };

export function RouteOverview({ trip, route, images = {} }: { trip: Trip; route: RouteData; images?: Record<string, PlaceImage> }) {
  const lastStopId = [...route.stops].sort((a, b) => b.position - a.position)[0]?.id;
  const points = buildRoutePoints(trip, route.stops), adj = buildAdjacencies(points, route.legs), review = route.legs.filter((leg) => leg.reviewRequired);
  if (!route.stops.length) return <section><EmptyState icon="route" title="Ainda não existem destinos" description="Uma viagem pode ter um ou muitos destinos. Adicione a primeira estadia e continue a construir a sua rota, cidade a cidade." action={<Link href={`/trips/${trip.id}/destinations/new`} className={button.primary}><Icon name="plus" size={16} />Adicionar destino</Link>} /></section>;
  return <section aria-labelledby="route-title">
    <SectionHeader id="route-title" title={`${route.stops.length} ${route.stops.length === 1 ? "destino" : "destinos"}`} description="Rota multidestino · destinos e trajetos por ordem" />
    {review.length ? <div className="mt-5 rounded-card border border-warning/40 bg-warning-muted p-5"><h3 className="flex items-center gap-2 font-semibold text-warning"><Icon name="alert" size={18} />Transportes a rever</h3><p className="mt-1 text-sm text-warning">A ordem mudou; estes registos foram preservados sem alterar destinos.</p>{review.map((leg) => <Link key={leg.id} className="mt-3 block font-medium text-warning underline" href={`/trips/${trip.id}/transport/${leg.id}/edit`}>{modes[leg.mode]} · rever ligação</Link>)}</div> : null}
    <ol className="mt-6">{points.map((point, index) => {
      const stop = point.stopId ? route.stops.find((item) => item.id === point.stopId) : null;
      const next = adj[index];
      const impacted = stop ? route.legs.filter((leg) => leg.fromStopId === stop.id || leg.toStopId === stop.id).length : 0;
      return <li key={point.token}>
        {stop ? <article className="grid overflow-hidden rounded-card border border-border bg-card sm:grid-cols-[280px_minmax(0,1fr)]">
          <DestinationImage seed={stop.placeName} image={images[stop.id]} showCredit className="h-48 sm:h-full sm:min-h-52"><Link href={`/trips/${trip.id}/destinations/${stop.id}`} aria-label={`Abrir ${stop.placeName}`} className="absolute inset-0" /><div className="pointer-events-none relative flex items-start justify-between gap-2 p-4"><span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">Destino {stop.position}</span><Link href={`/trips/${trip.id}/destinations/${stop.id}/edit#imagem`} title="Substituir imagem" className="pointer-events-auto !min-h-0 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur hover:bg-black/70"><Icon name="image" size={12} />Imagem</Link></div></DestinationImage>
          <div className="min-w-0 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-lg font-semibold tracking-tight"><Link href={`/trips/${trip.id}/destinations/${stop.id}`} className="hover:text-link">{stop.placeName}</Link><span className="font-normal text-muted-foreground">, {stop.countryName}</span></h3><p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Icon name="calendar" size={15} />{formatTripDateRange(stop.arrivalDate, stop.departureDate)}</span>{stop.timezone ? <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={15} />{stop.timezone}</span> : null}</p></div><Link href={`/trips/${trip.id}/destinations/${stop.id}/edit`} className={button.secondary}><Icon name="pencil" size={15} />Editar</Link></div>
            {stop.notes ? <p className="mt-3 text-sm text-muted-foreground">{stop.notes}</p> : null}
            <DeleteStop tripId={trip.id} stopId={stop.id} name={stop.placeName} affected={impacted} />
          </div>
        </article> : <div className="flex items-center gap-4 rounded-card border border-dashed border-border bg-surface p-4"><span className="flex size-10 items-center justify-center rounded-xl bg-muted text-link"><Icon name="home" size={18} /></span><div><span className="text-xs font-semibold uppercase text-muted-foreground">Limite da rota</span><p className="font-semibold">{point.label}</p></div></div>}
        {next ? <LegBlock tripId={trip.id} adjacency={next} allLegs={route.legs} /> : null}
        {stop && stop.id === lastStopId ? <div className="ml-6 border-l-2 border-dashed border-input py-3 pl-6 sm:ml-10"><Link href={`/trips/${trip.id}/destinations/new?after=${stop.id}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-input px-3 text-xs font-medium text-muted-foreground hover:border-primary hover:text-foreground"><Icon name="plus" size={13} />Inserir destino depois de {stop.placeName}</Link></div> : null}
      </li>;
    })}</ol>
    {route.stops.length > 1 ? <div className="mt-7"><ReorderStops tripId={trip.id} stops={route.stops} legs={route.legs} /></div> : null}
  </section>;
}

function LegBlock({ tripId, adjacency, allLegs }: { tripId: string; adjacency: ReturnType<typeof buildAdjacencies>[number]; allLegs: RouteData["legs"] }) {
  const historical = allLegs.filter((leg) => isLegForPoints(leg, adjacency.from, adjacency.to) && leg.status === "cancelled");
  const leg = adjacency.activeLeg;
  return <div className="relative ml-6 border-l-2 border-dashed border-input py-4 pl-6 sm:ml-10">
    <span aria-hidden="true" className={`absolute -left-[17px] top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border ${leg ? "border-primary/50 bg-primary-muted text-link" : "border-warning/50 bg-warning-muted text-warning"}`}><Icon name={leg ? travelModeIcons[leg.mode] : "plus"} size={15} /></span>
    <div className={`rounded-2xl border p-4 text-sm ${leg ? "border-border bg-surface" : "border-warning/40 bg-warning-muted"}`}>
      <p className="text-xs font-medium text-muted-foreground">{adjacency.from.label} → {adjacency.to.label}</p>
      {leg ? <LegCard tripId={tripId} leg={leg} fromLabel={adjacency.from.label} toLabel={adjacency.to.label} />
        : <div className="mt-2"><p className="font-medium text-warning">Transporte por planear</p><Link href={`/trips/${tripId}/transport/new?from=${encodeURIComponent(adjacency.from.token)}&to=${encodeURIComponent(adjacency.to.token)}`} className="mt-2 inline-flex items-center gap-1 font-medium text-warning underline"><Icon name="plus" size={14} />Adicionar transporte</Link></div>}
      {historical.length ? <p className="mt-2 text-xs text-muted-foreground">{historical.length} transporte(s) cancelado(s) preservado(s)</p> : null}
    </div>
    {adjacency.from.stopId ? <Link href={`/trips/${tripId}/destinations/new?after=${adjacency.from.stopId}`} className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-input px-3 text-xs font-medium text-muted-foreground hover:border-primary hover:text-foreground"><Icon name="plus" size={13} />Inserir destino aqui</Link> : null}
  </div>;
}
