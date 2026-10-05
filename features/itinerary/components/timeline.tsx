import Link from "next/link";
import { ColumnChart } from "@/components/ui/charts";
import { Icon, travelModeIcons } from "@/components/ui/icons";
import { DestinationImage } from "@/components/ui/media";
import { button, Panel, SectionHeader } from "@/components/ui/page";
import type { PlaceImage } from "@/features/media/types";
import type { Trip } from "@/features/trips/types";
import type { TripDay } from "../days";
import { overlappingItemIds } from "../days";
import { ItemActions } from "./item-actions";

const travelModeLabels = { plane: "Avião", train: "Comboio", bus: "Autocarro", car: "Carro", ferry: "Ferry", other: "Outro" };
const dateParts = (date: string) => {
  const value = new Date(`${date}T00:00:00Z`);
  return {
    day: value.getUTCDate(),
    month: new Intl.DateTimeFormat("pt-PT", { month: "short", timeZone: "UTC" }).format(value).replace(".", ""),
    weekday: new Intl.DateTimeFormat("pt-PT", { weekday: "short", timeZone: "UTC" }).format(value).replace(".", ""),
    full: new Intl.DateTimeFormat("pt-PT", { dateStyle: "full", timeZone: "UTC" }).format(value),
  };
};

export function ItineraryOverview({ days }: { days: TripDay[] }) {
  const total = days.reduce((sum, day) => sum + day.items.length, 0);
  return <Panel aria-labelledby="days-overview-title">
    <SectionHeader id="days-overview-title" title="Dias da viagem" description={`${days.length} dia(s) · ${total} atividade(s) planeada(s)`} />
    <div className="mt-5"><ColumnChart label={`Atividades por dia: ${days.map((day, index) => `dia ${index + 1}: ${day.items.length}`).join(", ")}`} items={days.map((day, index) => ({ label: `Dia ${index + 1}`, value: day.items.length, color: day.isTransition ? "var(--chart-4)" : "var(--chart-1)" }))} height={80} /></div>
    <nav aria-label="Saltar para um dia" className="scroll-row mt-4">{days.map((day, index) => {
      const parts = dateParts(day.date);
      return <a key={day.date} href={`#day-${day.date}`} className="flex w-[84px] flex-col items-center rounded-2xl border border-border bg-surface px-2 py-3 text-center hover:border-primary/60">
        <span className="text-[11px] uppercase text-muted-foreground">{parts.weekday}</span>
        <span className="mt-0.5 text-2xl font-bold leading-none">{parts.day}</span>
        <span className="text-[11px] uppercase text-muted-foreground">{parts.month}</span>
        <span className={`mt-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${day.items.length ? "bg-primary-muted text-link" : "bg-muted text-muted-foreground"}`}>Dia {index + 1}</span>
      </a>;
    })}</nav>
  </Panel>;
}

export function ItineraryTimeline({ trip, days, images = {} }: { trip: Trip; days: TripDay[]; images?: Record<string, PlaceImage> }) {
  return <div className="space-y-6">{days.map((day, index) => {
    const overlaps = overlappingItemIds(day.items);
    const untimed = day.items.filter((item) => !item.startLocalTime);
    const untimedIds = untimed.map((item) => item.id);
    const parts = dateParts(day.date);
    const place = day.stops[0]?.placeName;
    return <section key={day.date} id={`day-${day.date}`} data-day="" data-stops={day.stops.map((stop) => stop.id).join(" ")} className="scroll-mt-20 overflow-hidden rounded-card border border-border bg-card">
      <header className="flex flex-wrap items-center gap-4 border-b border-border p-4 sm:p-5">
        {place ? <DestinationImage seed={place} image={images[day.stops[0].id]} overlay={false} className="hidden size-16 shrink-0 rounded-2xl sm:block" /> : null}
        <span className="flex w-16 shrink-0 flex-col items-center rounded-2xl bg-primary py-2 text-primary-foreground"><span className="text-[11px] font-semibold uppercase">{parts.month}</span><span className="text-2xl font-bold leading-none">{parts.day}</span></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-link">Dia {index + 1}{day.isTransition ? " · Transição" : ""}</p>
          <h2 className="mt-1 text-lg font-semibold first-letter:uppercase">{parts.full}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><Icon name="mapPin" size={14} />{day.stops.length ? day.stops.map((stop) => stop.placeName).join(" · ") : "Sem destino associado"}</p>
        </div>
        <Link href={`/trips/${trip.id}/itinerary/new?date=${day.date}`} className={button.primary}><Icon name="plus" size={16} />Adicionar atividade</Link>
      </header>
      <div className="p-4 sm:p-5">
        {day.legs.map((leg) => <article key={leg.id} className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary-muted/60 p-4 text-sm">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon name={travelModeIcons[leg.mode]} size={18} /></span>
          <div className="min-w-0 flex-1"><p className="font-semibold">Transporte · {travelModeLabels[leg.mode]}</p><p className="text-muted-foreground">{leg.departureDate === day.date ? `${leg.departureTime ?? "Hora flexível"}${leg.departureTimezone ? ` · ${leg.departureTimezone}` : ""}` : "Chegada neste dia"}</p></div>
          <Link href={`/trips/${trip.id}/transport/${leg.id}/edit`} className="font-semibold text-link underline">Editar transporte</Link>
        </article>)}
        {day.items.length ? <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[27px] before:top-3 before:w-px before:bg-border">{day.items.map((item) => <li key={item.id} data-stop={item.stopId ?? "none"} className="relative flex gap-4">
          <span className={`z-10 mt-4 flex h-7 w-14 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums ${item.startLocalTime ? "border-primary/40 bg-card text-link" : "border-border bg-card text-muted-foreground"}`}>{item.startLocalTime ?? "Livre"}</span>
          <article className={`min-w-0 flex-1 rounded-2xl border p-4 ${item.status === "needs_review" ? "border-warning/50 bg-warning-muted" : "border-border bg-surface"}`}>
            <div className="flex flex-wrap justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-muted-foreground">{item.startLocalTime ? `${item.startLocalTime}${item.endLocalTime ? `–${item.endLocalTime}` : ""}` : "A qualquer hora"}{item.timezone ? ` · ${item.timezone}` : ""}</p>
                <h3 className="mt-1 font-semibold">{item.title}</h3>
                {item.placeName ? <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><Icon name="mapPin" size={14} />{item.placeName}</p> : null}
                {item.notes ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.notes}</p> : null}
                {overlaps.has(item.id) ? <p className="mt-2 text-sm font-medium text-warning">Possível sobreposição com outra atividade.</p> : null}
                {item.status === "needs_review" ? <p className="mt-2 text-sm font-medium text-warning">Rever associação após alteração da viagem ou rota.</p> : null}
              </div>
              <Link className="text-sm font-medium text-link hover:underline" href={`/trips/${trip.id}/itinerary/${item.id}/edit`}>Editar</Link>
            </div>
            <ItemActions tripId={trip.id} itemId={item.id} currentDate={day.date} startDate={trip.startDate} endDate={trip.endDate} untimedIds={untimedIds} index={item.startLocalTime ? -1 : untimedIds.indexOf(item.id)} />
          </article>
        </li>)}</ol> : <p className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground"><Icon name="sun" size={18} />Sem atividades. Adicione uma atividade com hora ou mantenha-a flexível.</p>}
      </div>
    </section>;
  })}</div>;
}
