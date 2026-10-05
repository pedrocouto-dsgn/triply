import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { button, PageContainer } from "@/components/ui/page";
import { CategoryManager } from "@/features/finance/components/category-manager";
import { FinanceDashboard } from "@/features/finance/components/dashboard";
import { getOwnedFinance } from "@/features/finance/queries";
import { getOwnedRoute } from "@/features/route/queries";
import { TripHero } from "@/features/trips/components/trip-hero";
import { getOwnedTrip } from "@/features/trips/queries";

export default async function FinancePage({ params }: PageProps<"/trips/[tripId]/finance">) {
  const { tripId } = await params, [trip, data, route] = await Promise.all([getOwnedTrip(tripId), getOwnedFinance(tripId), getOwnedRoute(tripId)]);
  if (!trip || !data || !route) notFound();
  return <PageContainer hero={<TripHero trip={trip} active="finance" title="Orçamento" description={`Valores consolidados em ${trip.baseCurrency}. Estimado, comprometido, pago e real permanecem distintos.`} actions={<><Link className={button.primary} href={`/trips/${trip.id}/finance/costs/new`}><Icon name="plus" size={16} />Adicionar custo planeado</Link><Link className={button.glass} href={`/trips/${trip.id}/finance/actuals/new`}>Registar despesa real</Link></>} />}>
    <div className="mt-4"><FinanceDashboard trip={trip} data={data} route={route} /></div>
    <CategoryManager tripId={tripId} categories={data.categories} />
  </PageContainer>;
}
