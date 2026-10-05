import { FormShell } from "@/components/ui/page";

export function Shell({ tripId, title, children }: { tripId: string; title: string; children: React.ReactNode }) {
  return <FormShell backHref={`/trips/${tripId}/finance`} backLabel="Finanças" eyebrow="Orçamento e despesas" icon="wallet" title={title}>{children}</FormShell>;
}
