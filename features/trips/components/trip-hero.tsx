import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { HeroChip, PageHero } from "@/components/ui/page";
import type { PlaceImage } from "@/features/media/types";
import { resolveStopImages } from "@/features/route/images";
import { getOwnedRoute } from "@/features/route/queries";
import { calendarDaysBetween } from "@/features/savings/calculations";
import { formatTripDateRange } from "../date";
import type { Trip } from "../types";

export type TripTab = "overview" | "route" | "finance" | "savings" | "itinerary" | "planning" | "documents" | "settings";
const tabs: { key: TripTab; label: string; icon: IconName; path: string }[] = [
  { key: "overview", label: "Visão geral", icon: "home", path: "" },
  { key: "route", label: "Rota", icon: "route", path: "/route" },
  { key: "finance", label: "Orçamento", icon: "wallet", path: "/finance" },
  { key: "savings", label: "Poupança", icon: "piggy", path: "/savings" },
  { key: "itinerary", label: "Itinerário", icon: "calendar", path: "/itinerary" },
  { key: "planning", label: "Planeamento", icon: "checklist", path: "/planning" },
  { key: "documents", label: "Documentos", icon: "file", path: "/documents" },
  { key: "settings", label: "Definições", icon: "settings", path: "/settings" },
];

export function TripTabs({ tripId, active }: { tripId: string; active: TripTab }) {
  return <nav aria-label="Secções da viagem" className="scroll-row -mb-1 rounded-full border border-white/10 bg-black/45 p-1.5 backdrop-blur-md sm:w-fit sm:max-w-full">
    {tabs.map((tab) => <Link key={tab.key} href={`/trips/${tripId}${tab.path}`} aria-current={tab.key === active ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ${tab.key === active ? "bg-primary text-primary-foreground" : "text-white/80 hover:bg-white/10 hover:text-white"}`}><Icon name={tab.icon} size={15} />{tab.label}</Link>)}
  </nav>;
}

/** First destination photo for a trip, or null for the illustrated fallback. */
export async function getTripCover(tripId: string): Promise<PlaceImage | null> {
  try {
    const route = await getOwnedRoute(tripId);
    const first = route?.stops[0];
    if (!first) return null;
    return (await resolveStopImages([first]))[first.id] ?? null;
  } catch {
    return null;
  }
}

/** Shared full-width banner for every trip page. */
export async function TripHero({ trip, active, title, eyebrow, description, actions, cover, today, size = "md" }: { trip: Trip; active: TripTab; title?: ReactNode; eyebrow?: ReactNode; description?: ReactNode; actions?: ReactNode; cover?: PlaceImage | null; today?: string; size?: "sm" | "md" | "lg" }) {
  const image = cover === undefined ? await getTripCover(trip.id) : cover;
  const days = calendarDaysBetween(trip.startDate, trip.endDate) + 1;
  const countdown = today ? calendarDaysBetween(today, trip.startDate) : null;
  return <PageHero seed={trip.name} image={image} size={size}
    back={active === "overview" ? { href: "/trips", label: "Todas as viagens" } : { href: `/trips/${trip.id}`, label: trip.name }}
    eyebrow={eyebrow ?? <><Icon name="calendar" size={14} />{formatTripDateRange(trip.startDate, trip.endDate)}</>}
    title={title ?? trip.name}
    description={description}
    actions={actions}
    meta={active === "overview" ? <><HeroChip icon="sun">{days} dias</HeroChip><HeroChip icon="users">{trip.travelersCount} {trip.travelersCount === 1 ? "viajante" : "viajantes"}</HeroChip>{countdown !== null && countdown > 0 ? <HeroChip icon="clock">Faltam {countdown} dias</HeroChip> : null}{trip.archivedAt ? <HeroChip icon="archive">Arquivada</HeroChip> : null}</> : undefined}
  ><TripTabs tripId={trip.id} active={active} /></PageHero>;
}
