"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Icon, travelModeIcons } from "@/components/ui/icons";
import { DestinationImage } from "@/components/ui/media";
import { Badge, button } from "@/components/ui/page";
import type { PlaceImage } from "@/features/media/types";
import { formatTripDate, formatTripDateRange } from "@/features/trips/date";
import type { Stop, TravelLeg } from "../types";

const modes = { plane: "Avião", train: "Comboio", bus: "Autocarro", car: "Carro", ferry: "Ferry", other: "Outro" };
const statuses = { planned: "Planeado", booked: "Reservado", paid: "Pago", cancelled: "Cancelado", completed: "Concluído" };
const nightsBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export function RouteCarousel({ tripId, stops, legs, images, originLabel, returnLabel, currentStopId }: { tripId: string; stops: Stop[]; legs: TravelLeg[]; images: Record<string, PlaceImage>; originLabel: string | null; returnLabel: string | null; currentStopId: string | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Stop | null>(null);
  const activeLegs = legs.filter((leg) => leg.status !== "cancelled");
  const open = (stop: Stop) => { setSelected(stop); dialog.current?.showModal(); };
  const index = selected ? stops.findIndex((stop) => stop.id === selected.id) : -1;
  const arrival = selected ? activeLegs.find((leg) => leg.toStopId === selected.id) ?? (index === 0 ? activeLegs.find((leg) => leg.fromKind === "origin_boundary") : undefined) : undefined;
  const departure = selected ? activeLegs.find((leg) => leg.fromStopId === selected.id) : undefined;

  return <>
    <ol aria-label="Destinos por ordem" className="scroll-row mt-4 items-center">
      {originLabel ? <li className="flex items-center gap-3"><Boundary label={originLabel} caption="Partida" /><Connector leg={activeLegs.find((leg) => leg.fromKind === "origin_boundary")} /></li> : null}
      {stops.map((stop, position) => <li key={stop.id} className="flex items-center gap-3">
        <button type="button" onClick={() => open(stop)} aria-haspopup="dialog" aria-label={`Ver detalhes de ${stop.placeName}`} className={`group relative block h-52 w-60 overflow-hidden rounded-3xl border text-left transition-transform hover:-translate-y-0.5 ${currentStopId === stop.id ? "border-primary" : "border-border hover:border-primary/60"}`}>
          <DestinationImage seed={stop.placeName} image={images[stop.id]} className="absolute inset-0"><div className="flex h-full flex-col justify-between p-4 text-white"><div className="flex items-center justify-between gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{position + 1}</span>{currentStopId === stop.id ? <span className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">Agora</span> : <span className="rounded-full bg-black/40 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"><Icon name="arrowUpRight" size={14} /></span>}</div><div><p className="truncate text-lg font-light">{stop.placeName}</p><p className="truncate text-xs text-white/75">{stop.countryName} · {formatTripDate(stop.arrivalDate)} · {nightsBetween(stop.arrivalDate, stop.departureDate)} noites</p></div></div></DestinationImage>
        </button>
        {position < stops.length - 1 ? <Connector leg={activeLegs.find((leg) => leg.fromStopId === stop.id)} add={{ href: `/trips/${tripId}/destinations/new?after=${stop.id}`, label: `Adicionar destino entre ${stop.placeName} e ${stops[position + 1].placeName}` }} /> : null}
      </li>)}
      <li className="flex items-center gap-3">{stops.length ? <Connector leg={undefined} /> : null}<Link href={`/trips/${tripId}/destinations/new${stops.length ? `?after=${stops[stops.length - 1].id}` : ""}`} className="flex h-52 w-44 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-input bg-surface text-center text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"><span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon name="plus" size={20} /></span>Adicionar destino{stops.length ? <span className="px-4 text-xs font-normal">depois de {stops[stops.length - 1].placeName}</span> : null}</Link>{returnLabel ? <Connector leg={activeLegs.find((leg) => leg.toKind === "return_boundary")} /> : null}</li>
      {returnLabel ? <li><Boundary label={returnLabel} caption="Regresso" /></li> : null}
    </ol>

    <dialog ref={dialog} aria-labelledby="stop-dialog-title" onClose={() => setSelected(null)} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} className="m-auto w-[min(640px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm">
      {selected ? <div className="max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DestinationImage seed={selected.placeName} image={images[selected.id]} overlay="bottom" showCredit className="h-60 sm:h-72">
          <div className="flex h-full flex-col justify-between p-5"><div className="flex justify-between gap-3"><Badge tone="primary">Destino {index + 1} de {stops.length}</Badge><button type="button" onClick={() => dialog.current?.close()} aria-label="Fechar" className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur hover:bg-black/65"><Icon name="plus" size={18} className="rotate-45" /></button></div><div><h2 id="stop-dialog-title" className="text-4xl font-light tracking-tight">{selected.placeName}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-foreground/80"><Icon name="mapPin" size={14} />{selected.countryName}</p></div></div>
        </DestinationImage>
        <div className="space-y-5 p-5 sm:p-6">
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <Fact icon="calendar" label="Datas" value={formatTripDateRange(selected.arrivalDate, selected.departureDate)} />
            <Fact icon="sun" label="Noites" value={String(nightsBetween(selected.arrivalDate, selected.departureDate))} />
            <Fact icon="clock" label="Fuso horário" value={selected.timezone ?? "Não definido"} />
          </dl>
          <div className="grid gap-3 sm:grid-cols-2"><LegFact title="Chegada" leg={arrival} /><LegFact title="Partida" leg={departure} /></div>
          {selected.notes ? <div className="rounded-2xl bg-surface p-4 text-sm"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas</p><p className="mt-1 whitespace-pre-wrap">{selected.notes}</p></div> : null}
          <div className="flex flex-wrap gap-2 border-t border-border pt-5"><Link href={`/trips/${tripId}/destinations/${selected.id}/edit`} className={button.primary}><Icon name="pencil" size={16} />Editar destino</Link><Link href={`/trips/${tripId}/itinerary#day-${selected.arrivalDate}`} className={button.secondary}><Icon name="calendar" size={16} />Itinerário</Link><Link href={`/trips/${tripId}/route`} className={button.ghost}>Rota completa</Link></div>
        </div>
      </div> : null}
    </dialog>
  </>;
}

function Fact({ icon, label, value }: { icon: "calendar" | "sun" | "clock"; label: string; value: string }) {
  return <div className="min-w-0 rounded-2xl bg-surface p-3"><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon name={icon} size={13} />{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>;
}

function LegFact({ title, leg }: { title: string; leg?: TravelLeg }) {
  return <div className="rounded-2xl border border-border p-4 text-sm"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>{leg ? <div className="mt-2 flex items-start gap-3"><span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-link"><Icon name={travelModeIcons[leg.mode]} size={16} /></span><div className="min-w-0"><p className="font-semibold">{modes[leg.mode]} · {statuses[leg.status]}</p><p className="text-muted-foreground">{leg.departureDate ?? "Data por definir"}{leg.departureTime ? ` às ${leg.departureTime}` : ""}{leg.operator ? ` · ${leg.operator}` : ""}</p></div></div> : <p className="mt-2 text-muted-foreground">Transporte por planear</p>}</div>;
}

function Boundary({ label, caption }: { label: string; caption: string }) {
  return <div className="flex h-52 w-36 flex-col justify-center rounded-3xl border border-dashed border-border bg-surface p-4"><Icon name="home" size={18} className="text-link" /><p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{caption}</p><p className="mt-1 truncate font-semibold">{label}</p></div>;
}

function Connector({ leg, add }: { leg?: TravelLeg; add?: { href: string; label: string } }) {
  return <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
    <span aria-hidden="true" className="h-px w-3 border-t border-dashed border-input" />
    <span className="flex flex-col items-center gap-2">
      {leg ? <span title={`Transporte: ${modes[leg.mode]}`} className="flex size-8 items-center justify-center rounded-full border border-primary/40 bg-primary-muted text-link"><Icon name={travelModeIcons[leg.mode]} size={14} /><span className="sr-only">Transporte: {modes[leg.mode]}</span></span> : null}
      {add ? <Link href={add.href} aria-label={add.label} title={add.label} className="flex size-9 items-center justify-center rounded-full border border-dashed border-input bg-surface hover:border-primary hover:bg-primary hover:text-primary-foreground"><Icon name="plus" size={15} /></Link> : null}
    </span>
    <span aria-hidden="true" className="h-px w-3 border-t border-dashed border-input" />
  </span>;
}
