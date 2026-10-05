import Link from "next/link";
import { ChartLegend, DonutChart, RingProgress } from "@/components/ui/charts";
import { Icon } from "@/components/ui/icons";
import { Badge, button, EmptyState, Notice, Panel, SectionHeader, StatTile } from "@/components/ui/page";
import { formatMinorUnits } from "@/features/trips/money";
import type { Trip } from "@/features/trips/types";
import { formatProgress } from "../calculations";
import type { SavingsCalculation } from "../types";

const labels = { no_target: "Sem objetivo financeiro", not_funded: "Ainda não financiada", partially_funded: "Parcialmente financiada", fully_funded: "Totalmente financiada", overfunded: "Financiada com excedente", departure_today: "Partida hoje", trip_started_or_past: "Viagem iniciada ou passada" };
const money = (value: bigint | null, trip: Trip) => value === null ? "—" : formatMinorUnits(value.toString(), trip.baseCurrency) ?? "—";

export function SavingsSummary({ trip, calculation }: { trip: Trip; calculation: SavingsCalculation }) {
  if (calculation.state === "no_target") return <EmptyState icon="piggy" title="Ainda não existe um objetivo calculável" description="Defina um orçamento alvo ou adicione pelo menos um custo planeado com preço para calcular o plano de poupança." action={<div className="flex flex-wrap justify-center gap-3"><Link href={`/trips/${trip.id}/edit`} className={button.primary}>Definir orçamento</Link><Link href={`/trips/${trip.id}/finance/costs/new`} className={button.secondary}>Adicionar custo</Link></div>} />;
  const basis = calculation.targetBasis === "target_budget" ? "Orçamento alvo" : "Previsão atual";
  const progressPercent = Number((calculation.progressBasisPoints ?? 0n) / 100n);
  const funding = [
    { label: "Disponível", value: Number(calculation.currentAvailableMinor), display: money(calculation.currentAvailableMinor, trip), color: "var(--chart-3)" },
    { label: "Já pago", value: Number(calculation.eligiblePaidMinor), display: money(calculation.eligiblePaidMinor, trip), color: "var(--chart-1)" },
    { label: "Por financiar", value: Number(calculation.remainingMinor ?? 0n), display: money(calculation.remainingMinor, trip), color: "var(--chart-7)" },
  ];
  const paces = [{ label: "≈ por mês", value: calculation.monthlyPaceMinor }, { label: "≈ por semana", value: calculation.weeklyPaceMinor }, { label: "≈ por dia", value: calculation.dailyPaceMinor }];
  return <>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <Panel className="flex flex-wrap items-center gap-8 p-6 sm:p-8">
        <RingProgress percent={progressPercent} size={184} thickness={16} label="Progresso do financiamento"><span className="text-4xl font-semibold tabular-nums">{formatProgress(calculation.progressBasisPoints)}</span><span className="mt-1 text-xs text-muted-foreground">financiado</span></RingProgress>
        <div className="min-w-0 flex-1">
          <Badge tone={calculation.state === "fully_funded" || calculation.state === "overfunded" ? "success" : "primary"}>{labels[calculation.state]}</Badge>
          <p className="mt-5 text-sm text-muted-foreground">Falta financiar</p>
          <p className="mt-1 break-words text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{money(calculation.remainingMinor, trip)}</p>
          {calculation.surplusMinor && calculation.surplusMinor > 0n ? <p className="mt-3 text-success">Excedente: {money(calculation.surplusMinor, trip)}</p> : null}
          <p className="mt-3 text-sm text-muted-foreground">{formatProgress(calculation.progressBasisPoints)} financiado · objetivo {money(calculation.targetMinor, trip)}</p>
        </div>
      </Panel>
      <Panel aria-labelledby="funding-title">
        <SectionHeader id="funding-title" title="Origem do financiamento" description={`Objetivo · ${basis}`} />
        <div className="mt-5 flex flex-wrap items-center gap-6"><DonutChart size={140} thickness={16} label={`Origem do financiamento: ${funding.map((item) => `${item.label} ${item.display}`).join(", ")}`} segments={funding} center={<><span className="text-xs text-muted-foreground">Objetivo</span><span className="text-sm font-semibold">{money(calculation.targetMinor, trip)}</span></>} /><ChartLegend segments={funding} className="min-w-40 flex-1" /></div>
      </Panel>
    </div>

    <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Resumo">
      <StatTile icon="compass" label={`Objetivo · ${basis}`} value={money(calculation.targetMinor, trip)} />
      <StatTile icon="piggy" tone="success" label="Atualmente disponível" value={money(calculation.currentAvailableMinor, trip)} />
      <StatTile icon="check" tone="primary" label="Já pago líquido" value={money(calculation.eligiblePaidMinor, trip)} />
      <StatTile icon="wallet" tone="neutral" label="Total financiado" value={money(calculation.totalFundedMinor, trip)} />
    </section>

    {calculation.state === "departure_today" ? <div className="mt-6"><Notice tone="warning">A viagem começa hoje. São necessários {money(calculation.remainingMinor, trip)} hoje; não são apresentados ritmos recorrentes.</Notice></div>
      : calculation.state === "trip_started_or_past" ? <div className="mt-6"><Notice tone="neutral">A data de partida já passou. O resumo é mantido para contexto histórico, sem recomendações futuras.</Notice></div>
      : calculation.remainingMinor === 0n ? <div className="mt-6"><Notice tone="success">O objetivo está totalmente financiado. Não é necessário um ritmo adicional de poupança.</Notice></div>
      : <Panel className="mt-6" aria-labelledby="pace-title">
        <SectionHeader id="pace-title" title="Ritmo sugerido" description={`Recomendação indicativa para os ${calculation.daysUntilDeparture} dias até à partida; não é uma transferência agendada.`} />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{paces.map((pace) => <article key={pace.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"><span aria-hidden="true" className="flex size-11 items-center justify-center rounded-xl bg-primary-muted text-link"><Icon name="calendar" size={18} /></span><div><p className="text-sm text-muted-foreground">{pace.label}</p><p className="mt-0.5 text-xl font-semibold tabular-nums">{money(pace.value, trip)}</p></div></article>)}</div>
      </Panel>}

    <p className="mt-6 text-sm text-muted-foreground">O objetivo é {money(calculation.targetMinor, trip)} ({basis}). Tem {money(calculation.currentAvailableMinor, trip)} disponíveis e {money(calculation.eligiblePaidMinor, trip)} já pagos, totalizando {money(calculation.totalFundedMinor, trip)} financiados.</p>
  </>;
}
