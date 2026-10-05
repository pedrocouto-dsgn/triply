import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icons";
import { HeroChip, PageHero } from "@/components/ui/page";
import type { PlaceImage } from "@/features/media/types";
import { resolveStopImages } from "@/features/route/images";
import { getOwnedRoute } from "@/features/route/queries";
import { calendarDaysBetween } from "@/features/savings/calculations";
import { formatTripDateRange } from "../date";
import type { Trip } from "../types";

export type TripTab = "overview" | "route" | "finance" | "savings" | "itinerary" | "planning" | "documents" | "settings";

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
export async function TripHero({ trip, active, title, eyebrow, description, actions, cover, today, size = "md", backdrop }: { trip: Trip; active: TripTab; title?: ReactNode; eyebrow?: ReactNode; description?: ReactNode; actions?: ReactNode; cover?: PlaceImage | null; today?: string; size?: "sm" | "md" | "lg"; backdrop?: ReactNode }) {
  const image = backdrop ? null : cover === undefined ? await getTripCover(trip.id) : cover;
  const days = calendarDaysBetween(trip.startDate, trip.endDate) + 1;
  const countdown = today ? calendarDaysBetween(today, trip.startDate) : null;
  return <PageHero seed={trip.name} image={image} backdrop={backdrop} size={size}
    back={active === "overview" ? { href: "/trips", label: "Todas as viagens" } : { href: `/trips/${trip.id}`, label: trip.name }}
    eyebrow={eyebrow ?? <><Icon name="calendar" size={14} />{formatTripDateRange(trip.startDate, trip.endDate)}</>}
    title={title ?? trip.name}
    description={description}
    actions={actions}
    meta={active === "overview" ? <><HeroChip icon="sun">{days} dias</HeroChip><HeroChip icon="users">{trip.travelersCount} {trip.travelersCount === 1 ? "viajante" : "viajantes"}</HeroChip>{countdown !== null && countdown > 0 ? <HeroChip icon="clock">Faltam {countdown} dias</HeroChip> : null}{trip.archivedAt ? <HeroChip icon="archive">Arquivada</HeroChip> : null}</> : undefined}
  />;
}
