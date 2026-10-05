import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/features/auth/options";
import { parseMoneyToMinorUnits } from "@/features/trips/money";
import { isIanaTimezone, zonedDateTimeToEpoch } from "./time";
import { LEG_STATUSES, TRAVEL_MODES, type LegFormValues, type StopFormValues } from "./types";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Introduza uma data válida.");
const optional = (max: number) => z.string().trim().max(max).transform((value) => value || null);

export const stopSchema = z.object({
  placeName: z.string().trim().min(1, "Introduza a cidade ou local.").max(120),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2,4}$/, "Use um código de país com 2 a 4 letras."),
  countryName: z.string().trim().min(1, "Introduza o país.").max(100),
  arrivalDate: date, departureDate: date,
  timezone: optional(100).refine((value) => value === null || isIanaTimezone(value), "Introduza uma timezone IANA válida, por exemplo Europe/Paris."),
  notes: optional(2000), createRequestId: z.string().uuid(),
}).superRefine((value, context) => {
  if (value.departureDate < value.arrivalDate) context.addIssue({ code: "custom", path: ["departureDate"], message: "A partida não pode ser anterior à chegada." });
});

export const legSchema = z.object({
  fromToken: z.string().min(1), toToken: z.string().min(1), mode: z.enum(TRAVEL_MODES), status: z.enum(LEG_STATUSES),
  departureDate: z.string(), departureTime: z.string(), departureTimezone: z.string().trim(),
  arrivalDate: z.string(), arrivalTime: z.string(), arrivalTimezone: z.string().trim(),
  operator: optional(120), reference: optional(120), priceAmount: z.string().trim(),
  priceCurrency: z.string().trim().toUpperCase(), notes: optional(2000), createRequestId: z.string().uuid(),
}).superRefine((value, context) => {
  for (const side of ["departure", "arrival"] as const) {
    const sideDate = value[`${side}Date`]; const sideTime = value[`${side}Time`]; const timezone = value[`${side}Timezone`];
    if (sideDate && !/^\d{4}-\d{2}-\d{2}$/.test(sideDate)) context.addIssue({ code: "custom", path: [`${side}Date`], message: "Introduza uma data válida." });
    if (sideTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(sideTime)) context.addIssue({ code: "custom", path: [`${side}Time`], message: "Introduza uma hora válida." });
    if (sideTime && !sideDate) context.addIssue({ code: "custom", path: [`${side}Date`], message: "A data é obrigatória quando indica uma hora." });
    if (timezone && !isIanaTimezone(timezone)) context.addIssue({ code: "custom", path: [`${side}Timezone`], message: "Selecione uma timezone válida ou deixe em branco." });
  }
  if (value.departureDate && value.arrivalDate) {
    if (value.departureTime && value.arrivalTime && isIanaTimezone(value.departureTimezone) && isIanaTimezone(value.arrivalTimezone)) {
      const departure = zonedDateTimeToEpoch(value.departureDate, value.departureTime, value.departureTimezone);
      const arrival = zonedDateTimeToEpoch(value.arrivalDate, value.arrivalTime, value.arrivalTimezone);
      if (departure !== null && arrival !== null && arrival < departure) context.addIssue({ code: "custom", path: ["arrivalTime"], message: "A chegada não pode ocorrer antes da partida." });
    } else if (value.departureTime && value.arrivalTime && value.arrivalDate === value.departureDate && !value.departureTimezone && !value.arrivalTimezone && value.arrivalTime < value.departureTime) context.addIssue({ code: "custom", path: ["arrivalTime"], message: "A chegada não pode ocorrer antes da partida." });
    else if (value.arrivalDate < value.departureDate) context.addIssue({ code: "custom", path: ["arrivalDate"], message: "A chegada não pode ser anterior à partida." });
  }
  const currencyValid = SUPPORTED_CURRENCIES.some((currency) => currency === value.priceCurrency);
  if (value.priceAmount && !currencyValid) context.addIssue({ code: "custom", path: ["priceCurrency"], message: "Selecione a moeda do preço." });
  if (value.priceAmount && (value.priceAmount.startsWith("-") || !currencyValid || parseMoneyToMinorUnits(value.priceAmount, value.priceCurrency as (typeof SUPPORTED_CURRENCIES)[number]) === null)) context.addIssue({ code: "custom", path: ["priceAmount"], message: "Introduza um valor válido, por exemplo 120 ou 120,50." });
});

export const uuidSchema = z.string().uuid();
export function stopValues(data: FormData): StopFormValues { return { placeName: String(data.get("placeName") ?? ""), countryCode: String(data.get("countryCode") ?? ""), countryName: String(data.get("countryName") ?? ""), arrivalDate: String(data.get("arrivalDate") ?? ""), departureDate: String(data.get("departureDate") ?? ""), timezone: String(data.get("timezone") ?? ""), notes: String(data.get("notes") ?? ""), createRequestId: String(data.get("createRequestId") ?? ""), isFinal: data.get("isFinal") === "on" ? "on" : "" }; }
export function legValues(data: FormData): LegFormValues { return { fromToken: String(data.get("fromToken") ?? ""), toToken: String(data.get("toToken") ?? ""), mode: String(data.get("mode") ?? ""), status: String(data.get("status") ?? ""), departureDate: String(data.get("departureDate") ?? ""), departureTime: String(data.get("departureTime") ?? ""), departureTimezone: String(data.get("departureTimezone") ?? ""), arrivalDate: String(data.get("arrivalDate") ?? ""), arrivalTime: String(data.get("arrivalTime") ?? ""), arrivalTimezone: String(data.get("arrivalTimezone") ?? ""), operator: String(data.get("operator") ?? ""), reference: String(data.get("reference") ?? ""), priceAmount: String(data.get("priceAmount") ?? ""), priceCurrency: String(data.get("priceCurrency") ?? ""), notes: String(data.get("notes") ?? ""), createRequestId: String(data.get("createRequestId") ?? "") }; }
