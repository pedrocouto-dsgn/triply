import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { Notice, PageContainer, Panel, SectionHeader } from "@/components/ui/page";
import { expenseRows } from "@/features/finance/budget";
import { BudgetSummary } from "@/features/finance/components/budget-view";
import { getOwnedFinance } from "@/features/finance/queries";
import { getSavingsCalculation } from "@/features/savings/queries";
import { TripHero } from "@/features/trips/components/trip-hero";
import { todayInLisbon } from "@/features/trips/lifecycle";
import { formatMinorUnits } from "@/features/trips/money";
import { getOwnedTrip } from "@/features/trips/queries";

export default async function SavingsPage({ params }: PageProps<"/trips/[tripId]/savings">) {
  const { tripId } = await params;
  const [trip, result, finance] = await Promise.all([getOwnedTrip(tripId), getSavingsCalculation(tripId, todayInLisbon()), getOwnedFinance(tripId)]);
  if (!trip || !result || !finance) notFound();
  const calculation = result.calculation;
  const forecast = expenseRows(finance).reduce((sum, row) => sum + row.valueMinor, 0n);
  const money = (value: bigint | null) => value === null ? "—" : formatMinorUnits(value.toString(), trip.baseCurrency) ?? "—";
  const paces = [{ label: "por mês", value: calculation.monthlyPaceMinor }, { label: "por semana", value: calculation.weeklyPaceMinor }, { label: "por dia", value: calculation.dailyPaceMinor }];
  return <PageContainer width="medium" hero={<TripHero trip={trip} active="savings" title="Poupança" description="Quanto já temos para a viagem e quanto é preciso juntar até à partida." />}>
    <BudgetSummary trip={trip} calculation={calculation} forecastMinor={forecast} />
    <div className="mt-6">
      {calculation.state === "no_target" ? <Notice tone="neutral">Defina o objetivo (ou adicione gastos no Orçamento) para calcular quanto poupar.</Notice>
        : calculation.state === "departure_today" ? <Notice tone="warning">A viagem começa hoje. Faltam {money(calculation.remainingMinor)}.</Notice>
        : calculation.state === "trip_started_or_past" ? <Notice tone="neutral">A viagem já começou. O resumo fica guardado como histórico.</Notice>
        : calculation.remainingMinor === 0n ? <Notice tone="success">Objetivo atingido. Não é preciso poupar mais.</Notice>
        : <Panel aria-labelledby="pace-title">
          <SectionHeader id="pace-title" title="Quanto poupar" description={`Para juntar o que falta nos ${calculation.daysUntilDeparture} dias até à partida.`} />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">{paces.map((pace) => <article key={pace.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"><span aria-hidden="true" className="flex size-11 items-center justify-center rounded-xl bg-primary-muted text-link"><Icon name="calendar" size={18} /></span><div><p className="text-2xl font-light tabular-nums">{money(pace.value)}</p><p className="text-sm text-muted-foreground">{pace.label}</p></div></article>)}</div>
        </Panel>}
    </div>
  </PageContainer>;
}
