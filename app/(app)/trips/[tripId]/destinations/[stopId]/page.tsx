import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, travelModeIcons } from "@/components/ui/icons";
import { Badge, button, EmptyState, HeroChip, IconBadge, PageContainer, PageHero, Panel, SectionHeader } from "@/components/ui/page";
import { expenseRows } from "@/features/finance/budget";
import { getOwnedFinance } from "@/features/finance/queries";
import { listOwnedItinerary } from "@/features/itinerary/queries";
import type { PlaceImage } from "@/features/media/types";
import { reservationStatusLabels, reservationTypeIcons, reservationTypeLabels } from "@/features/planning/labels";
import { getOwnedPlanning } from "@/features/planning/queries";
import { resolveStopImages } from "@/features/route/images";
import { getOwnedRoute } from "@/features/route/queries";
import { uuidSchema } from "@/features/route/schemas";
import type { TravelLeg } from "@/features/route/types";
import { formatTripDate, formatTripDateRange } from "@/features/trips/date";
import { formatMinorUnits } from "@/features/trips/money";
import { getOwnedTrip } from "@/features/trips/queries";

const modes = { plane: "Avião", train: "Comboio", bus: "Autocarro", car: "Carro", ferry: "Ferry", other: "Outro" };
const statuses = { planned: "Planeado", booked: "Reservado", paid: "Pago", cancelled: "Cancelado", completed: "Concluído" };
const nights = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export default async function DestinationPage({ params }: { params: Promise<{ tripId: string; stopId: string }> }) {
  const { tripId, stopId } = await params;
  if (!uuidSchema.safeParse(tripId).success || !uuidSchema.safeParse(stopId).success) notFound();
  const [trip, route, items, finance, planning] = await Promise.all([getOwnedTrip(tripId), getOwnedRoute(tripId), listOwnedItinerary(tripId), getOwnedFinance(tripId), getOwnedPlanning(tripId)]);
  const ordered = route ? [...route.stops].sort((a, b) => a.position - b.position) : [];
  const index = ordered.findIndex((item) => item.id === stopId);
  const stop = ordered[index];
  if (!trip || !route || !stop) notFound();
  const image = (await resolveStopImages([stop]).catch((): Record<string, PlaceImage> => ({})))[stop.id] ?? null;
  const legs = route.legs.filter((leg) => leg.status !== "cancelled");
  const arrival = legs.find((leg) => leg.toStopId === stop.id) ?? (index === 0 ? legs.find((leg) => leg.fromKind === "origin_boundary") : undefined);
  const departure = legs.find((leg) => leg.fromStopId === stop.id) ?? (index === ordered.length - 1 ? legs.find((leg) => leg.toKind === "return_boundary") : undefined);
  const activities = (items ?? []).filter((item) => item.stopId === stop.id || (!item.stopId && item.tripDate >= stop.arrivalDate && item.tripDate <= stop.departureDate)).sort((a, b) => `${a.tripDate} ${a.startLocalTime ?? "99"}`.localeCompare(`${b.tripDate} ${b.startLocalTime ?? "99"}`));
  const expenses = finance ? expenseRows(finance).filter((row) => row.stopId === stop.id) : [];
  const expenseTotal = expenses.reduce((sum, row) => sum + row.valueMinor, 0n);
  const reservations = (planning?.reservations ?? []).filter((item) => item.stopId === stop.id && !item.archivedAt);
  const money = (value: bigint) => formatMinorUnits(value.toString(), trip.baseCurrency) ?? "—";
  const previous = ordered[index - 1], next = ordered[index + 1];

  return <PageContainer hero={<PageHero seed={stop.placeName} image={image} size="lg" back={{ href: `/trips/${tripId}/route`, label: "Rota e destinos" }}
    eyebrow={<><Icon name="mapPin" size={14} />Destino {index + 1} de {ordered.length} · {stop.countryName}</>}
    title={stop.placeName}
    meta={<><HeroChip icon="calendar">{formatTripDateRange(stop.arrivalDate, stop.departureDate)}</HeroChip><HeroChip icon="sun">{nights(stop.arrivalDate, stop.departureDate)} noites</HeroChip>{stop.timezone ? <HeroChip icon="clock">{stop.timezone}</HeroChip> : null}</>}
    actions={<><Link href={`/trips/${tripId}/destinations/${stop.id}/edit#imagem`} className={button.glass}><Icon name="image" size={16} />Alterar imagem</Link><Link href={`/trips/${tripId}/destinations/${stop.id}/edit`} className={button.primary}><Icon name="pencil" size={16} />Editar destino</Link></>} />}>

    <div className="grid gap-4 md:grid-cols-2">
      <LegCard title="Chegada" leg={arrival} tripId={tripId} from={previous?.placeName ?? trip.originLabel ?? "Origem"} />
      <LegCard title="Partida" leg={departure} tripId={tripId} from={next?.placeName ?? trip.returnLabel ?? "Regresso"} departing />
    </div>
    {stop.notes ? <Panel className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas</p><p className="mt-2 whitespace-pre-wrap">{stop.notes}</p></Panel> : null}

    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel aria-labelledby="stop-activities">
        <SectionHeader id="stop-activities" title="Itinerário" description={`${activities.length} atividade(s) em ${stop.placeName}`} action={<Link href={`/trips/${tripId}/itinerary/new?date=${stop.arrivalDate}`} className={`${button.secondary} min-h-10`}><Icon name="plus" size={15} />Atividade</Link>} />
        {activities.length ? <ol className="mt-4 space-y-2">{activities.map((item) => <li key={item.id}><Link href={`/trips/${tripId}/itinerary/${item.id}/edit`} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-3 hover:border-primary/50"><span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-primary-muted py-2 text-link"><span className="text-lg font-bold leading-none">{Number(item.tripDate.slice(8))}</span><span className="mt-1 text-[11px] uppercase">{formatTripDate(item.tripDate).split(" ")[1]?.replace(".", "")}</span></span><span className="min-w-0"><strong className="block truncate">{item.title}</strong><span className="text-sm text-muted-foreground">{item.startLocalTime ?? "A qualquer hora"}{item.placeName ? ` · ${item.placeName}` : ""}</span></span></Link></li>)}</ol>
          : <EmptyState className="mt-4" icon="calendar" title="Sem atividades" description="Planeie o que quer fazer neste destino." />}
      </Panel>
      <div className="space-y-4">
        <Panel aria-labelledby="stop-expenses">
          <SectionHeader id="stop-expenses" title="Gastos" description={expenses.length ? `Total previsto: ${money(expenseTotal)}` : "Ainda sem gastos associados"} action={<Link href={`/trips/${tripId}/finance#categories-title`} className={`${button.secondary} min-h-10`}><Icon name="plus" size={15} />Gasto</Link>} />
          {expenses.length ? <ul className="mt-4 space-y-1.5 text-sm">{expenses.map((row) => <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5"><span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${row.paid ? "bg-success" : "bg-input"}`} /><span className="truncate">{row.title}</span><span className="sr-only">{row.paid ? "Pago" : "Por pagar"}</span></span><span className="font-medium tabular-nums">{money(row.valueMinor)}</span></li>)}</ul> : null}
        </Panel>
        <Panel aria-labelledby="stop-reservations">
          <SectionHeader id="stop-reservations" title="Reservas" action={<Link href={`/trips/${tripId}/planning/reservations/new`} className={`${button.secondary} min-h-10`}><Icon name="plus" size={15} />Reserva</Link>} />
          {reservations.length ? <ul className="mt-4 space-y-2">{reservations.map((item) => <li key={item.id}><Link href={`/trips/${tripId}/planning/reservations/${item.id}/edit`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 hover:border-primary/50"><IconBadge icon={reservationTypeIcons[item.type]} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.title}</span><span className="text-xs text-muted-foreground">{reservationTypeLabels[item.type]}</span></span><Badge tone={item.status === "booked" ? "success" : "neutral"}>{reservationStatusLabels[item.status]}</Badge></Link></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Sem reservas associadas a este destino.</p>}
        </Panel>
      </div>
    </div>

    <nav aria-label="Outros destinos" className="mt-8 flex flex-wrap justify-between gap-3">
      {previous ? <Link href={`/trips/${tripId}/destinations/${previous.id}`} className={button.secondary}><Icon name="arrowLeft" size={16} />{previous.placeName}</Link> : <span />}
      {next ? <Link href={`/trips/${tripId}/destinations/${next.id}`} className={button.secondary}>{next.placeName}<Icon name="arrowRight" size={16} /></Link> : <Link href={`/trips/${tripId}/destinations/new?after=${stop.id}`} className={button.primary}><Icon name="plus" size={16} />Adicionar destino depois</Link>}
    </nav>
  </PageContainer>;
}

function LegCard({ title, leg, tripId, from, departing = false }: { title: string; leg?: TravelLeg; tripId: string; from: string; departing?: boolean }) {
  return <Panel>
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title} · {departing ? `para ${from}` : `de ${from}`}</p>
    {leg ? <div className="mt-3 flex items-start gap-3"><span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-link"><Icon name={travelModeIcons[leg.mode]} size={18} /></span><div className="min-w-0 flex-1"><p className="flex flex-wrap items-center gap-2 font-semibold">{modes[leg.mode]}<Badge tone={leg.status === "booked" || leg.status === "paid" ? "success" : "neutral"}>{statuses[leg.status]}</Badge></p><p className="mt-0.5 text-sm text-muted-foreground">{leg.departureDate ?? "Data por definir"}{leg.departureTime ? ` às ${leg.departureTime}` : ""}{leg.operator ? ` · ${leg.operator}` : ""}</p></div><Link href={`/trips/${tripId}/transport/${leg.id}/edit`} className="text-sm font-medium text-link underline">Editar</Link></div>
      : <p className="mt-3 text-sm text-muted-foreground">Transporte por planear. <Link href={`/trips/${tripId}/route`} className="font-medium text-link underline">Planear na rota</Link></p>}
  </Panel>;
}
