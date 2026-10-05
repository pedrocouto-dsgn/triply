import type { Trip, TripLifecycle } from "./types";

/** Today's date in UTC — never ahead of the database's current_date, so it is safe for "paid on" records. */
export function todayUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function todayInLisbon(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function deriveTripLifecycle(
  trip: Pick<Trip, "startDate" | "endDate" | "archivedAt">,
  today: string,
): TripLifecycle {
  if (trip.archivedAt !== null) return "archived";
  if (today < trip.startDate) return "upcoming";
  if (today > trip.endDate) return "past";
  return "ongoing";
}

const lifecycleRank: Record<Exclude<TripLifecycle, "archived">, number> = {
  ongoing: 0,
  upcoming: 1,
  past: 2,
};

export function sortActiveTrips(trips: Trip[], today: string): Trip[] {
  return [...trips].sort((left, right) => {
    const leftLifecycle = deriveTripLifecycle(left, today) as Exclude<TripLifecycle, "archived">;
    const rightLifecycle = deriveTripLifecycle(right, today) as Exclude<TripLifecycle, "archived">;
    const lifecycleDifference = lifecycleRank[leftLifecycle] - lifecycleRank[rightLifecycle];
    if (lifecycleDifference !== 0) return lifecycleDifference;
    if (leftLifecycle === "past") return right.endDate.localeCompare(left.endDate);
    return left.startDate.localeCompare(right.startDate);
  });
}

export const lifecycleLabels: Record<TripLifecycle, string> = {
  upcoming: "Próxima",
  ongoing: "A decorrer",
  past: "Passada",
  archived: "Arquivada",
};
