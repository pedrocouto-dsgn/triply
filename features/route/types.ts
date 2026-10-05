import type { CurrencyCode } from "@/features/trips/types";

export const TRAVEL_MODES = ["plane", "train", "bus", "car", "ferry", "other"] as const;
export const LEG_STATUSES = ["planned", "booked", "paid", "cancelled", "completed"] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];
export type LegStatus = (typeof LEG_STATUSES)[number];
export type RoutePointKind = "origin_boundary" | "stop" | "return_boundary";

export type Stop = {
  id: string; tripId: string; position: number; placeName: string; countryCode: string;
  countryName: string; arrivalDate: string; departureDate: string; timezone: string | null;
  notes: string | null; createdAt: string; updatedAt: string;
};

export type TravelLeg = {
  id: string; tripId: string; fromKind: RoutePointKind; fromStopId: string | null;
  toKind: RoutePointKind; toStopId: string | null; mode: TravelMode; status: LegStatus;
  departureDate: string | null; departureTime: string | null; departureTimezone: string | null;
  arrivalDate: string | null; arrivalTime: string | null; arrivalTimezone: string | null;
  operator: string | null; reference: string | null; priceMinor: string | null;
  priceCurrency: CurrencyCode | null; notes: string | null; reviewRequired: boolean;
};

export type StopFormValues = {
  placeName: string; countryCode: string; countryName: string; arrivalDate: string;
  departureDate: string; timezone: string; notes: string; createRequestId: string;
  /** "on" when this is the final destination: the stay lasts until the end of the trip, no departure asked. */
  isFinal: string;
};

export type LegFormValues = {
  fromToken: string; toToken: string; mode: string; status: string; departureDate: string;
  departureTime: string; departureTimezone: string; arrivalDate: string; arrivalTime: string;
  arrivalTimezone: string; operator: string; reference: string; priceAmount: string;
  priceCurrency: string; notes: string; createRequestId: string;
};

export type RouteActionState = { status: "idle" | "error"; message?: string; fieldErrors?: Record<string, string>; values?: StopFormValues | LegFormValues };
export const initialRouteActionState: RouteActionState = { status: "idle" };

export type RouteData = { stops: Stop[]; legs: TravelLeg[] };
export type RoutePoint = { token: string; kind: RoutePointKind; stopId: string | null; label: string };
export type RouteAdjacency = { from: RoutePoint; to: RoutePoint; activeLeg: TravelLeg | null };
