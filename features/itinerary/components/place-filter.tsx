"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";

/** Pill filter that shows only the itinerary days and activities of one destination. */
export function ItineraryPlaceFilter({ places, total, children }: { places: { id: string; name: string; count: number }[]; total: number; children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  const css = selected && /^[0-9a-f-]+$/i.test(selected)
    ? `[data-itinerary-scope] [data-day]:not([data-stops~="${selected}"]){display:none}[data-itinerary-scope] [data-stop]:not([data-stop="${selected}"]):not([data-stop="none"]){display:none}`
    : "";
  return <div data-itinerary-scope="">
    {css ? <style>{css}</style> : null}
    <nav aria-label="Filtrar itinerário por destino" className="scroll-row mb-6 rounded-full border border-border bg-card p-1.5 sm:w-fit sm:max-w-full">
      <FilterPill active={selected === null} onClick={() => setSelected(null)} label="Todos" count={total} />
      {places.map((place) => <FilterPill key={place.id} active={selected === place.id} onClick={() => setSelected(place.id)} label={place.name} count={place.count} pin />)}
    </nav>
    {children}
  </div>;
}

function FilterPill({ active, onClick, label, count, pin = false }: { active: boolean; onClick: () => void; label: string; count: number; pin?: boolean }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
    {pin ? <Icon name="mapPin" size={14} /> : null}{label}<span className={`rounded-full px-1.5 text-[11px] tabular-nums ${active ? "bg-black/10" : "bg-muted"}`}>{count}</span>
  </button>;
}
