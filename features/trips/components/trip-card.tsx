import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { DestinationImage } from "@/components/ui/media";
import { calendarDaysBetween } from "@/features/savings/calculations";
import { formatTripDateRange } from "../date";
import { deriveTripLifecycle, lifecycleLabels } from "../lifecycle";
import { formatMinorUnits } from "../money";
import type { Trip } from "../types";

export function countdownText(trip: Trip, today: string): string {
  const days = calendarDaysBetween(today, trip.startDate);
  if (days > 1) return `Faltam ${days} dias`;
  if (days === 1) return "Parte amanhã";
  if (days === 0) return "Parte hoje";
  return today <= trip.endDate ? "A decorrer" : "Concluída";
}

export function TripCard({ trip, today }: { trip: Trip; today: string }) {
  const lifecycle = deriveTripLifecycle(trip, today);
  const budget = formatMinorUnits(trip.targetBudgetMinor, trip.baseCurrency);
  const nights = calendarDaysBetween(trip.startDate, trip.endDate);
  return <article className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-primary/50">
    <DestinationImage seed={trip.name} className="h-44">
      <div className="flex h-full flex-col justify-between p-4 text-white">
        <div className="flex items-start justify-between gap-2"><span className="rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold backdrop-blur">{lifecycleLabels[lifecycle]}</span>{lifecycle === "upcoming" || lifecycle === "ongoing" ? <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">{countdownText(trip, today)}</span> : null}</div>
        <h3 className="break-words text-xl font-semibold tracking-tight drop-shadow"><Link className="hover:text-white/85" href={`/trips/${trip.id}`}>{trip.name}</Link></h3>
      </div>
    </DestinationImage>
    <div className="flex flex-1 flex-col p-5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon name="calendar" size={16} />{formatTripDateRange(trip.startDate, trip.endDate)}</p>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted-foreground">Noites</dt><dd className="mt-1 font-semibold">{nights}</dd></div>
        <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted-foreground">Viajantes</dt><dd className="mt-1 font-semibold">{trip.travelersCount}</dd></div>
        <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted-foreground">Moeda</dt><dd className="mt-1 font-semibold">{trip.baseCurrency}</dd></div>
      </dl>
      <div className="mt-auto flex items-end justify-between gap-3 pt-5"><div className="min-w-0"><p className="text-xs text-muted-foreground">Orçamento desejado</p><p className="mt-1 truncate text-lg font-semibold tabular-nums">{budget ?? "Não definido"}</p></div><Link href={`/trips/${trip.id}`} aria-label={`Abrir ${trip.name}`} className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground hover:bg-primary-hover"><Icon name="arrowRight" size={18} /></Link></div>
    </div>
  </article>;
}
