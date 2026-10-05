import { notFound } from "next/navigation";
import { PageContainer } from "@/components/ui/page";
import { FinanceBudget } from "@/features/finance/components/budget-view";
import { getOwnedFinance } from "@/features/finance/queries";
import { getOwnedRoute } from "@/features/route/queries";
import { getSavingsCalculation } from "@/features/savings/queries";
import { TripHero } from "@/features/trips/components/trip-hero";
import { todayInLisbon } from "@/features/trips/lifecycle";
import { getOwnedTrip } from "@/features/trips/queries";

export default async function FinancePage({ params }: PageProps<"/trips/[tripId]/finance">) {
  const { tripId } = await params;
  const [trip, data, route, savings] = await Promise.all([getOwnedTrip(tripId), getOwnedFinance(tripId), getOwnedRoute(tripId), getSavingsCalculation(tripId, todayInLisbon())]);
  if (!trip || !data || !route || !savings) notFound();
  return <PageContainer hero={<TripHero trip={trip} active="finance" title="Orçamento" description={`Objetivo, o que já temos e o que falta. Valores em ${trip.baseCurrency}.`} />}>
    <FinanceBudget trip={trip} data={data} route={route} calculation={savings.calculation} />
  </PageContainer>;
}
