import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { BackLink, Notice, PageContainer, PageHero } from "@/components/ui/page";
import { AvailableFundsForm } from "@/features/savings/components/available-form";
import { SavingsSummary } from "@/features/savings/components/summary";
import { getSavingsCalculation } from "@/features/savings/queries";
import { todayInLisbon } from "@/features/trips/lifecycle";
import { getOwnedTrip } from "@/features/trips/queries";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function SavingsPage({ params, searchParams }: PageProps<"/trips/[tripId]/savings">) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]), [trip, result] = await Promise.all([getOwnedTrip(tripId), getSavingsCalculation(tripId, todayInLisbon())]);
  if (!trip || !result) notFound();
  return <PageContainer width="medium">
    <div className="mb-4"><BackLink href={`/trips/${tripId}`}>Voltar à viagem</BackLink></div>
    <PageHero seed={`${trip.name} poupança`} size="sm" eyebrow={<><Icon name="piggy" size={14} />Plano de poupança</>} title={trip.name} description="Um plano indicativo e determinístico baseado no orçamento ou previsão, fundos disponíveis, pagamentos líquidos e data de partida." />
    {first(query.saved) ? <div className="mt-4"><Notice tone="success">Fundos disponíveis atualizados.</Notice></div> : null}
    <div className="mt-4"><SavingsSummary trip={trip} calculation={result.calculation} /></div>
    {!trip.archivedAt ? <AvailableFundsForm tripId={trip.id} currency={trip.baseCurrency} currentMinor={result.record?.currentAvailableMinor ?? "0"} /> : <p className="mt-6 rounded-card border border-border bg-card p-5 text-sm text-muted-foreground">Esta viagem está arquivada. O plano é apresentado apenas como resumo histórico.</p>}
  </PageContainer>;
}
