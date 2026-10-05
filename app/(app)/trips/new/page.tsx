import { randomUUID } from "node:crypto";
import { FormShell } from "@/components/ui/page";
import { TripForm } from "@/features/trips/components/trip-form";
import { getDefaultTripCurrency } from "@/features/trips/queries";

export default async function NewTripPage() {
  const currency = await getDefaultTripCurrency();
  return <FormShell backHref="/trips" backLabel="Voltar às viagens" eyebrow="Nova viagem" icon="plane" title="Comece pelo essencial." description="Defina o período e as preferências gerais. Os destinos serão adicionados depois, sem limitar a viagem a uma única cidade.">
    <TripForm mode="create" initialValues={{ name: "", startDate: "", endDate: "", originLabel: "", returnLabel: "", travelersCount: "1", baseCurrency: currency, targetBudget: "", createRequestId: randomUUID() }} />
  </FormShell>;
}
