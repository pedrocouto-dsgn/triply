import Link from "next/link";
import { notFound } from "next/navigation";
import { BarList, ChartLegend, DonutChart, RingProgress } from "@/components/ui/charts";
import { Icon } from "@/components/ui/icons";
import { Badge, button, EmptyState, IconBadge, PageContainer, Panel, SectionHeader } from "@/components/ui/page";
import { ToggleTask, Starter } from "@/features/planning/components/check-actions";
import { deriveDueState, safeBookingUrl } from "@/features/planning/helpers";
import { checklistCategoryLabels, dueStateLabels, reservationStatusLabels, reservationTypeIcons, reservationTypeLabels } from "@/features/planning/labels";
import { getOwnedPlanning } from "@/features/planning/queries";
import { todayInLisbon } from "@/features/trips/lifecycle";
import { TripHero } from "@/features/trips/components/trip-hero";
import { getOwnedTrip } from "@/features/trips/queries";

export default async function PlanningPage({ params }: PageProps<"/trips/[tripId]/planning">) {
  const { tripId } = await params, [trip, data] = await Promise.all([getOwnedTrip(tripId), getOwnedPlanning(tripId)]);
  if (!trip || !data) notFound();
  const today = todayInLisbon();
  const reservations = data.reservations.filter((item) => !item.archivedAt);
  const done = data.checklist.filter((item) => item.isCompleted).length;
  const statusSegments = (["booked", "planned", "completed", "cancelled"] as const).map((status, index) => ({ label: reservationStatusLabels[status], value: reservations.filter((item) => item.status === status).length, display: String(reservations.filter((item) => item.status === status).length), color: ["var(--chart-3)", "var(--chart-2)", "var(--chart-4)", "var(--chart-7)"][index] }));
  const categories = [...new Set(data.checklist.map((item) => item.category))].map((category) => {
    const items = data.checklist.filter((item) => item.category === category), complete = items.filter((item) => item.isCompleted).length;
    return { label: checklistCategoryLabels[category], value: complete, display: `${complete}/${items.length}`, total: items.length };
  });
  return <PageContainer hero={<TripHero trip={trip} active="planning" title="Planeamento" description="Reservas e checklist para preparar a viagem." />}>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Panel aria-labelledby="reservation-chart-title"><SectionHeader id="reservation-chart-title" as="h3" title="Reservas por estado" description={`${reservations.length} ativa(s)`} /><div className="mt-5 flex flex-wrap items-center gap-6"><DonutChart size={132} thickness={15} label={`Reservas por estado: ${statusSegments.map((item) => `${item.label} ${item.display}`).join(", ")}`} segments={statusSegments} center={<><span className="text-2xl font-semibold">{reservations.length}</span><span className="text-xs text-muted-foreground">reservas</span></>} /><ChartLegend segments={statusSegments} className="min-w-36 flex-1" /></div></Panel>
      <Panel aria-labelledby="checklist-chart-title"><SectionHeader id="checklist-chart-title" as="h3" title="Progresso da checklist" description={`${done} de ${data.checklist.length} concluídas`} /><div className="mt-5 flex flex-wrap items-center gap-6"><RingProgress size={132} thickness={14} color="var(--chart-3)" percent={data.checklist.length ? (done / data.checklist.length) * 100 : 0} label="Progresso da checklist" />{categories.length ? <BarList className="min-w-40 flex-1" items={categories.slice(0, 4)} max={Math.max(...categories.map((item) => item.total))} /> : <p className="flex-1 text-sm text-muted-foreground">Ainda não há tarefas.</p>}</div></Panel>
    </div>
    <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
      <section aria-labelledby="reservations-title" className="min-w-0">
        <SectionHeader id="reservations-title" title="Reservas" action={<Link href={`/trips/${tripId}/planning/reservations/new`} className={button.primary}><Icon name="plus" size={16} />Adicionar reserva</Link>} />
        <div className="mt-4 grid gap-3">{reservations.map((reservation) => <article key={reservation.id} className="flex gap-4 rounded-card border border-border bg-card p-4 sm:p-5">
          <IconBadge icon={reservationTypeIcons[reservation.type]} tone={reservation.status === "booked" || reservation.status === "completed" ? "success" : "primary"} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase text-muted-foreground">{reservationTypeLabels[reservation.type]}</p><Badge tone={reservation.status === "booked" ? "success" : reservation.status === "cancelled" ? "neutral" : "primary"}>{reservationStatusLabels[reservation.status]}</Badge></div>
            <h3 className="mt-1.5 font-semibold">{reservation.title}</h3>
            {reservation.startDate ? <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Icon name="calendar" size={14} />{reservation.startDate}{reservation.startTime ? ` · ${reservation.startTime}` : ""}{reservation.location ? ` · ${reservation.location}` : ""}</p> : null}
            {reservation.confirmationCode ? <code className="mt-2 block select-all break-all rounded-xl bg-surface p-2 text-sm">{reservation.confirmationCode}</code> : null}
            {reservation.needsReview ? <p className="mt-2 text-sm text-warning">Rever associação ou datas.</p> : null}
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">{reservation.bookingUrl && safeBookingUrl(reservation.bookingUrl) ? <a href={safeBookingUrl(reservation.bookingUrl)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link underline">Abrir reserva<Icon name="external" size={14} /></a> : null}<Link href={`/trips/${tripId}/planning/reservations/${reservation.id}/edit`} className="text-link underline">Editar</Link></div>
          </div>
        </article>)}{!data.reservations.length ? <EmptyState icon="ticket" title="Ainda não há reservas" description="Mantenha hotéis, restaurantes e referências de reserva num só lugar." /> : null}</div>
      </section>
      <section aria-labelledby="checklist-title" className="min-w-0">
        <SectionHeader id="checklist-title" title="Checklist" action={<div className="flex flex-wrap gap-2"><Starter tripId={tripId} /><Link href={`/trips/${tripId}/planning/checklist/new`} className={button.primary}><Icon name="plus" size={16} />Adicionar tarefa</Link></div>} />
        <div className="mt-4 space-y-2">{data.checklist.map((item) => {
          const due = deriveDueState(item, today);
          return <article key={item.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${item.isCompleted ? "border-border bg-surface" : "border-border bg-card"}`}>
            <div className="flex min-w-0 items-start gap-3"><span aria-hidden="true" className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${item.isCompleted ? "border-success bg-success text-background" : "border-input"}`}>{item.isCompleted ? <Icon name="check" size={14} strokeWidth={2.6} /> : null}</span><div className="min-w-0"><p className={`font-semibold ${item.isCompleted ? "text-muted-foreground line-through" : ""}`}>{item.title}</p><p className="mt-0.5 text-sm text-muted-foreground">{checklistCategoryLabels[item.category]}{item.dueDate ? ` · ${item.dueDate} · ${dueStateLabels[due]}` : ""}{item.needsReview ? " · Rever destino" : ""}</p><Link href={`/trips/${tripId}/planning/checklist/${item.id}/edit`} className="text-xs text-link underline">Editar</Link></div></div>
            <ToggleTask tripId={tripId} itemId={item.id} completed={item.isCompleted} />
          </article>;
        })}{!data.checklist.length ? <EmptyState icon="checklist" title="A checklist está vazia" description="Use a checklist inicial ou adicione as suas próprias tarefas." /> : null}</div>
      </section>
    </div>
  </PageContainer>;
}
