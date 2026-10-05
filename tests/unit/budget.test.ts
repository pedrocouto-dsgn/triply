import { describe, expect, it } from "vitest";
import { categoryTotals, expenseRows, FEATURED_CATEGORY_IDS, totalsByStop } from "../../features/finance/budget";
import type { FinanceData } from "../../features/finance/types";

const [lodging, transport, activities] = FEATURED_CATEGORY_IDS;
const cost = (id: string, categoryId: string, value: string | null, extra: Partial<FinanceData["costs"][number]> = {}): FinanceData["costs"][number] => ({ id, tripId: "t", categoryId, title: id, scopeType: "trip", stopId: null, travelLegId: null, estimatedOriginalMinor: null, estimatedCurrency: null, estimatedBaseMinor: null, estimatedConversionRate: null, committedOriginalMinor: value, committedCurrency: value ? "EUR" : null, committedBaseMinor: value, committedConversionRate: value ? "1" : null, notes: null, archivedAt: null, ...extra });
const payment = (id: string, costItemId: string, amount: string) => ({ id, tripId: "t", costItemId, amountOriginalMinor: amount, currency: "EUR" as const, baseAmountMinor: amount, conversionRate: "1", paidOn: "2026-10-01", notes: null, createdAt: "" });
const data: FinanceData = {
  categories: [{ id: lodging, name: "Alojamento", isDefault: true, archivedAt: null }, { id: transport, name: "Transportes", isDefault: true, archivedAt: null }, { id: activities, name: "Atividades", isDefault: true, archivedAt: null }, { id: "custom", name: "Passagens", isDefault: false, archivedAt: null }],
  costs: [cost("hotel", lodging, "50000", { stopId: "ams", scopeType: "stop" }), cost("flight", "custom", "30000"), cost("old", lodging, "99900", { archivedAt: "2026-10-01" }), cost("tour", activities, null, { estimatedBaseMinor: "4000", estimatedOriginalMinor: "4000", estimatedCurrency: "EUR", estimatedConversionRate: "1" })],
  payments: [payment("p1", "hotel", "50000"), payment("p2", "flight", "10000")],
  actuals: [],
  adjustments: [{ id: "a1", tripId: "t", paymentId: "p1", actualExpenseId: null, amountOriginalMinor: "-20000", currency: "EUR", baseAmountMinor: "-20000", conversionRate: "1", adjustedOn: "2026-10-02", notes: "refund", createdAt: "" }],
};

describe("simplified budget", () => {
  it("uses one value per expense and nets refunds from paid", () => {
    const rows = Object.fromEntries(expenseRows(data).map((row) => [row.id, row]));
    expect(rows.hotel).toMatchObject({ valueMinor: 50000n, paidMinor: 30000n, paid: false });
    expect(rows.flight).toMatchObject({ valueMinor: 30000n, paidMinor: 10000n, paid: false });
    expect(rows.tour.valueMinor).toBe(4000n);
    expect(rows.old).toBeUndefined();
  });
  it("totals categories and always shows the featured ones", () => {
    const totals = Object.fromEntries(categoryTotals(data).map((item) => [item.category.name, item]));
    expect(totals.Alojamento).toMatchObject({ totalMinor: 50000n, paidMinor: 30000n });
    expect(totals.Passagens.totalMinor).toBe(30000n);
    expect(totals.Transportes.totalMinor).toBe(0n);
  });
  it("sums planned spend per destination", () => {
    expect(totalsByStop(data).get("ams")).toBe(50000n);
  });
});
