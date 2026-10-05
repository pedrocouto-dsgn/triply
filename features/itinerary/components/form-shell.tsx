import { FormShell } from "@/components/ui/page";

export function Shell({ tripId, title, children }: { tripId: string; title: string; children: React.ReactNode }) {
  return <FormShell backHref={`/trips/${tripId}/itinerary`} backLabel="Itinerário" eyebrow="Itinerário diário" icon="calendar" title={title}>{children}</FormShell>;
}
