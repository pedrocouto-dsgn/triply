import Link from "next/link";
import type { ReactNode } from "react";
import { ChartLegend, DonutChart, RingProgress } from "@/components/ui/charts";
import { Icon, travelModeIcons, type IconName } from "@/components/ui/icons";
import { Badge, IconBadge, StatTile, type Tone } from "@/components/ui/page";
import type { PlaceImage } from "@/features/media/types";
import { checklistCategoryLabels } from "@/features/planning/labels";
import { RouteCarousel } from "@/features/route/components/route-carousel";
import { deriveDocumentValidity } from "@/features/documents/helpers";
import { documentTypeLabels } from "@/features/documents/labels";
import { formatMinorUnits } from "@/features/trips/money";
import { buildAttention, financialHealth, routeContext, upcomingItinerary } from "../aggregation";
import type { DashboardData, SectionResult } from "../types";

const travelModeLabels = { plane: "Avião", train: "Comboio", bus: "Autocarro", car: "Carro", ferry: "Ferry", other: "Outro" };
const healthLabels = { no_budget: "Sem orçamento definido", within_budget: "Dentro do orçamento", near_budget: "Próximo do orçamento", over_budget: "Acima do orçamento" };
const healthTones: Record<keyof typeof healthLabels, Tone> = { no_budget: "neutral", within_budget: "success", near_budget: "warning", over_budget: "danger" };
const money = (value: bigint | null, currency: DashboardData["trip"]["baseCurrency"]) => formatMinorUnits(value?.toString() ?? null, currency) ?? "—";
const max0 = (value: bigint) => (value > 0n ? value : 0n);

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
  const reservations = planning?.reservations.filter((item) => !item.archivedAt) ?? [];
  const legs = dashboard.route.status === "ready" ? dashboard.route.data.legs.filter((leg) => leg.status !== "cancelled") : [];
  const upcoming = dashboard.itinerary.status === "ready" ? upcomingItinerary(dashboard.itinerary.data, today) : [];

  return <>
    <Link href={cta.href} className="group mb-4 flex items-center gap-4 rounded-card bg-primary p-4 text-primary-foreground sm:p-5"><span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black/10"><Icon name="sparkles" size={20} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold uppercase tracking-wide opacity-70">Próximo passo</span><span className="block text-lg font-semibold">{cta.label}</span></span><span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1"><Icon name="arrowRight" size={18} /></span></Link>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile icon="mapPin" label="Destinos" value={route?.stopCount ?? "—"} hint={route ? `${route.countryCount} ${route.countryCount === 1 ? "país" : "países"}` : undefined} />
      <StatTile icon="wallet" tone={healthTones[health]} label="Orçamento" value={formatMinorUnits(trip.targetBudgetMinor, trip.baseCurrency) ?? "Não definido"} hint={healthLabels[health]} />
      <StatTile icon="piggy" tone="success" label="Financiado" value={savings?.targetMinor != null ? `${Math.round(progressPercent)}%` : "—"} hint={savings?.targetMinor != null ? `${money(savings.totalFundedMinor, trip.baseCurrency)} de ${money(savings.targetMinor, trip.baseCurrency)}` : "Sem objetivo"} />
      <StatTile icon="calendar" tone="neutral" label="Atividades" value={dashboard.itinerary.status === "ready" ? dashboard.itinerary.data.filter((item) => item.status === "active").length : "—"} hint={`${upcoming.length ? "próximas planeadas" : "no itinerário"}`} />
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card title="Finanças" icon="wallet" href={`/trips/${trip.id}/finance`} result={dashboard.finance}>{dashboard.finance.status === "ready" ? <FinanceSummary dashboard={dashboard} health={health} /> : null}</Card>
      <Card title="Poupança" icon="piggy" href={`/trips/${trip.id}/savings`} result={dashboard.savings}>{savings?.targetMinor !== null && savings ? <div className="flex flex-wrap items-center gap-6">
        <RingProgress percent={progressPercent} label="Progresso do financiamento" size={140}><span className="text-2xl font-semibold tabular-nums">{Math.round(progressPercent)}%</span><span className="text-xs text-muted-foreground">financiado</span></RingProgress>
        <div className="min-w-0 flex-1"><p className="font-semibold">{savings.state === "fully_funded" || savings.state === "overfunded" ? "Objetivo financiado" : "Progresso do financiamento"}</p><dl className="mt-3 grid grid-cols-2 gap-3"><Metric label="Objetivo" value={money(savings.targetMinor, trip.baseCurrency)} /><Metric label="Financiado" value={money(savings.totalFundedMinor, trip.baseCurrency)} /><Metric label="Por financiar" value={money(savings.remainingMinor, trip.baseCurrency)} /><Metric label="Ritmo mensal" value={money(savings.monthlyPaceMinor, trip.baseCurrency)} /></dl></div>
      </div> : dashboard.savings.status === "ready" ? <p className="text-muted-foreground">Defina um orçamento ou previsão para criar um objetivo de poupança.</p> : null}</Card>
    </div>

    <Card title="Rota" icon="route" href={`/trips/${trip.id}/route`} linkLabel="Ver rota completa" result={dashboard.route} className="mt-4">{route?.stopCount ? <>
      <p className="text-sm text-muted-foreground">Toque num destino para ver os detalhes · {route.stopCount} destinos · {route.countryCount} países · {route.currentStop ? `Destino atual: ${route.currentStop.placeName}` : route.nextStop ? `Próximo destino: ${route.nextStop.placeName}` : "Rota histórica"}</p>
      <RouteCarousel tripId={trip.id} stops={route.orderedStops} legs={dashboard.route.status === "ready" ? dashboard.route.data.legs : []} images={images} originLabel={trip.originLabel} returnLabel={trip.returnLabel} currentStopId={route.currentStop?.id ?? null} />
      {route.nextLeg ? <Link href={`/trips/${trip.id}/transport/${route.nextLeg.id}/edit`} className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-sm hover:border-primary/50"><IconBadge icon={travelModeIcons[route.nextLeg.mode]} size="sm" /><span className="min-w-0 flex-1"><span className="block font-semibold">Próximo transporte: {travelModeLabels[route.nextLeg.mode]}</span><span className="text-muted-foreground">{route.nextLeg.departureDate}{route.nextLeg.departureTime ? ` às ${route.nextLeg.departureTime}` : ""}</span></span><Icon name="chevronRight" size={16} className="text-muted-foreground" /></Link> : null}
    </> : dashboard.route.status === "ready" ? <EmptyLine icon="mapPin">Ainda não existem destinos.</EmptyLine> : null}</Card>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section id="checklist" aria-labelledby="checklist-title" className="min-w-0 rounded-card bg-light p-5 text-light-foreground sm:p-6">
        <div className="flex flex-wrap items-center gap-3"><IconBadge icon="checklist" tone="success" size="sm" /><div className="min-w-0 flex-1"><h2 id="checklist-title" className="text-base font-semibold">Checklist</h2>{planning ? <p className="text-xs text-black/55">{checklistDone} de {checklist.length} concluídas</p> : null}</div><Link href={`/trips/${trip.id}/planning#checklist-title`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-light-foreground px-4 text-sm font-semibold text-light hover:opacity-85">Ver todas<Icon name="arrowRight" size={15} /></Link></div>
        {dashboard.planning.status === "error" ? <p role="alert" className="mt-4 rounded-2xl bg-destructive-muted p-4 text-sm text-destructive">Não foi possível carregar esta secção. Tente novamente.</p> : checklist.length ? <>
          {checklist.length ? <div aria-hidden="true" className="mt-4 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-success" style={{ width: `${(checklistDone / checklist.length) * 100}%` }} /></div> : null}
          <ul className="mt-4 space-y-2">{checklist.slice(0, 5).map((item) => <li key={item.id}><Link href={`/trips/${trip.id}/planning/checklist/${item.id}/edit`} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 transition-colors hover:border-black/30">
            <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${item.isCompleted ? "border-transparent bg-light-foreground text-light" : "border-black/25"}`}>{item.isCompleted ? <Icon name="check" size={14} strokeWidth={2.6} /> : null}</span>
            <span className="min-w-0 flex-1"><span className={`block truncate font-medium ${item.isCompleted ? "text-black/45 line-through" : ""}`}>{item.title}</span><span className="block text-xs text-black/55">{checklistCategoryLabels[item.category]}{item.dueDate ? ` · até ${item.dueDate}` : ""}</span></span>
            <span className="sr-only">{item.isCompleted ? "Concluída" : "Por fazer"}</span>
          </Link></li>)}</ul>
          {checklist.length > 5 ? <p className="mt-3 text-xs text-black/55">+ {checklist.length - 5} tarefas na checklist completa.</p> : null}
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

function FinanceSummary({ dashboard, health }: { dashboard: DashboardData; health: keyof typeof healthLabels }) {
  if (dashboard.finance.status !== "ready") return null;
  const { trip } = dashboard, totals = dashboard.finance.data.totals;
  const target = trip.targetBudgetMinor === null ? null : BigInt(trip.targetBudgetMinor);
  const segments = [
    { label: "Pago", value: Number(totals.paid), display: money(totals.paid, trip.baseCurrency), color: "var(--chart-1)" },
    { label: "Comprometido por pagar", value: Number(max0(totals.committed - totals.paid)), display: money(max0(totals.committed - totals.paid), trip.baseCurrency), color: "var(--chart-2)" },
    { label: "Previsto por reservar", value: Number(max0(totals.forecast - totals.committed)), display: money(max0(totals.forecast - totals.committed), trip.baseCurrency), color: "var(--chart-4)" },
    ...(target !== null ? [{ label: "Margem no orçamento", value: Number(max0(target - totals.forecast)), display: money(max0(target - totals.forecast), trip.baseCurrency), color: "var(--chart-7)" }] : []),
  ];
  const usage = target && target > 0n ? Math.round(Number((totals.forecast * 1000n) / target) / 10) : null;
  return <>
    <div className="flex flex-wrap items-center gap-6">
      <DonutChart size={168} label={`Distribuição financeira: ${segments.map((segment) => `${segment.label} ${segment.display}`).join(", ")}`} segments={segments} center={usage !== null ? <><span className="text-2xl font-semibold tabular-nums">{usage}%</span><span className="text-xs text-muted-foreground">previsto</span></> : <><span className="text-xs text-muted-foreground">Previsão</span><span className="text-sm font-semibold">{money(totals.forecast, trip.baseCurrency)}</span></>} />
      <div className="min-w-0 flex-1 space-y-4"><Badge tone={healthTones[health]}>{healthLabels[health]}</Badge><ChartLegend segments={segments} /></div>
    </div>
    <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-5">
      <Metric label="Orçamento" value={formatMinorUnits(trip.targetBudgetMinor, trip.baseCurrency) ?? "Não definido"} />
      <Metric label="Previsão" value={money(totals.forecast, trip.baseCurrency)} />
      <Metric label="Comprometido" value={money(totals.committed, trip.baseCurrency)} />
      <Metric label="Pago" value={money(totals.paid, trip.baseCurrency)} />
      <Metric label="Real" value={money(totals.actual, trip.baseCurrency)} />
    </dl>
  </>;
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

