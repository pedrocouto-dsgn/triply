"use client";

import Link from "next/link";
import { useRef } from "react";
import { Icon, travelModeIcons } from "@/components/ui/icons";
import { Badge, button } from "@/components/ui/page";
import { formatTripDate } from "@/features/trips/date";
import { formatMinorUnits } from "@/features/trips/money";
import type { TravelLeg } from "../types";

const modes = { plane: "Avião", train: "Comboio", bus: "Autocarro", car: "Carro", ferry: "Ferry", other: "Outro" };
const statuses = { planned: "Planeado", booked: "Reservado", paid: "Pago", cancelled: "Cancelado", completed: "Concluído" };
const paidTone = (status: TravelLeg["status"]) => status === "booked" || status === "paid" || status === "completed" ? "success" : "neutral";

/** Transport card on the route page; clicking it opens a pop-up with the ticket details. */
export function LegCard({ tripId, leg, fromLabel, toLabel }: { tripId: string; leg: TravelLeg; fromLabel: string; toLabel: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const price = leg.priceMinor && leg.priceCurrency ? formatMinorUnits(leg.priceMinor, leg.priceCurrency) : null;
  const editHref = `/trips/${tripId}/transport/${leg.id}/edit`;
  return <>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
      <button type="button" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" aria-label={`Ver passagem ${fromLabel} → ${toLabel}`} className="min-w-0 flex-1 rounded-xl text-left hover:opacity-90">
        <p className="flex flex-wrap items-center gap-2"><strong>{modes[leg.mode]}</strong><Badge tone={paidTone(leg.status)}>{statuses[leg.status]}</Badge><span className="inline-flex items-center gap-1 text-xs text-link"><Icon name="arrowUpRight" size={12} />Ver passagem</span></p>
        {leg.operator ? <p className="mt-1 text-muted-foreground">{leg.operator}</p> : null}
        {price ? <p className="mt-1 font-medium tabular-nums">{price}</p> : null}
      </button>
      <Link className="font-medium text-link underline" href={editHref}>Editar</Link>
    </div>

    <dialog ref={dialog} aria-labelledby={`leg-${leg.id}-title`} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} className="m-auto w-[min(560px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-muted text-link"><Icon name={travelModeIcons[leg.mode]} size={20} /></span>
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Passagem · {modes[leg.mode]}</p><h2 id={`leg-${leg.id}-title`} className="mt-1 break-words text-2xl font-light tracking-tight">{fromLabel} → {toLabel}</h2><div className="mt-2"><Badge tone={paidTone(leg.status)}>{statuses[leg.status]}</Badge></div></div>
        </div>
        <button type="button" onClick={() => dialog.current?.close()} aria-label="Fechar" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-elevated hover:bg-muted"><Icon name="plus" size={18} className="rotate-45" /></button>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <When title="Partida" place={fromLabel} date={leg.departureDate} time={leg.departureTime} timezone={leg.departureTimezone} />
          <When title="Chegada" place={toLabel} date={leg.arrivalDate} time={leg.arrivalTime} timezone={leg.arrivalTimezone} />
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <Fact label="Valor da passagem" value={price ?? "—"} />
          <Fact label="Operador" value={leg.operator ?? "—"} />
          <Fact label="Referência" value={leg.reference ?? "—"} selectable />
        </dl>
        {leg.notes ? <div className="rounded-2xl bg-surface p-4 text-sm"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas</p><p className="mt-1 whitespace-pre-wrap break-words">{leg.notes}</p></div> : null}
        {leg.reviewRequired ? <p className="text-sm text-warning">A ordem da rota mudou: reveja esta ligação.</p> : null}
        <div className="flex flex-wrap gap-2 border-t border-border pt-4"><Link href={editHref} className={button.primary}><Icon name="pencil" size={16} />Editar passagem</Link><Link href={`/trips/${tripId}/finance`} className={button.secondary}><Icon name="wallet" size={16} />Ver nos gastos</Link><button type="button" onClick={() => dialog.current?.close()} className={button.ghost}>Fechar</button></div>
      </div>
    </dialog>
  </>;
}

function When({ title, place, date, time, timezone }: { title: string; place: string; date: string | null; time: string | null; timezone: string | null }) {
  return <div className="rounded-2xl border border-border p-4 text-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
    <p className="mt-1 truncate font-semibold">{place}</p>
    <p className="mt-1 flex items-center gap-1.5 text-muted-foreground"><Icon name="calendar" size={14} />{date ? formatTripDate(date) : "Data por definir"}{time ? ` · ${time}` : ""}</p>
    {timezone ? <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Icon name="clock" size={12} />{timezone}</p> : null}
  </div>;
}

function Fact({ label, value, selectable }: { label: string; value: string; selectable?: boolean }) {
  return <div className="min-w-0 rounded-2xl bg-surface p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-1 break-words font-semibold ${selectable ? "select-all" : ""}`}>{value}</dd></div>;
}
