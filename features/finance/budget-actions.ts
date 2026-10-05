"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { todayUtc } from "@/features/trips/lifecycle";
import { parseMoneyToMinorUnits } from "@/features/trips/money";
import { getOwnedTrip, requireTripUser } from "@/features/trips/queries";
import { getOwnedRoute } from "@/features/route/queries";
import { expenseRows } from "./budget";
import type { InlineState } from "./budget-types";
import { getOwnedFinance } from "./queries";

const uuid = z.string().uuid();
const ok: InlineState = { status: "success" };
const fail = (message: string): InlineState => ({ status: "error", message });
/** Database detail appended to an error, so a failure can be diagnosed (no sensitive data is involved). */
const detail = (error: { message?: string; code?: string } | null) => error?.message?.includes("future_payment") ? " A data do pagamento não pode ser futura." : error?.code ? ` (código ${error.code})` : "";
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
function refresh(tripId: string) { revalidatePath(`/trips/${tripId}`, "layout"); }

/** Objetivo: the trip's target budget (empty clears it). */
export async function updateTargetBudgetAction(tripId: string, _state: InlineState, data: FormData): Promise<InlineState> {
  const trip = uuid.safeParse(tripId).success ? await getOwnedTrip(tripId) : null;
  if (!trip) return fail("Viagem não encontrada.");
  const raw = text(data, "amount");
  const value = raw === "" ? null : parseMoneyToMinorUnits(raw, trip.baseCurrency);
  if (raw !== "" && value === null) return fail("Introduza um valor válido, por exemplo 2500 ou 2500,50.");
  const { supabase } = await requireTripUser();
  const { error } = await supabase.from("trips").update({ target_budget_minor: value?.toString() ?? null }).eq("id", tripId);
  if (error) return fail("Não foi possível guardar o objetivo.");
  refresh(tripId); return ok;
}

/** Guardado: money set aside for the trip and not yet spent. */
export async function updateSavedFundsAction(tripId: string, _state: InlineState, data: FormData): Promise<InlineState> {
  const trip = uuid.safeParse(tripId).success ? await getOwnedTrip(tripId) : null;
  if (!trip) return fail("Viagem não encontrada.");
  if (trip.archivedAt) return fail("Uma viagem arquivada não pode ser alterada.");
  const value = parseMoneyToMinorUnits(text(data, "amount") || "0", trip.baseCurrency);
  if (value === null) return fail("Introduza um valor válido, por exemplo 800 ou 800,50.");
  const { supabase } = await requireTripUser();
  const { error } = await supabase.from("savings_plans").upsert({ trip_id: tripId, current_available_minor: value.toString(), currency: trip.baseCurrency, last_request_id: crypto.randomUUID() }, { onConflict: "trip_id" });
  if (error) return fail("Não foi possível guardar o valor.");
  refresh(tripId); return ok;
}

async function context(tripId: string) {
  if (!uuid.safeParse(tripId).success) return null;
  const [trip, route, finance] = await Promise.all([getOwnedTrip(tripId), getOwnedRoute(tripId), getOwnedFinance(tripId)]);
  return trip && route && finance ? { trip, route, finance } : null;
}

/** Create or edit an expense (cost item) with a single value; optionally mark it paid. */
export async function saveExpenseAction(tripId: string, costId: string, _state: InlineState, data: FormData): Promise<InlineState> {
  const ctx = await context(tripId);
  if (!ctx) return fail("Viagem não encontrada.");
  const title = text(data, "title"), categoryId = text(data, "categoryId"), stopId = text(data, "stopId");
  if (!title || title.length > 120) return fail("Indique uma descrição (até 120 caracteres).");
  if (!ctx.finance.categories.some((category) => category.id === categoryId && category.archivedAt === null)) return fail("Escolha uma categoria.");
  if (stopId && !ctx.route.stops.some((stop) => stop.id === stopId)) return fail("Destino inválido.");
  const value = parseMoneyToMinorUnits(text(data, "amount"), ctx.trip.baseCurrency);
  if (value === null) return fail("Introduza um valor válido, por exemplo 120 ou 120,50.");
  const currency = ctx.trip.baseCurrency;
  const payload = { category_id: categoryId, title, scope_type: stopId ? "stop" : "trip", stop_id: stopId || null, travel_leg_id: null, committed_original_minor: value.toString(), committed_currency: currency, committed_base_minor: value.toString(), committed_conversion_rate: "1" };
  const { supabase } = await requireTripUser();
  let id = costId;
  if (costId) {
    const existing = ctx.finance.costs.find((cost) => cost.id === costId);
    if (!existing) return fail("Gasto não encontrado.");
    const { error } = await supabase.from("cost_items").update(existing.scopeType === "travel_leg" && !stopId ? { ...payload, scope_type: "travel_leg", stop_id: null, travel_leg_id: existing.travelLegId } : payload).eq("id", costId).eq("trip_id", tripId);
    if (error) return fail("Não foi possível guardar o gasto.");
    // A ticket expense keeps its travel leg's "valor da passagem" in step.
    if (existing.scopeType === "travel_leg" && existing.travelLegId && !stopId) await supabase.from("travel_legs").update({ price_minor: value.toString(), price_currency: currency }).eq("id", existing.travelLegId).eq("trip_id", tripId);
  } else {
    const requestId = uuid.safeParse(text(data, "requestId")).success ? text(data, "requestId") : crypto.randomUUID();
    const { data: created, error } = await supabase.from("cost_items").insert({ ...payload, trip_id: tripId, create_request_id: requestId }).select("id").single();
    // Same request submitted again (e.g. after a failed "paid" step): reuse the expense instead of duplicating it.
    const { data: repeated } = error?.code === "23505" ? await supabase.from("cost_items").select("id").eq("trip_id", tripId).eq("create_request_id", requestId).maybeSingle() : { data: null };
    if (!repeated && (error || !created)) return fail(`Não foi possível criar o gasto.${detail(error)}`);
    id = String(repeated?.id ?? created!.id);
  }
  if (data.get("paid") === "on") {
    const paidSoFar = expenseRows(ctx.finance).find((row) => row.id === id)?.paidMinor ?? 0n;
    if (value > paidSoFar) {
      const { error } = await supabase.from("payments").insert({ trip_id: tripId, cost_item_id: id, amount_original_minor: (value - paidSoFar).toString(), currency, base_amount_minor: (value - paidSoFar).toString(), conversion_rate: "1", paid_on: todayUtc(), notes: "Marcado como pago", request_id: crypto.randomUUID() });
      if (error) { refresh(tripId); return fail(`O gasto foi guardado, mas não foi possível marcá-lo como pago.${detail(error)}`); }
    }
  }
  refresh(tripId); return ok;
}

/** Pay the remaining amount, or reverse all payments (kept as refunds, never deleted). */
export async function setExpensePaidAction(tripId: string, costId: string, paid: boolean): Promise<InlineState> {
  const ctx = await context(tripId);
  const row = ctx ? expenseRows(ctx.finance).find((item) => item.id === costId) : undefined;
  if (!ctx || !row) return fail("Gasto não encontrado.");
  const { supabase } = await requireTripUser();
  const currency = ctx.trip.baseCurrency;
  if (paid) {
    if (row.valueMinor > row.paidMinor) {
      const { error } = await supabase.from("payments").insert({ trip_id: tripId, cost_item_id: costId, amount_original_minor: (row.valueMinor - row.paidMinor).toString(), currency, base_amount_minor: (row.valueMinor - row.paidMinor).toString(), conversion_rate: "1", paid_on: todayUtc(), notes: "Marcado como pago", request_id: crypto.randomUUID() });
      if (error) return fail(`Não foi possível marcar como pago.${detail(error)}`);
    }
  } else {
    const refunded = new Map<string, bigint>();
    for (const adjustment of ctx.finance.adjustments) if (adjustment.paymentId) refunded.set(adjustment.paymentId, (refunded.get(adjustment.paymentId) ?? 0n) + BigInt(adjustment.baseAmountMinor));
    for (const payment of ctx.finance.payments.filter((item) => item.costItemId === costId)) {
      const remaining = BigInt(payment.baseAmountMinor) + (refunded.get(payment.id) ?? 0n);
      const original = payment.currency === currency ? remaining : remaining * BigInt(payment.amountOriginalMinor) / (BigInt(payment.baseAmountMinor) || 1n);
      if (remaining <= 0n || original <= 0n) continue;
      const { error } = await supabase.from("financial_adjustments").insert({ trip_id: tripId, payment_id: payment.id, amount_original_minor: `-${original}`, currency: payment.currency, base_amount_minor: `-${remaining}`, conversion_rate: payment.conversionRate, adjusted_on: todayUtc(), notes: "Marcado como por pagar", request_id: crypto.randomUUID() });
      if (error) return fail("Não foi possível marcar como por pagar.");
    }
  }
  refresh(tripId); return ok;
}

/** Remove an expense from the budget: payments are reversed and the item is archived (history kept). */
export async function deleteExpenseAction(tripId: string, costId: string): Promise<InlineState> {
  const reversed = await setExpensePaidAction(tripId, costId, false);
  if (reversed.status === "error") return reversed;
  const { supabase } = await requireTripUser();
  const { error } = await supabase.from("cost_items").update({ archived_at: new Date().toISOString() }).eq("id", costId).eq("trip_id", tripId);
  if (error) return fail("Não foi possível remover o gasto.");
  refresh(tripId); return ok;
}

/** New custom category, returned inline. */
export async function createCategoryInlineAction(tripId: string, _state: InlineState, data: FormData): Promise<InlineState> {
  if (!uuid.safeParse(tripId).success || !await getOwnedTrip(tripId)) return fail("Viagem não encontrada.");
  const name = text(data, "name");
  if (!name || name.length > 60) return fail("Indique um nome (até 60 caracteres).");
  const { supabase, user } = await requireTripUser();
  const { error } = await supabase.from("expense_categories").insert({ user_id: user.id, name });
  if (error) return fail(error.code === "23505" ? "Já existe uma categoria com este nome." : "Não foi possível criar a categoria.");
  refresh(tripId); return ok;
}
