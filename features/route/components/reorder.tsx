"use client";

import { useActionState, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "@/components/ui/icons";
import { button } from "@/components/ui/page";
import { reorderStopsAction } from "../actions";
import { affectedLegsForOrder, validateStopSequence } from "../route-model";
import { initialRouteActionState, type Stop, type TravelLeg } from "../types";

/** Drag-and-drop reordering via a grip handle (mouse and touch); arrow keys move the focused item. */
export function ReorderStops({ tripId, stops, legs }: { tripId: string; stops: Stop[]; legs: TravelLeg[] }) {
  const [ordered, setOrdered] = useState(() => [...stops].sort((a, b) => a.position - b.position));
  const [dragging, setDragging] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const rows = useRef(new Map<string, HTMLLIElement>());
  const [state, formAction, pending] = useActionState(reorderStopsAction.bind(null, tripId), initialRouteActionState);
  const conflict = validateStopSequence(ordered.map((stop, index) => ({ ...stop, position: index + 1 })));
  const affected = affectedLegsForOrder(ordered, legs);
  const changed = ordered.some((stop, index) => stop.id !== [...stops].sort((a, b) => a.position - b.position)[index]?.id);

  const moveTo = (id: string, target: number) => setOrdered((current) => {
    const from = current.findIndex((stop) => stop.id === id);
    if (from < 0 || target < 0 || target >= current.length || from === target) return current;
    const next = [...current]; const [item] = next.splice(from, 1); next.splice(target, 0, item);
    setAnnouncement(`${item.placeName} na posição ${target + 1} de ${current.length}.`);
    return next;
  });
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, id: string) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(id); };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    // New index = how many of the other rows have their middle above the pointer.
    const target = ordered.filter((stop) => stop.id !== dragging).filter((stop) => { const rect = rows.current.get(stop.id)?.getBoundingClientRect(); return rect ? rect.top + rect.height / 2 < event.clientY : false; }).length;
    moveTo(dragging, target);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string, index: number) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); moveTo(id, index + (event.key === "ArrowUp" ? -1 : 1)); }
  };

  return <details className="rounded-card border border-border bg-card p-5">
    <summary className="min-h-11 cursor-pointer py-2 font-semibold">Reordenar destinos</summary>
    <form action={formAction} className="mt-4">
      <input type="hidden" name="stopIds" value={JSON.stringify(ordered.map((stop) => stop.id))} />
      <p className="mb-3 text-sm text-muted-foreground">Segure na pega <Icon name="grip" size={14} strokeWidth={3} className="inline" /> e arraste o destino para a nova posição.</p>
      <ol className="space-y-2">{ordered.map((stop, index) => <li key={stop.id} ref={(node) => { if (node) rows.current.set(stop.id, node); else rows.current.delete(stop.id); }} className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${dragging === stop.id ? "border-primary bg-primary-muted/60 shadow-lg" : "border-border bg-surface"}`}>
        <button type="button" aria-label={`Arrastar ${stop.placeName}. Use as setas para mover.`} onPointerDown={(event) => onPointerDown(event, stop.id)} onPointerMove={onPointerMove} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)} onKeyDown={(event) => onKeyDown(event, stop.id, index)} className="flex size-10 min-h-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"><Icon name="grip" size={18} strokeWidth={3} /></button>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
        <span className="min-w-0 flex-1"><span className="block truncate font-medium">{stop.placeName}</span><span className="text-xs text-muted-foreground">{stop.arrivalDate} → {stop.departureDate}</span></span>
      </li>)}</ol>
      <p aria-live="polite" className="sr-only">{announcement}</p>
      {conflict ? <p role="alert" className="mt-3 text-sm text-destructive">{conflict}</p> : null}
      {affected.length ? <p className="mt-3 text-sm text-warning">{affected.length} transporte(s) ficarão marcados para revisão; não serão retargetados nem eliminados.</p> : null}
      {state.message ? <p role="alert" className="mt-3 text-sm text-destructive">{state.message}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2"><button disabled={pending || Boolean(conflict) || !changed} className={button.primary}>{pending ? "A guardar…" : "Guardar nova ordem"}</button>{changed ? <button type="button" onClick={() => setOrdered([...stops].sort((a, b) => a.position - b.position))} className={button.ghost}>Repor</button> : null}</div>
    </form>
  </details>;
}
