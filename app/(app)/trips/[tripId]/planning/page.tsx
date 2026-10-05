import Link from "next/link";
import { notFound } from "next/navigation";
import { ChartLegend, DonutChart, RingProgress } from "@/components/ui/charts";
import { Icon } from "@/components/ui/icons";
import { Badge, button, EmptyState, IconBadge, PageContainer, Panel, SectionHeader } from "@/components/ui/page";
import { Starter } from "@/features/planning/components/check-actions";
import { ChecklistRow } from "@/features/planning/components/checklist-row";
import { deriveDueState, safeBookingUrl } from "@/features/planning/helpers";
import { checklistCategoryLabels, dueStateLabels, reservationStatusLabels, reservationTypeIcons, reservationTypeLabels } from "@/features/planning/labels";
import { getOwnedPlanning } from "@/features/planning/queries";
import { TripHero } from "@/features/trips/components/trip-hero";
import { todayInLisbon } from "@/features/trips/lifecycle";
import { getOwnedTrip } from "@/features/trips/queries";

export default async function PlanningPage({ params }: PageProps<"/trips/[tripId]/planning">) {
  const { tripId } = await params, [trip, data] = await Promise.all([getOwnedTrip(tripId), getOwnedPlanning(tripId)]);
  if (!trip || !data) notFound();
  const today = todayInLisbon();
  const pending = data.checklist.filter((item) => !item.isCompleted);
  const done = data.checklist.filter((item) => item.isCompleted);
  const reservations = data.reservations.filter((item) => !item.archivedAt);
  const statusSegments = (["booked", "planned", "completed", "cancelled"] as const).map((status, index) => ({ label: reservationStatusLabels[status], value: reservations.filter((item) => item.status === status).length, display: String(reservations.filter((item) => item.status === status).length), color: ["var(--chart-3)", "var(--chart-2)", "var(--chart-4)", "var(--chart-7)"][index] }));
  const meta = (item: (typeof data.checklist)[number]) => `${checklistCategoryLabels[item.category]}${item.dueDate ? ` · ${item.dueDate} · ${dueStateLabels[deriveDueState(item, today)]}` : ""}${item.needsReview ? " · Rever destino" : ""}`;

  return <PageContainer width="medium" hero={<TripHero trip={trip} active="planning" title="Planeamento" description="A checklist da viagem e as reservas, num só lugar." />}>
    <section aria-labelledby="checklist-title" className="scroll-mt-6">
      <Panel className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-5">
          <RingProgress size={96} thickness={10} color="var(--chart-1)" percent={data.checklist.length ? (done.length / data.checklist.length) * 100 : 0} label="Progresso da checklist" />
          <div className="min-w-0 flex-1"><h2 id="checklist-title" className="text-2xl font-light tracking-tight">Checklist</h2><p className="mt-1 text-sm text-muted-foreground">{pending.length} por fazer · {done.length} concluída(s)</p></div>
          <div className="flex flex-wrap gap-2">{!data.checklist.length ? <Starter tripId={tripId} /> : null}<Link href={`/trips/${tripId}/planning/checklist/new`} className={button.primary}><Icon name="plus" size={16} />Adicionar tarefa</Link></div>
        </div>

        <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Por fazer</h3>
        {pending.length ? <ul className="mt-3 space-y-2">{pending.map((item) => <ChecklistRow key={item.id} tripId={tripId} id={item.id} priority={item.priority} title={item.title} meta={meta(item)} done={false} />)}</ul>
          : data.checklist.length ? <p className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground"><Icon name="check" size={18} />Tudo feito! Não há tarefas por fazer.</p>
          : <EmptyState className="mt-3" icon="checklist" title="A checklist está vazia" description="Use a checklist inicial ou adicione as suas próprias tarefas." />}

        {done.length ? <details className="group mt-6 rounded-2xl border border-border bg-surface p-4">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><Icon name="archive" size={16} className="text-muted-foreground" />Concluídas ({done.length})</span><Icon name="chevronRight" size={16} className="text-muted-foreground transition-transform group-open:rotate-90" /></summary>
          <ul className="mt-3 space-y-2">{done.map((item) => <ChecklistRow key={item.id} tripId={tripId} id={item.id} priority={item.priority} title={item.title} meta={meta(item)} done />)}</ul>
          <p className="mt-3 text-xs text-muted-foreground">Toque numa tarefa concluída para a voltar a abrir.</p>
        </details> : null}
      </Panel>
    </section>

    <section aria-labelledby="reservations-title" className="mt-10">
      <SectionHeader id="reservations-title" title="Reservas" description={`${reservations.length} ativa(s)`} action={<Link href={`/trips/${tripId}/planning/reservations/new`} className={button.primary}><Icon name="plus" size={16} />Adicionar reserva</Link>} />
      {reservations.length ? <Panel className="mt-4"><div className="flex flex-wrap items-center gap-6"><DonutChart size={120} thickness={14} label={`Reservas por estado: ${statusSegments.map((item) => `${item.label} ${item.display}`).join(", ")}`} segments={statusSegments} center={<><span className="text-2xl font-semibold">{reservations.length}</span><span className="text-xs text-muted-foreground">reservas</span></>} /><ChartLegend segments={statusSegments} className="min-w-40 flex-1" /></div></Panel> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">{reservations.map((reservation) => <article key={reservation.id} className="flex gap-4 rounded-card border border-border bg-card p-4 sm:p-5">
        <IconBadge icon={reservationTypeIcons[reservation.type]} tone={reservation.status === "booked" || reservation.status === "completed" ? "success" : "primary"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase text-muted-foreground">{reservationTypeLabels[reservation.type]}</p><Badge tone={reservation.status === "booked" ? "success" : reservation.status === "cancelled" ? "neutral" : "primary"}>{reservationStatusLabels[reservation.status]}</Badge></div>
          <h3 className="mt-1.5 font-semibold">{reservation.title}</h3>
          {reservation.startDate ? <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Icon name="calendar" size={14} />{reservation.startDate}{reservation.startTime ? ` · ${reservation.startTime}` : ""}{reservation.location ? ` · ${reservation.location}` : ""}</p> : null}
          {reservation.confirmationCode ? <code className="mt-2 block select-all break-all rounded-xl bg-surface p-2 text-sm">{reservation.confirmationCode}</code> : null}
          {reservation.needsReview ? <p className="mt-2 text-sm text-warning">Rever associação ou datas.</p> : null}
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">{reservation.bookingUrl && safeBookingUrl(reservation.bookingUrl) ? <a href={safeBookingUrl(reservation.bookingUrl)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link underline">Abrir reserva<Icon name="external" size={14} /></a> : null}<Link href={`/trips/${tripId}/planning/reservations/${reservation.id}/edit`} className="text-link underline">Editar</Link></div>
        </div>
      </article>)}</div>
      {!reservations.length ? <EmptyState className="mt-4" icon="ticket" title="Ainda não há reservas" description="Mantenha hotéis, restaurantes e referências de reserva num só lugar." /> : null}
    </section>
  </PageContainer>;
}
