import Link from "next/link";
import { BarList, chartColor, DonutChart } from "@/components/ui/charts";
import { Icon } from "@/components/ui/icons";
import { button, Panel, SectionHeader } from "@/components/ui/page";
import type { RouteData } from "@/features/route/types";
import type { SavingsCalculation } from "@/features/savings/types";
import { formatMinorUnits, minorUnitsToInput } from "@/features/trips/money";
import type { Trip } from "@/features/trips/types";
import { updateSavedFundsAction, updateTargetBudgetAction } from "../budget-actions";
import { categoryTotals, expenseRows, totalsByStop } from "../budget";
import type { FinanceData } from "../types";
import { BudgetCategories, InlineValueCard, type CategoryView } from "./budget-ui";

const money = (value: bigint | null | undefined, trip: Trip) => value === null || value === undefined ? "—" : formatMinorUnits(value.toString(), trip.baseCurrency) ?? "—";

/** Objetivo · Já temos · Falta — the whole budget in three editable cards. */
export function BudgetSummary({ trip, calculation, forecastMinor }: { trip: Trip; calculation: SavingsCalculation; forecastMinor: bigint }) {
  const target = trip.targetBudgetMinor === null ? null : BigInt(trip.targetBudgetMinor);
  const goal = target ?? (forecastMinor > 0n ? forecastMinor : null);
  const have = calculation.currentAvailableMinor;
  const missing = goal === null ? null : goal > have ? goal - have : 0n;
  const percent = goal && goal > 0n ? Math.min(Number((have * 1000n) / goal) / 10, 100) : 0;
  return <section aria-label="Resumo do orçamento" className="grid gap-4 md:grid-cols-3">
    <InlineValueCard tone="accent" icon="compass" label="Objetivo" value={target === null ? "Definir" : money(target, trip)} currency={trip.baseCurrency} inputValue={minorUnitsToInput(trip.targetBudgetMinor, trip.baseCurrency)} action={updateTargetBudgetAction.bind(null, trip.id)} editLabel="Editar objetivo"
      hint={target === null ? (forecastMinor > 0n ? `Sem objetivo: a usar os gastos previstos (${money(forecastMinor, trip)}).` : "Quanto quer gastar na viagem inteira.") : `Gastos previstos: ${money(forecastMinor, trip)}`} />
    <InlineValueCard icon="piggy" label="Já temos" value={money(have, trip)} currency={trip.baseCurrency} inputValue={minorUnitsToInput(calculation.currentAvailableMinor.toString(), trip.baseCurrency)} action={trip.archivedAt ? undefined : updateSavedFundsAction.bind(null, trip.id)} editLabel="Editar valor guardado"
      hint={<span className="flex flex-wrap gap-x-3"><span>Já pago com este valor: <strong className="font-semibold text-foreground">{money(calculation.eligiblePaidMinor, trip)}</strong></span><span>Ainda livre: <strong className="font-semibold text-foreground">{money(have > calculation.eligiblePaidMinor ? have - calculation.eligiblePaidMinor : 0n, trip)}</strong></span></span>} />
    <InlineValueCard icon="wallet" label="Falta" value={missing === null ? "—" : money(missing, trip)} hint={goal === null ? "Defina um objetivo para ver quanto falta." : missing === 0n ? "Objetivo atingido." : `${Math.round(percent)}% do objetivo já está garantido.`}>
      <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div>
    </InlineValueCard>
  </section>;
}

export function FinanceBudget({ trip, data, route, calculation }: { trip: Trip; data: FinanceData; route: RouteData; calculation: SavingsCalculation }) {
  const rows = expenseRows(data);
  const forecast = rows.reduce((sum, row) => sum + row.valueMinor, 0n);
  const totals = categoryTotals(data);
  const colorOf = new Map(data.categories.map((category, index) => [category.id, chartColor(index)]));
  const stopName = new Map(route.stops.map((stop) => [stop.id, stop.placeName]));
  const categories: CategoryView[] = totals.map(({ category, expenses, totalMinor, paidMinor }) => ({
    id: category.id, name: category.name, total: money(totalMinor, trip), paid: money(paidMinor, trip), paidPercent: totalMinor > 0n ? Math.min(Number((paidMinor * 100n) / totalMinor), 100) : 0, color: colorOf.get(category.id) ?? "var(--chart-7)",
    // Paid expenses go to the end of the list (stable, so the creation order is kept otherwise).
    expenses: [...expenses].sort((a, b) => Number(a.paid) - Number(b.paid)).map((row) => ({ id: row.id, title: row.title, value: money(row.valueMinor, trip), valueInput: minorUnitsToInput(row.valueMinor.toString(), trip.baseCurrency), paid: row.paid, stopId: row.stopId, stopName: row.stopId ? stopName.get(row.stopId) ?? null : null })),
  }));
  const shownIds = new Set(categories.map((category) => category.id));
  const otherCategories = data.categories.filter((category) => category.archivedAt === null && !shownIds.has(category.id)).map((category) => ({ id: category.id, name: category.name }));
  const byStop = totalsByStop(data);
  const withValue = totals.filter((item) => item.totalMinor > 0n);

  return <>
    <BudgetSummary trip={trip} calculation={calculation} forecastMinor={forecast} />

    <section className="mt-10" aria-labelledby="categories-title">
      <SectionHeader id="categories-title" title="Gastos por categoria" description="Quanto vai gastar em cada coisa. Marque o círculo quando estiver pago." />
      <div className="mt-5"><BudgetCategories tripId={trip.id} currency={trip.baseCurrency} categories={categories} otherCategories={otherCategories} stops={route.stops.map((stop) => ({ id: stop.id, name: stop.placeName }))} /></div>
    </section>

    <div className="mt-10 grid gap-4 lg:grid-cols-2">
      <Panel aria-labelledby="by-stop-title">
        <SectionHeader id="by-stop-title" title="Previsão por destino" action={<Link href={`/trips/${trip.id}/destinations/new`} className={`${button.secondary} min-h-10`}><Icon name="plus" size={15} />Destino</Link>} />
        {route.stops.length ? <BarList className="mt-5" items={route.stops.map((stop, index) => ({ label: stop.placeName, value: Number(byStop.get(stop.id) ?? 0n), display: money(byStop.get(stop.id) ?? 0n, trip), color: chartColor(index + 2) }))} /> : <p className="mt-4 text-sm text-muted-foreground">Adicione destinos para ver a previsão de cada um.</p>}
        <p className="mt-4 text-xs text-muted-foreground">Para associar um gasto a um destino, escolha o destino ao adicioná-lo ou editá-lo.</p>
      </Panel>
      <Panel aria-labelledby="by-category-title">
        <SectionHeader id="by-category-title" title="Previsão por categoria" action={<a href="#categories-title" className={`${button.secondary} min-h-10`}><Icon name="plus" size={15} />Gasto</a>} />
        {withValue.length ? <div className="mt-5 flex flex-wrap items-center gap-6">
          <DonutChart size={160} label={`Previsão por categoria: ${withValue.map((item) => `${item.category.name} ${money(item.totalMinor, trip)}`).join(", ")}`} segments={withValue.map((item) => ({ label: item.category.name, value: Number(item.totalMinor), color: colorOf.get(item.category.id) }))} center={<><span className="text-xs text-muted-foreground">Total</span><span className="text-sm font-semibold">{money(forecast, trip)}</span></>} />
          <ul className="min-w-44 flex-1 space-y-2.5 text-sm">{withValue.map((item) => <li key={item.category.id} className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2.5"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: colorOf.get(item.category.id) }} /><span className="truncate text-muted-foreground">{item.category.name}</span></span><span className="font-medium tabular-nums">{money(item.totalMinor, trip)}</span></li>)}</ul>
        </div> : <p className="mt-4 text-sm text-muted-foreground">Ainda não há gastos com valor.</p>}
      </Panel>
    </div>

    {data.payments.length || data.actuals.length ? <details className="mt-10 rounded-card border border-border bg-card p-5">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold">Histórico de pagamentos</summary>
      <ul className="mt-3 divide-y divide-border text-sm">{data.payments.map((payment) => <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span>{data.costs.find((cost) => cost.id === payment.costItemId)?.title ?? "Pagamento"} · <span className="text-muted-foreground">{payment.paidOn}</span></span><span className="font-medium tabular-nums">{money(BigInt(payment.baseAmountMinor), trip)}</span></li>)}{data.actuals.map((actual) => <li key={actual.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span>{actual.title ?? "Despesa"} · <span className="text-muted-foreground">{actual.spentOn}</span></span><span className="font-medium tabular-nums">{money(BigInt(actual.baseAmountMinor), trip)}</span></li>)}</ul>
    </details> : null}
  </>;
}
