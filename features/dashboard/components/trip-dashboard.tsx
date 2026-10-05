import Link from "next/link";
import type { ReactNode } from "react";
import { BarList, chartColors, ChartLegend, DonutChart, RingProgress } from "@/components/ui/charts";
import { Icon, travelModeIcons, type IconName } from "@/components/ui/icons";
import { IconBadge, StatTile, type Tone } from "@/components/ui/page";
import { categoryTotals, expenseRows } from "@/features/finance/budget";
import type { PlaceImage } from "@/features/media/types";
import { checklistCategoryLabels } from "@/features/planning/labels";
import { ChecklistRow } from "@/features/planning/components/checklist-row";
import { RouteCarousel } from "@/features/route/components/route-carousel";
import { deriveDocumentValidity } from "@/features/documents/helpers";
import { documentTypeLabels } from "@/features/documents/labels";
import { formatMinorUnits } from "@/features/trips/money";
import { buildAttention, financialHealth, routeContext, upcomingItinerary } from "../aggregation";
import type { DashboardData, SectionResult } from "../types";

const travelModeLabels = { plane: "Avião", train: "Comboio", bus: "Autocarro", car: "Carro", ferry: "Ferry", other: "Outro" };
const healthLabels = { no_budget: "Defina o objetivo", within_budget: "Gastos dentro do objetivo", near_budget: "Gastos perto do objetivo", over_budget: "Gastos acima do objetivo" };
const healthTones: Record<keyof typeof healthLabels, Tone> = { no_budget: "neutral", within_budget: "success", near_budget: "warning", over_budget: "danger" };
const money = (value: bigint | null, currency: DashboardData["trip"]["baseCurrency"]) => formatMinorUnits(value?.toString() ?? null, currency) ?? "—";

export function TripDashboard({ dashboard, today, images = {} }: {
  dashboard: DashboardData;
  today: string;
  images?: Record<string, PlaceImage>;
}) {
  const { trip } = dashboard;
  const route = dashboard.route.status === "ready" ? routeContext(dashboard.route.data, today) : null;
  const health = dashboard.finance.status === "ready" ? financialHealth(trip.targetBudgetMinor, dashboard.finance.data.totals) : "no_budget";
  const savings = dashboard.savings.status === "ready" ? dashboard.savings.data?.calculation ?? null : null;
  const planning = dashboard.planning.status === "ready" ? dashboard.planning.data : null;
  const documents = dashboard.documents.status === "ready" ? dashboard.documents.data : null;
  const attention = buildAttention({ trip, today, health, savings, route: dashboard.route.status === "ready" ? dashboard.route.data : null, planning, documents });
  const cta = !route?.stopCount ? { label: "Adicionar primeiro destino", href: `/trips/${trip.id}/destinations/new` } : dashboard.finance.status !== "ready" || !dashboard.finance.data.data.costs.length ? { label: "Planear orçamento", href: `/trips/${trip.id}/finance` } : dashboard.itinerary.status !== "ready" || !dashboard.itinerary.data.length ? { label: "Planear itinerário", href: `/trips/${trip.id}/itinerary/new` } : attention.length ? { label: "Rever tarefas da viagem", href: `/trips/${trip.id}/planning` } : { label: "Ver itinerário", href: `/trips/${trip.id}/itinerary` };
  const progressPercent = savings?.progressBasisPoints != null ? Number(savings.progressBasisPoints) / 100 : 0;
  const checklist = planning?.checklist ?? [];
  const checklistDone = checklist.filter((item) => item.isCompleted).length;
  const pendingTasks = checklist.filter((item) => !item.isCompleted);
  const reservations = planning?.reservations.filter((item) => !item.archivedAt) ?? [];
  const legs = dashboard.route.status === "ready" ? dashboard.route.data.legs.filter((leg) => leg.status !== "cancelled") : [];
  const upcoming = dashboard.itinerary.status === "ready" ? upcomingItinerary(dashboard.itinerary.data, today) : [];

  return <>
    <Link href={cta.href} className="glow-soft group mb-4 flex items-center gap-4 rounded-card bg-primary p-4 text-primary-foreground sm:p-5"><span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black/10"><Icon name="sparkles" size={20} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold uppercase tracking-wide opacity-70">Próximo passo</span><span className="block text-lg font-semibold">{cta.label}</span></span><span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1"><Icon name="arrowRight" size={18} /></span></Link>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile icon="mapPin" label="Destinos" value={route?.stopCount ?? "—"} hint={route ? `${route.countryCount} ${route.countryCount === 1 ? "país" : "países"}` : undefined} />
      <StatTile icon="compass" tone={healthTones[health]} label="Objetivo" value={formatMinorUnits(trip.targetBudgetMinor, trip.baseCurrency) ?? "Por definir"} hint={healthLabels[health]} />
      <StatTile icon="piggy" tone="success" label="Já temos" value={savings ? money(savings.totalFundedMinor, trip.baseCurrency) : "—"} hint={savings?.targetMinor != null ? `${Math.round(progressPercent)}% do objetivo` : "Guardado + pago"} />
      <StatTile icon="calendar" tone="neutral" label="Atividades" value={dashboard.itinerary.status === "ready" ? dashboard.itinerary.data.filter((item) => item.status === "active").length : "—"} hint={`${upcoming.length ? "próximas planeadas" : "no itinerário"}`} />
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card title="Orçamento" icon="wallet" href={`/trips/${trip.id}/finance`} linkLabel="Editar" result={dashboard.finance}>{dashboard.finance.status === "ready" ? <BudgetGlance dashboard={dashboard} /> : null}</Card>
      <Card title="Gastos por categoria" icon="ticket" href={`/trips/${trip.id}/finance#categories-title`} linkLabel="Adicionar" result={dashboard.finance}>{dashboard.finance.status === "ready" ? <CategoryGlance dashboard={dashboard} /> : null}</Card>
    </div>

    <Card title="Rota" icon="route" href={`/trips/${trip.id}/route`} linkLabel="Ver rota completa" result={dashboard.route} className="mt-4">{route?.stopCount ? <>
      <p className="text-sm text-muted-foreground">Toque num destino para ver os detalhes · {route.stopCount} destinos · {route.countryCount} países · {route.currentStop ? `Destino atual: ${route.currentStop.placeName}` : route.nextStop ? `Próximo destino: ${route.nextStop.placeName}` : "Rota histórica"}</p>
      <RouteCarousel tripId={trip.id} stops={route.orderedStops} legs={dashboard.route.status === "ready" ? dashboard.route.data.legs : []} images={images} originLabel={trip.originLabel} returnLabel={trip.returnLabel} currentStopId={route.currentStop?.id ?? null} />
      {route.nextLeg ? <Link href={`/trips/${trip.id}/transport/${route.nextLeg.id}/edit`} className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-sm hover:border-primary/50"><IconBadge icon={travelModeIcons[route.nextLeg.mode]} size="sm" /><span className="min-w-0 flex-1"><span className="block font-semibold">Próximo transporte: {travelModeLabels[route.nextLeg.mode]}</span><span className="text-muted-foreground">{route.nextLeg.departureDate}{route.nextLeg.departureTime ? ` às ${route.nextLeg.departureTime}` : ""}</span></span><Icon name="chevronRight" size={16} className="text-muted-foreground" /></Link> : null}
    </> : dashboard.route.status === "ready" ? <EmptyLine icon="mapPin">Ainda não existem destinos.</EmptyLine> : null}</Card>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section id="checklist" aria-labelledby="checklist-title" className="min-w-0 rounded-card bg-light p-5 text-light-foreground sm:p-6">
        <div className="flex flex-wrap items-center gap-3"><IconBadge icon="checklist" tone="success" size="sm" /><div className="min-w-0 flex-1"><h2 id="checklist-title" className="text-base font-semibold">Checklist</h2>{planning ? <p className="text-xs text-black/55">{checklistDone} de {checklist.length} concluídas</p> : null}</div><Link href={`/trips/${trip.id}/planning`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-light-foreground px-4 text-sm font-semibold text-light hover:opacity-85">Ver todas<Icon name="arrowRight" size={15} /></Link></div>
        {dashboard.planning.status === "error" ? <p role="alert" className="mt-4 rounded-2xl bg-destructive-muted p-4 text-sm text-destructive">Não foi possível carregar esta secção. Tente novamente.</p> : checklist.length ? <>
          {checklist.length ? <div aria-hidden="true" className="mt-4 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-success" style={{ width: `${(checklistDone / checklist.length) * 100}%` }} /></div> : null}
          {pendingTasks.length ? <ul className="mt-4 space-y-2">{pendingTasks.slice(0, 5).map((item) => <ChecklistRow key={item.id} tripId={trip.id} id={item.id} title={item.title} meta={`${checklistCategoryLabels[item.category]}${item.dueDate ? ` · até ${item.dueDate}` : ""}`} done={false} tone="light" />)}</ul> : <p className="mt-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/65"><Icon name="check" size={18} />Todas as tarefas estão concluídas.</p>}
          {pendingTasks.length > 5 ? <p className="mt-3 text-xs text-black/55">+ {pendingTasks.length - 5} tarefas por fazer na checklist completa.</p> : null}
        </> : <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/65"><p>A checklist ainda está vazia.</p><Link href={`/trips/${trip.id}/planning#checklist-title`} className="mt-2 inline-flex font-semibold text-light-foreground underline">Criar checklist</Link></div>}
      </section>
      <Card title="Próximo itinerário" icon="calendar" href={`/trips/${trip.id}/itinerary`} result={dashboard.itinerary}>{dashboard.itinerary.status === "ready" ? upcoming.length ? <ol className="space-y-2">{upcoming.map((item) => {
        const [, month, day] = item.tripDate.split("-");
        return <li key={item.id}><Link href={`/trips/${trip.id}/itinerary/${item.id}/edit`} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-3 hover:border-primary/50"><span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-primary-muted py-2 text-link"><span className="text-lg font-bold leading-none">{day}</span><span className="mt-1 text-[11px] uppercase">{monthShort(Number(month))}</span></span><span className="min-w-0"><strong className="block truncate">{item.title}</strong><span className="text-sm text-muted-foreground">{item.startLocalTime ?? "A qualquer hora"}{item.timezone ? ` · ${item.timezone}` : ""}</span></span></Link></li>;
      })}</ol> : <EmptyLine icon="calendar">Não existem atividades futuras planeadas.</EmptyLine> : null}</Card>
    </div>

    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <Card title="Reservas" icon="ticket" href={`/trips/${trip.id}/planning`} result={dashboard.planning}>{planning ? <DonutBlock label="Reservas por estado" total={reservations.length} unit={reservations.length === 1 ? "reserva" : "reservas"} segments={[
        { label: "Reservadas", value: reservations.filter((item) => item.status === "booked").length, color: "var(--chart-3)" },
        { label: "Planeadas", value: reservations.filter((item) => item.status === "planned").length, color: "var(--chart-2)" },
        { label: "Por rever", value: reservations.filter((item) => item.needsReview).length, color: "var(--chart-1)" },
      ]} /> : null}</Card>
      <Card title="Transportes" icon="plane" href={`/trips/${trip.id}/route`} result={dashboard.route}>{dashboard.route.status === "ready" ? <DonutBlock label="Transportes por estado" total={legs.length} unit={legs.length === 1 ? "trajeto" : "trajetos"} segments={[
        { label: "Reservados ou pagos", value: legs.filter((leg) => leg.status === "booked" || leg.status === "paid" || leg.status === "completed").length, color: "var(--chart-3)" },
        { label: "Planeados", value: legs.filter((leg) => leg.status === "planned").length, color: "var(--chart-2)" },
        { label: "Por rever", value: legs.filter((leg) => leg.reviewRequired).length, color: "var(--chart-6)" },
      ]} /> : null}</Card>
      <Card title="Documentos" icon="file" href={`/trips/${trip.id}/documents`} result={dashboard.documents}>{documents?.length ? <>
        <DonutBlock label="Documentos por validade" total={documents.length} unit="registos" segments={[
          { label: "Válidos", value: documents.filter((item) => ["valid", "no_expiry"].includes(deriveDocumentValidity(item.expiryDate, today))).length, color: "var(--chart-3)" },
          { label: "Expiram em breve", value: documents.filter((item) => deriveDocumentValidity(item.expiryDate, today) === "expiring_soon").length, color: "var(--chart-2)" },
          { label: "Expirados", value: documents.filter((item) => deriveDocumentValidity(item.expiryDate, today) === "expired").length, color: "var(--chart-6)" },
        ]} />
        <p className="mt-3 text-xs text-muted-foreground">{documents.filter((item) => item.attachmentPath).length} com ficheiro · {documents.slice(0, 2).map((item) => documentTypeLabels[item.type]).join(" · ")}</p>
      </> : dashboard.documents.status === "ready" ? <EmptyLine icon="file">Ainda não existem documentos.</EmptyLine> : null}</Card>
    </div>
  </>;
}

function BudgetGlance({ dashboard }: { dashboard: DashboardData }) {
  if (dashboard.finance.status !== "ready") return null;
  const { trip } = dashboard;
  const calculation = dashboard.savings.status === "ready" ? dashboard.savings.data?.calculation ?? null : null;
  const forecast = expenseRows(dashboard.finance.data.data).reduce((sum, row) => sum + row.valueMinor, 0n);
  const target = trip.targetBudgetMinor === null ? null : BigInt(trip.targetBudgetMinor);
  const goal = target ?? (forecast > 0n ? forecast : null);
  const have = calculation ? calculation.currentAvailableMinor + calculation.eligiblePaidMinor : 0n;
  const missing = goal === null ? null : goal > have ? goal - have : 0n;
  const percent = goal && goal > 0n ? Math.min(Number((have * 1000n) / goal) / 10, 100) : 0;
  return <div className="flex flex-wrap items-center gap-6">
    <RingProgress percent={percent} size={140} label="Parte do objetivo já garantida"><span className="text-2xl font-semibold tabular-nums">{Math.round(percent)}%</span><span className="text-xs text-muted-foreground">garantido</span></RingProgress>
    <dl className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
      <Metric label="Objetivo" value={target === null ? "Por definir" : money(target, trip.baseCurrency)} />
      <Metric label="Já temos" value={money(have, trip.baseCurrency)} />
      <Metric label="Falta" value={missing === null ? "—" : money(missing, trip.baseCurrency)} />
    </dl>
  </div>;
}

function CategoryGlance({ dashboard }: { dashboard: DashboardData }) {
  if (dashboard.finance.status !== "ready") return null;
  const totals = categoryTotals(dashboard.finance.data.data).filter((item) => item.totalMinor > 0n);
  if (!totals.length) return <EmptyLine icon="wallet">Ainda não há gastos. Adicione hospedagem, passagens ou passeios no Orçamento.</EmptyLine>;
  return <BarList items={totals.slice(0, 5).map((item, index) => ({ label: item.category.name, value: Number(item.totalMinor), display: money(item.totalMinor, dashboard.trip.baseCurrency), color: chartColors[index % chartColors.length] }))} />;
}

function DonutBlock({ label, segments, total, unit }: { label: string; segments: { label: string; value: number; color: string }[]; total: number; unit: string }) {
  const withDisplay = segments.map((segment) => ({ ...segment, display: String(segment.value) }));
  return <div className="flex flex-wrap items-center gap-5"><DonutChart size={112} thickness={13} label={`${label}: ${withDisplay.map((segment) => `${segment.label} ${segment.display}`).join(", ")}`} segments={withDisplay} center={<><span className="text-xl font-semibold">{total}</span><span className="text-[11px] text-muted-foreground">{unit}</span></>} /><ChartLegend segments={withDisplay} className="min-w-32 flex-1" /></div>;
}



function Card<T>({ title, icon, href, linkLabel = "Abrir", result, children, className = "" }: { title: string; icon: IconName; href: string; linkLabel?: string; result: SectionResult<T>; children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-card border border-border bg-card p-5 sm:p-6 ${className}`}>
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><IconBadge icon={icon} size="sm" /><h2 className="text-base font-semibold">{title}</h2></div><Link href={href} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-link hover:bg-muted">{linkLabel}<Icon name="arrowUpRight" size={14} /></Link></div>
    <div className="mt-5">{result.status === "error" ? <p role="alert" className="rounded-2xl bg-destructive-muted p-4 text-sm text-destructive">Não foi possível carregar esta secção. Tente novamente.</p> : children}</div>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-base font-semibold tabular-nums">{value}</dd></div>;
}

function EmptyLine({ icon, children }: { icon: IconName; children: ReactNode }) {
  return <p className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground"><Icon name={icon} size={18} />{children}</p>;
}

function monthShort(month: number) {
  return ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][month - 1] ?? "";
}

