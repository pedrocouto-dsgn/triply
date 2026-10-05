import Link from "next/link";
import { BarList, chartColor, ChartLegend, DonutChart, StackedBar } from "@/components/ui/charts";
import { Icon } from "@/components/ui/icons";
import { Badge, EmptyState, IconBadge, Notice, Panel, SectionHeader, StatTile } from "@/components/ui/page";
import type { RouteData } from "@/features/route/types";
import { formatMinorUnits } from "@/features/trips/money";
import type { Trip } from "@/features/trips/types";
import { calculateBreakdown, calculateFinanceTotals, overpaidCostIds, remaining } from "../calculations";
import type { FinanceData } from "../types";

const format = (value: bigint, trip: Trip) => formatMinorUnits(value.toString(), trip.baseCurrency) ?? "—";
const max0 = (value: bigint) => (value > 0n ? value : 0n);

export function FinanceDashboard({ trip, data, route }: { trip: Trip; data: FinanceData; route: RouteData }) {
  const totals = calculateFinanceTotals(data.costs, data.payments, data.actuals, data.adjustments);
  const forecastRemaining = remaining(trip.targetBudgetMinor, totals.forecast);
  const actualRemaining = remaining(trip.targetBudgetMinor, totals.actual);
  const categories = calculateBreakdown(data.costs, data.actuals, data.adjustments, "categoryId");
  const stops = calculateBreakdown(data.costs, data.actuals, data.adjustments, "stopId");
  const overpaid = overpaidCostIds(data.costs, data.payments, data.adjustments);
  const categoryColor = new Map(data.categories.map((category, index) => [category.id, chartColor(index)]));
  const categoryEntries = [...categories].map(([id, total]) => ({ id, label: data.categories.find((category) => category.id === id)?.name ?? "Categoria", ...total }));
  const stopEntries = [...stops].map(([id, total]) => ({ id, label: route.stops.find((stop) => stop.id === id)?.placeName ?? "Destino", ...total }));
  const target = trip.targetBudgetMinor === null ? null : BigInt(trip.targetBudgetMinor);
  const usage = [
    { label: "Pago", value: Number(totals.paid), display: format(totals.paid, trip), color: "var(--chart-1)" },
    { label: "Comprometido por pagar", value: Number(max0(totals.committed - totals.paid)), display: format(max0(totals.committed - totals.paid), trip), color: "var(--chart-2)" },
    { label: "Previsto por reservar", value: Number(max0(totals.forecast - totals.committed)), display: format(max0(totals.forecast - totals.committed), trip), color: "var(--chart-4)" },
  ];
  const usageTotal = target !== null && target > totals.forecast ? Number(target) : Number(totals.forecast);

  return <>
    <section aria-label="Totais" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <StatTile icon="wallet" label="Orçamento alvo" value={target === null ? "Não definido" : format(target, trip)} />
      <StatTile icon="sparkles" tone="neutral" label="Estimado" value={format(totals.estimated, trip)} />
      <StatTile icon="compass" label="Previsão atual" value={format(totals.forecast, trip)} />
      <StatTile icon="ticket" tone="warning" label="Comprometido" value={format(totals.committed, trip)} />
      <StatTile icon="check" tone="success" label="Pago líquido" value={format(totals.paid, trip)} />
      <StatTile icon="wallet" tone="neutral" label="Real líquido" value={format(totals.actual, trip)} />
    </section>

    <Panel className="mt-4" aria-labelledby="usage-title">
      <SectionHeader id="usage-title" title="Utilização do orçamento" description={target === null ? "Defina um orçamento alvo para comparar com a previsão." : `Previsão face ao orçamento alvo de ${format(target, trip)}`} />
      <div className="mt-5"><StackedBar label={`Utilização do orçamento: ${usage.map((item) => `${item.label} ${item.display}`).join(", ")}`} segments={usage} total={usageTotal} /></div>
      <ChartLegend segments={usage} className="mt-4 grid gap-2 sm:grid-cols-3 sm:space-y-0" />
      {forecastRemaining !== null ? <p className={`mt-5 rounded-2xl p-4 text-sm ${forecastRemaining < 0n ? "bg-warning-muted text-warning" : "bg-success-muted text-success"}`}>Face à previsão: {forecastRemaining < 0n ? `${format(-forecastRemaining, trip)} acima do alvo` : `restam ${format(forecastRemaining, trip)}`}. Face ao real: {actualRemaining !== null && actualRemaining < 0n ? `${format(-actualRemaining, trip)} acima do alvo` : format(actualRemaining ?? 0n, trip)}.</p> : null}
    </Panel>
    {overpaid.length ? <div className="mt-4"><Notice tone="warning">Aviso: {overpaid.length} custo(s) têm pagamentos líquidos acima do valor comprometido. O registo foi preservado.</Notice></div> : null}

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Panel aria-labelledby="by-category-title">
        <SectionHeader id="by-category-title" title="Por categoria" description="Previsão por categoria, com o real ao lado" />
        {categoryEntries.length ? <div className="mt-5 flex flex-wrap items-center gap-6">
          <DonutChart size={168} label={`Previsão por categoria: ${categoryEntries.map((item) => `${item.label} ${format(item.forecast, trip)}`).join(", ")}`} segments={categoryEntries.map((item) => ({ label: item.label, value: Number(item.forecast), color: categoryColor.get(item.id) }))} center={<><span className="text-xs text-muted-foreground">Previsão</span><span className="text-sm font-semibold">{format(totals.forecast, trip)}</span></>} />
          <ul className="min-w-48 flex-1 space-y-3 text-sm">{categoryEntries.map((item) => <li key={item.id} className="flex items-start justify-between gap-3"><span className="flex min-w-0 items-center gap-2.5"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: categoryColor.get(item.id) }} /><span className="truncate">{item.label}</span></span><span className="shrink-0 text-right tabular-nums">Prev. {format(item.forecast, trip)}<br /><span className="text-xs text-muted-foreground">Real {format(item.actual, trip)}</span></span></li>)}</ul>
        </div> : <p className="mt-4 text-sm text-muted-foreground">Sem valores associados.</p>}
      </Panel>
      <Panel aria-labelledby="by-stop-title">
        <SectionHeader id="by-stop-title" title="Por destino" description="Previsão de cada destino da rota" />
        {stopEntries.length ? <BarList className="mt-5" items={stopEntries.map((item) => ({ label: item.label, value: Number(item.forecast), display: `Prev. ${format(item.forecast, trip)} · Real ${format(item.actual, trip)}` }))} /> : <p className="mt-4 text-sm text-muted-foreground">Sem valores associados.</p>}
      </Panel>
    </div>

    <section className="mt-10" aria-labelledby="costs-title">
      <SectionHeader id="costs-title" title="Custos planeados" description={`${data.costs.length} ${data.costs.length === 1 ? "custo" : "custos"}`} />
      {data.costs.length ? <div className="mt-4 grid gap-3">{data.costs.map((cost) => <article key={cost.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-border p-4 ${cost.archivedAt ? "bg-surface opacity-75" : "bg-card"}`}>
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${categoryColor.get(cost.categoryId) ?? "var(--chart-7)"} 22%, transparent)`, color: categoryColor.get(cost.categoryId) ?? "var(--chart-7)" }}><Icon name="wallet" size={18} /></span>
        <div className="min-w-0 flex-1"><h3 className="flex flex-wrap items-center gap-2 font-semibold">{cost.title}{cost.archivedAt ? <Badge>Arquivado</Badge> : null}</h3><p className="mt-1 text-sm text-muted-foreground">{data.categories.find((category) => category.id === cost.categoryId)?.name ?? "Categoria"} · Estimado: {cost.estimatedBaseMinor === null ? "Não definido" : format(BigInt(cost.estimatedBaseMinor), trip)} · Comprometido: {cost.committedBaseMinor === null ? "Não definido" : format(BigInt(cost.committedBaseMinor), trip)}</p></div>
        <div className="flex flex-wrap gap-2 text-sm font-medium"><Link className="rounded-full border border-border px-3 py-2 text-link hover:bg-muted" href={`/trips/${trip.id}/finance/costs/${cost.id}/edit`}>Editar</Link>{!cost.archivedAt ? <Link className="rounded-full border border-border px-3 py-2 text-link hover:bg-muted" href={`/trips/${trip.id}/finance/payments/new?costId=${cost.id}`}>Pagamento</Link> : null}</div>
      </article>)}</div> : <EmptyState className="mt-4" icon="wallet" title="Ainda não existem custos planeados." description="Adicione alojamento, transportes ou experiências para ver a previsão." />}
    </section>

    <section className="mt-10" aria-labelledby="history-title">
      <SectionHeader id="history-title" title="Histórico real" description={`${data.payments.length} pagamento(s), ${data.actuals.length} despesa(s) real(is) e ${data.adjustments.length} ajuste(s). Despesa real não planeada: ${format(totals.unplannedActual, trip)}.`} />
      {data.payments.length || data.actuals.length ? <div className="mt-4 divide-y divide-border overflow-hidden rounded-card border border-border bg-card">
        {data.payments.map((payment) => <HistoryRow key={payment.id} kind="Pagamento" date={payment.paidOn} amount={format(BigInt(payment.baseAmountMinor), trip)} href={`/trips/${trip.id}/finance/adjustments/new?paymentId=${payment.id}`} />)}
        {data.actuals.map((actual) => <HistoryRow key={actual.id} kind="Despesa real" date={actual.spentOn} amount={format(BigInt(actual.baseAmountMinor), trip)} href={`/trips/${trip.id}/finance/adjustments/new?actualId=${actual.id}`} />)}
      </div> : <p className="mt-4 rounded-card border border-dashed border-border bg-surface p-5 text-sm text-muted-foreground">Ainda não existem pagamentos nem despesas reais.</p>}
    </section>
  </>;
}

function HistoryRow({ kind, date, amount, href }: { kind: string; date: string; amount: string; href: string }) {
  return <article className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm"><div className="flex items-center gap-3"><IconBadge icon={kind === "Pagamento" ? "check" : "wallet"} tone={kind === "Pagamento" ? "success" : "neutral"} size="sm" /><div><p className="font-medium">{kind}</p><p className="mt-0.5 text-muted-foreground">{date}</p></div></div><div className="text-right"><p className="font-semibold tabular-nums">{amount}</p><Link className="mt-1 inline-block text-link hover:underline" href={href}>Registar reembolso</Link></div></article>;
}
