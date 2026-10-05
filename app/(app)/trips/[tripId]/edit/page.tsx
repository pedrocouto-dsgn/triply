import { randomUUID } from "node:crypto";
import { FormShell } from "@/components/ui/page";
import { notFound } from "next/navigation";
import { TripForm } from "@/features/trips/components/trip-form";
import { minorUnitsToInput } from "@/features/trips/money";
import { getOwnedTrip } from "@/features/trips/queries";
import { tripIdSchema } from "@/features/trips/schemas";

export default async function EditTripPage({ params }: PageProps<"/trips/[tripId]/edit">) {
  const { tripId } = await params;
  if (!tripIdSchema.safeParse(tripId).success) notFound();
  const trip = await getOwnedTrip(tripId);
  if (!trip) notFound();
  return <FormShell backHref={`/trips/${trip.id}`} backLabel="Voltar à viagem" eyebrow="Editar viagem" icon="pencil" title={trip.name} description="Altere apenas o necessário. Os restantes dados serão preservados.">
    <TripForm mode="edit" tripId={trip.id} initialValues={{ name: trip.name, startDate: trip.startDate, endDate: trip.endDate, originLabel: trip.originLabel ?? "", returnLabel: trip.returnLabel ?? "", travelersCount: String(trip.travelersCount), baseCurrency: trip.baseCurrency, targetBudget: minorUnitsToInput(trip.targetBudgetMinor, trip.baseCurrency), createRequestId: randomUUID() }} />
  </FormShell>;
}
