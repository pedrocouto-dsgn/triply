"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icons";
import { setChecklistDoneAction } from "../checklist-actions";

/**
 * One checklist task. Clicking the row ticks it: the check animates, the row fades and
 * collapses, then the list refreshes without it. Completed rows can be reopened.
 */
export function ChecklistRow({ tripId, id, title, meta, done, tone = "dark" }: { tripId: string; id: string; title: string; meta?: string; done: boolean; tone?: "dark" | "light" }) {
  const [checked, setChecked] = useState(done);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toggle = () => {
    if (pending) return;
    const next = !checked;
    setChecked(next); setError(null);
    window.setTimeout(() => setLeaving(true), 350);
    startTransition(async () => {
      const result = await setChecklistDoneAction(tripId, id, next);
      if (result.status === "error") { setChecked(!next); setLeaving(false); setError(result.message ?? "Erro."); }
    });
  };
  const light = tone === "light";
  return <li className={`grid transition-all duration-500 ease-out ${leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
    <div className="overflow-hidden">
      <div className={`group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${light ? "border-black/10 bg-white hover:border-black/25" : "border-border bg-surface hover:border-primary/50"}`}>
        <button type="button" onClick={toggle} disabled={pending} aria-pressed={checked} aria-label={checked ? `Reabrir: ${title}` : `Concluir: ${title}`} className="flex min-h-10 min-w-0 flex-1 items-center gap-3 text-left">
          <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${checked ? `scale-110 border-transparent ${light ? "bg-light-foreground text-light" : "bg-success text-background"}` : light ? "border-black/25 group-hover:border-black/50" : "border-input group-hover:border-primary"}`}>{checked ? <Icon name="check" size={14} strokeWidth={2.8} /> : null}</span>
          <span className="min-w-0 flex-1"><span className={`block truncate font-medium transition-colors ${checked ? (light ? "text-black/40 line-through" : "text-muted-foreground line-through") : ""}`}>{title}</span>{meta ? <span className={`block truncate text-xs ${light ? "text-black/55" : "text-muted-foreground"}`}>{meta}</span> : null}</span>
        </button>
        <Link href={`/trips/${tripId}/planning/checklist/${id}/edit`} aria-label={`Editar ${title}`} title="Editar" className={`!min-h-0 flex size-9 shrink-0 items-center justify-center rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${light ? "text-black/50 hover:bg-black/5" : "text-muted-foreground hover:bg-muted"}`}><Icon name="pencil" size={14} /></Link>
      </div>
      {error ? <p role="alert" className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  </li>;
}
