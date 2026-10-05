"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { button } from "@/components/ui/page";
import { RequestIdInput } from "@/components/ui/request-id";
import { createCategoryInlineAction, deleteExpenseAction, saveExpenseAction, setExpensePaidAction } from "../budget-actions";
import { initialInlineState, type InlineState } from "../budget-types";

type Action = (state: InlineState, data: FormData) => Promise<InlineState>;
const field = "h-11 w-full rounded-control border border-input bg-surface px-3 text-sm";

/** Big number card with an edit pencil that swaps the value for an inline form. */
export function InlineValueCard({ icon, label, value, hint, inputValue, currency, action, tone = "default", children, editLabel }: { icon: IconName; label: string; value: string; hint?: ReactNode; inputValue?: string; currency?: string; action?: Action; tone?: "default" | "accent"; children?: ReactNode; editLabel?: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(async (previous: InlineState, data: FormData) => {
    const result = await action!(previous, data);
    if (result.status === "success") setEditing(false);
    return result;
  }, initialInlineState);
  const accent = tone === "accent";
  return <article className={`relative min-w-0 rounded-card p-5 sm:p-6 ${accent ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>
    <div className="flex items-center justify-between gap-3">
      <p className={`flex items-center gap-2 text-sm font-medium ${accent ? "opacity-75" : "text-muted-foreground"}`}><Icon name={icon} size={16} />{label}</p>
      {action && !editing ? <button type="button" onClick={() => setEditing(true)} aria-label={editLabel ?? `Editar ${label.toLowerCase()}`} title={editLabel ?? `Editar ${label.toLowerCase()}`} className={`flex size-9 min-h-9 items-center justify-center rounded-full ${accent ? "bg-black/10 hover:bg-black/20" : "border border-border bg-elevated text-muted-foreground hover:text-foreground"}`}><Icon name="pencil" size={15} /></button> : null}
    </div>
    {editing && action ? <form action={formAction} className="mt-3 space-y-2">
      <label className="sr-only" htmlFor={`edit-${label}`}>{label}</label>
      <div className="flex gap-2"><input id={`edit-${label}`} name="amount" inputMode="decimal" defaultValue={inputValue} autoFocus placeholder="0,00" className={`${field} text-base text-foreground`} /><span className={`flex items-center text-sm ${accent ? "" : "text-muted-foreground"}`}>{currency}</span></div>
      {state.status === "error" ? <p role="alert" className={`text-xs ${accent ? "font-semibold" : "text-destructive"}`}>{state.message}</p> : null}
      <div className="flex gap-2"><button disabled={pending} className={accent ? "inline-flex min-h-10 items-center rounded-full bg-primary-foreground px-4 text-sm font-semibold text-primary" : `${button.primary} min-h-10`}>{pending ? "A guardar…" : "Guardar"}</button><button type="button" onClick={() => setEditing(false)} className={accent ? "min-h-10 rounded-full px-3 text-sm font-medium" : button.ghost}>Cancelar</button></div>
    </form> : <p className="mt-3 break-words text-3xl font-light tracking-tight tabular-nums sm:text-4xl">{value}</p>}
    {hint ? <div className={`mt-2 text-xs ${accent ? "opacity-75" : "text-muted-foreground"}`}>{hint}</div> : null}
    {children}
  </article>;
}

export type ExpenseView = { id: string; title: string; value: string; valueInput: string; paid: boolean; stopId: string | null; stopName: string | null };
export type CategoryView = { id: string; name: string; total: string; paid: string; paidPercent: number; color: string; expenses: ExpenseView[] };
type Option = { id: string; name: string };

export function BudgetCategories({ tripId, currency, categories, otherCategories, stops }: { tripId: string; currency: string; categories: CategoryView[]; otherCategories: Option[]; stops: Option[] }) {
  const [extra, setExtra] = useState<CategoryView[]>([]);
  const shown = [...categories, ...extra.filter((item) => !categories.some((category) => category.id === item.id))];
  const remaining = otherCategories.filter((option) => !shown.some((category) => category.id === option.id));
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {shown.map((category) => <CategoryCard key={category.id} tripId={tripId} currency={currency} category={category} stops={stops} />)}
    <NewCategoryCard tripId={tripId} remaining={remaining} onPick={(option) => setExtra((items) => [...items, { id: option.id, name: option.name, total: "—", paid: "—", paidPercent: 0, color: "var(--chart-7)", expenses: [] }])} />
  </div>;
}

function CategoryCard({ tripId, currency, category, stops }: { tripId: string; currency: string; category: CategoryView; stops: Option[] }) {
  const [adding, setAdding] = useState(false);
  return <article className="flex min-w-0 flex-col rounded-card border border-border bg-card p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="flex items-center gap-2 font-semibold"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: category.color }} />{category.name}</p><p className="mt-2 text-2xl font-light tabular-nums">{category.total}</p><p className="text-xs text-muted-foreground">Pago: {category.paid}</p></div>
      <button type="button" onClick={() => setAdding(true)} aria-label={`Adicionar gasto em ${category.name}`} title="Adicionar gasto" className="flex size-10 min-h-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover"><Icon name="plus" size={18} /></button>
    </div>
    <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${category.paidPercent}%` }} /></div>
    <ul className="mt-4 space-y-1.5">{category.expenses.map((expense) => <ExpenseRowItem key={expense.id} tripId={tripId} currency={currency} categoryId={category.id} expense={expense} stops={stops} />)}</ul>
    {!category.expenses.length && !adding ? <p className="mt-1 text-sm text-muted-foreground">Ainda sem gastos nesta categoria.</p> : null}
    {adding ? <ExpenseForm tripId={tripId} currency={currency} categoryId={category.id} stops={stops} onDone={() => setAdding(false)} /> : null}
  </article>;
}

function ExpenseRowItem({ tripId, currency, categoryId, expense, stops }: { tripId: string; currency: string; categoryId: string; expense: ExpenseView; stops: Option[] }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [toggleState, toggle, toggling] = useActionState(async () => setExpensePaidAction(tripId, expense.id, !expense.paid), initialInlineState);
  const [deleteState, remove, removing] = useActionState(async () => deleteExpenseAction(tripId, expense.id), initialInlineState);
  if (mode === "edit") return <li><ExpenseForm tripId={tripId} currency={currency} categoryId={categoryId} stops={stops} expense={expense} onDone={() => setMode("view")} /></li>;
  return <li className="group rounded-2xl px-2 py-1.5 hover:bg-surface">
    <div className="flex items-center gap-2">
      <form action={toggle}><button disabled={toggling} aria-label={expense.paid ? `Marcar ${expense.title} como por pagar` : `Marcar ${expense.title} como pago`} title={expense.paid ? "Pago — marcar como por pagar" : "Por pagar — marcar como pago"} className={`flex size-6 min-h-6 items-center justify-center rounded-full border ${expense.paid ? "border-transparent bg-success text-background" : "border-input hover:border-primary"}`}>{expense.paid ? <Icon name="check" size={13} strokeWidth={2.8} /> : null}</button></form>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm">{expense.title}</span>{expense.stopName ? <span className="block truncate text-[11px] text-muted-foreground">{expense.stopName}</span> : null}</span>
      <span className="shrink-0 text-sm font-medium tabular-nums">{expense.value}</span>
      {mode === "confirm" ? <span className="flex shrink-0 items-center gap-1"><form action={remove}><button disabled={removing} className="min-h-8 rounded-full bg-danger px-2.5 text-xs font-semibold">Remover</button></form><button type="button" onClick={() => setMode("view")} className="min-h-8 px-1.5 text-xs text-muted-foreground">Não</button></span>
        : <span className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"><button type="button" onClick={() => setMode("edit")} aria-label={`Editar ${expense.title}`} className="flex size-8 min-h-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Icon name="pencil" size={14} /></button><button type="button" onClick={() => setMode("confirm")} aria-label={`Remover ${expense.title}`} className="flex size-8 min-h-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"><Icon name="trash" size={14} /></button></span>}
    </div>
    {toggleState.status === "error" || deleteState.status === "error" ? <p role="alert" className="mt-1 text-xs text-destructive">{toggleState.message ?? deleteState.message}</p> : null}
  </li>;
}

function ExpenseForm({ tripId, currency, categoryId, stops, expense, onDone }: { tripId: string; currency: string; categoryId: string; stops: Option[]; expense?: ExpenseView; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(async (previous: InlineState, data: FormData) => {
    const result = await saveExpenseAction(tripId, expense?.id ?? "", previous, data);
    if (result.status === "success") onDone();
    return result;
  }, initialInlineState);
  // Submitted manually (not via the form action prop) so React does not clear the fields when an error comes back.
  const [, startTransition] = useTransition();
  return <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => formAction(data)); }} className="mt-3 space-y-2 rounded-2xl border border-border bg-surface p-3">
    <input type="hidden" name="categoryId" value={categoryId} />
    {expense ? null : <RequestIdInput />}
    <label className="block text-xs font-medium text-muted-foreground">Descrição<input name="title" defaultValue={expense?.title} required maxLength={120} autoFocus placeholder="Ex.: Hotel em Amesterdão" className={`${field} mt-1 text-foreground`} /></label>
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
      <label className="block text-xs font-medium text-muted-foreground">Valor ({currency})<input name="amount" inputMode="decimal" defaultValue={expense?.valueInput} required placeholder="0,00" className={`${field} mt-1 text-foreground`} /></label>
      <label className="block text-xs font-medium text-muted-foreground">Destino<select name="stopId" defaultValue={expense?.stopId ?? ""} className={`${field} mt-1 text-foreground`}><option value="">Toda a viagem</option>{stops.map((stop) => <option key={stop.id} value={stop.id}>{stop.name}</option>)}</select></label>
    </div>
    {!expense?.paid ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="paid" />Já está pago</label> : null}
    {state.status === "error" ? <p role="alert" className="text-xs text-destructive">{state.message}</p> : null}
    <div className="flex gap-2"><button disabled={pending} className={`${button.primary} min-h-10`}>{pending ? "A guardar…" : expense ? "Guardar" : "Adicionar"}</button><button type="button" onClick={onDone} className={`${button.ghost} min-h-10`}>Cancelar</button></div>
  </form>;
}

function NewCategoryCard({ tripId, remaining, onPick }: { tripId: string; remaining: Option[]; onPick: (option: Option) => void }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (previous: InlineState, data: FormData) => {
    const result = await createCategoryInlineAction(tripId, previous, data);
    if (result.status === "success") setOpen(false);
    return result;
  }, initialInlineState);
  return <article className="flex min-h-48 flex-col justify-center gap-3 rounded-card border border-dashed border-border bg-surface p-5">
    {open ? <form action={formAction} className="space-y-2"><label className="block text-sm font-medium">Nova categoria<input name="name" required maxLength={60} autoFocus placeholder="Ex.: Passagens" className={`${field} mt-1`} /></label>{state.status === "error" ? <p role="alert" className="text-xs text-destructive">{state.message}</p> : null}<div className="flex gap-2"><button disabled={pending} className={`${button.primary} min-h-10`}>{pending ? "A criar…" : "Criar"}</button><button type="button" onClick={() => setOpen(false)} className={`${button.ghost} min-h-10`}>Cancelar</button></div></form>
      : <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center gap-2 text-center text-sm font-medium text-muted-foreground hover:text-foreground"><span className="flex size-11 items-center justify-center rounded-full border border-dashed border-input"><Icon name="plus" size={18} /></span>Criar categoria</button>}
    {remaining.length && !open ? <label className="block text-xs text-muted-foreground">Ou usar uma categoria existente<select defaultValue="" onChange={(event) => { const option = remaining.find((item) => item.id === event.target.value); if (option) onPick(option); event.target.value = ""; }} className={`${field} mt-1 text-foreground`}><option value="" disabled>Escolher…</option>{remaining.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label> : null}
  </article>;
}
