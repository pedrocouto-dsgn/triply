import { FormShell } from "@/components/ui/page";

export function Shell({ tripId, title, children }: { tripId: string; title: string; children: React.ReactNode }) {
  return <FormShell backHref={`/trips/${tripId}/planning`} backLabel="Reservas e checklist" eyebrow="Reservas e checklist" icon="checklist" title={title}>{children}</FormShell>;
}
