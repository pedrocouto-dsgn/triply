import type { Category, FinanceData } from "./types";

// Simplified budget view (owner request 2026-10-05): every planned cost is an "expense"
// with one value (committed, else estimated) and a paid amount (payments net of refunds).
export type ExpenseRow = { id: string; title: string; categoryId: string; stopId: string | null; valueMinor: bigint; paidMinor: bigint; paid: boolean };
export type CategoryTotals = { category: Category; totalMinor: bigint; paidMinor: bigint; expenses: ExpenseRow[] };

const minor = (value: string | null) => (value === null ? 0n : BigInt(value));

export function expenseRows(data: FinanceData): ExpenseRow[] {
  const refunds = new Map<string, bigint>();
  for (const adjustment of data.adjustments) if (adjustment.paymentId) refunds.set(adjustment.paymentId, (refunds.get(adjustment.paymentId) ?? 0n) + BigInt(adjustment.baseAmountMinor));
  const paidByCost = new Map<string, bigint>();
  for (const payment of data.payments) if (payment.costItemId) paidByCost.set(payment.costItemId, (paidByCost.get(payment.costItemId) ?? 0n) + BigInt(payment.baseAmountMinor) + (refunds.get(payment.id) ?? 0n));
  return data.costs.filter((cost) => cost.archivedAt === null).map((cost) => {
    const valueMinor = minor(cost.committedBaseMinor ?? cost.estimatedBaseMinor);
    const paidMinor = paidByCost.get(cost.id) ?? 0n;
    return { id: cost.id, title: cost.title, categoryId: cost.categoryId, stopId: cost.stopId, valueMinor, paidMinor, paid: valueMinor > 0n ? paidMinor >= valueMinor : paidMinor > 0n };
  });
}

/** Categories that always get a card, so the main travel spends are visible from the start. */
export const FEATURED_CATEGORY_IDS = ["10000000-0000-4000-8000-000000000001", "10000000-0000-4000-8000-000000000002", "10000000-0000-4000-8000-000000000004"];

export function categoryTotals(data: FinanceData): CategoryTotals[] {
  const rows = expenseRows(data);
  const active = data.categories.filter((category) => category.archivedAt === null);
  const used = new Set(rows.map((row) => row.categoryId));
  return active
    .filter((category) => used.has(category.id) || FEATURED_CATEGORY_IDS.includes(category.id))
    .map((category) => {
      const expenses = rows.filter((row) => row.categoryId === category.id);
      return { category, expenses, totalMinor: expenses.reduce((sum, row) => sum + row.valueMinor, 0n), paidMinor: expenses.reduce((sum, row) => sum + row.paidMinor, 0n) };
    })
    .sort((a, b) => Number(b.totalMinor - a.totalMinor) || FEATURED_CATEGORY_IDS.indexOf(a.category.id) - FEATURED_CATEGORY_IDS.indexOf(b.category.id));
}

export function totalsByStop(data: FinanceData): Map<string, bigint> {
  const result = new Map<string, bigint>();
  for (const row of expenseRows(data)) if (row.stopId) result.set(row.stopId, (result.get(row.stopId) ?? 0n) + row.valueMinor);
  return result;
}
