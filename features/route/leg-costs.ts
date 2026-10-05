import type { createClient } from "@/lib/supabase/server";
import { todayUtc } from "@/features/trips/lifecycle";
import type { Trip } from "@/features/trips/types";
import { buildRoutePoints } from "./route-model";
import type { LegStatus, Stop } from "./types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Owner request 2026-10-05: a ticket price ("valor da passagem") on a travel leg is mirrored
// as one expense in the budget (category Transportes, scoped to the leg), so the two never drift.
export const TRANSPORT_CATEGORY_ID = "10000000-0000-4000-8000-000000000002";

type Leg = { id: string; fromToken: string; toToken: string; status: LegStatus; priceMinor: bigint | null; priceCurrency: string | null };

export function legCostTitle(trip: Pick<Trip, "originLabel" | "returnLabel">, stops: Stop[], fromToken: string, toToken: string): string {
  const points = buildRoutePoints(trip, stops);
  const label = (token: string, fallback: string) => points.find((point) => point.token === token)?.label ?? fallback;
  return `Passagem: ${label(fromToken, "Origem")} → ${label(toToken, "Regresso")}`.slice(0, 120);
}

/** Create, update or archive the leg's expense. Returns false when the budget could not be updated. */
export async function syncLegCost(supabase: SupabaseClient, trip: Trip, stops: Stop[], leg: Leg): Promise<boolean> {
  const { data: existing, error: findError } = await supabase.from("cost_items").select("id,archived_at").eq("trip_id", trip.id).eq("travel_leg_id", leg.id).order("created_at").limit(1).maybeSingle();
  if (findError) return false;
  const priced = leg.priceMinor !== null && leg.priceCurrency === trip.baseCurrency && leg.status !== "cancelled";
  if (!priced) {
    if (!existing || existing.archived_at) return true;
    const { error } = await supabase.from("cost_items").update({ archived_at: new Date().toISOString() }).eq("id", existing.id).eq("trip_id", trip.id);
    return !error;
  }
  const value = leg.priceMinor!.toString();
  const money = { committed_original_minor: value, committed_currency: trip.baseCurrency, committed_base_minor: value, committed_conversion_rate: "1" };
  let costId: string;
  if (existing) {
    const { error } = await supabase.from("cost_items").update({ ...money, archived_at: null }).eq("id", existing.id).eq("trip_id", trip.id);
    if (error) return false;
    costId = existing.id as string;
  } else {
    const { data: created, error } = await supabase.from("cost_items").insert({ ...money, trip_id: trip.id, category_id: TRANSPORT_CATEGORY_ID, title: legCostTitle(trip, stops, leg.fromToken, leg.toToken), scope_type: "travel_leg", travel_leg_id: leg.id, create_request_id: crypto.randomUUID() }).select("id").single();
    if (error || !created) return false;
    costId = created.id as string;
  }
  if (leg.status !== "paid") return true;
  // Status "Pago": make sure the expense is fully paid too.
  const { data: payments, error: paymentsError } = await supabase.from("payments").select("id,base_amount_minor").eq("trip_id", trip.id).eq("cost_item_id", costId);
  if (paymentsError) return false;
  const ids = (payments ?? []).map((payment) => payment.id as string);
  const { data: refunds, error: refundsError } = ids.length ? await supabase.from("financial_adjustments").select("base_amount_minor").eq("trip_id", trip.id).in("payment_id", ids) : { data: [], error: null };
  if (refundsError) return false;
  const paid = (payments ?? []).reduce((sum, row) => sum + BigInt(String(row.base_amount_minor)), 0n) + (refunds ?? []).reduce((sum, row) => sum + BigInt(String(row.base_amount_minor)), 0n);
  if (paid >= leg.priceMinor!) return true;
  const missing = (leg.priceMinor! - paid).toString();
  const { error } = await supabase.from("payments").insert({ trip_id: trip.id, cost_item_id: costId, amount_original_minor: missing, currency: trip.baseCurrency, base_amount_minor: missing, conversion_rate: "1", paid_on: todayUtc(), notes: "Passagem marcada como paga", request_id: crypto.randomUUID() });
  return !error;
}

/**
 * Before legs are deleted: expenses without payment history are removed; those with history
 * are kept as whole-trip expenses (financial records are never destroyed).
 */
export async function releaseLegCosts(supabase: SupabaseClient, tripId: string, legIds: string[]): Promise<boolean> {
  if (!legIds.length) return true;
  const { data: costs, error } = await supabase.from("cost_items").select("id").eq("trip_id", tripId).in("travel_leg_id", legIds);
  if (error) return false;
  for (const cost of costs ?? []) {
    const { error: deleteError } = await supabase.from("cost_items").delete().eq("id", cost.id).eq("trip_id", tripId);
    if (!deleteError) continue;
    const { error: detachError } = await supabase.from("cost_items").update({ scope_type: "trip", travel_leg_id: null, stop_id: null }).eq("id", cost.id).eq("trip_id", tripId);
    if (detachError) return false;
  }
  return true;
}
