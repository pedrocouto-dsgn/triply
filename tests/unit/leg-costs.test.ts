import { describe, expect, it } from "vitest";
import { legCostTitle } from "@/features/route/leg-costs";
import type { Stop } from "@/features/route/types";
import { todayUtc } from "@/features/trips/lifecycle";

const stop = (id: string, position: number, placeName: string): Stop => ({ id, tripId: "t", position, placeName, countryCode: "PT", countryName: "Portugal", arrivalDate: "2026-10-01", departureDate: "2026-10-02", timezone: null, notes: null, createdAt: "", updatedAt: "" });
const porto = stop("11111111-1111-4111-8111-111111111111", 1, "Porto");
const paris = stop("22222222-2222-4222-8222-222222222222", 2, "Paris");

describe("ticket price mirrored in the budget", () => {
  it("names the expense after the leg's endpoints, including trip boundaries", () => {
    const trip = { originLabel: "Lisboa", returnLabel: null };
    expect(legCostTitle(trip, [paris, porto], "origin", `stop:${porto.id}`)).toBe("Passagem: Lisboa → Porto");
    expect(legCostTitle(trip, [porto, paris], `stop:${porto.id}`, `stop:${paris.id}`)).toBe("Passagem: Porto → Paris");
  });
  it("keeps the title within the 120-character limit", () => {
    const long = stop("33333333-3333-4333-8333-333333333333", 1, "X".repeat(120));
    expect(legCostTitle({ originLabel: "Lisboa", returnLabel: null }, [long], "origin", `stop:${long.id}`).length).toBe(120);
  });
  it("dates payments in UTC so they are never ahead of the database date", () => {
    expect(todayUtc(new Date("2026-10-05T23:30:00Z"))).toBe("2026-10-05");
  });
});
