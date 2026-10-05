"use client";

import { useActionState } from "react";
import { completeOnboardingAction } from "./actions";
import { initialAuthActionState } from "./types";
import { SUPPORTED_CURRENCIES, SUPPORTED_LOCALES } from "./options";

export function OnboardingForm({ initialName = "", initialCurrency = "EUR", initialLocale = "pt-PT" }: { initialName?: string; initialCurrency?: string; initialLocale?: string }) {
  const [state, action, pending] = useActionState(completeOnboardingAction, initialAuthActionState);

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <div>
        <label htmlFor="displayName" className="mb-2 block text-sm font-medium">Nome</label>
        <input id="displayName" name="displayName" defaultValue={initialName} maxLength={80} autoComplete="name" aria-invalid={Boolean(state.fieldErrors?.displayName)} className="h-12 w-full rounded-control border border-input px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/10" />
        {state.fieldErrors?.displayName ? <p className="mt-2 text-sm text-destructive">{state.fieldErrors.displayName}</p> : null}
      </div>
      <div>
        <label htmlFor="currency" className="mb-2 block text-sm font-medium">Moeda predefinida</label>
        <select id="currency" name="currency" defaultValue={initialCurrency} className="h-12 w-full rounded-control border border-input bg-card px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/10">
          {SUPPORTED_CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="locale" className="mb-2 block text-sm font-medium">Idioma</label>
        <select id="locale" name="locale" defaultValue={initialLocale} className="h-12 w-full rounded-control border border-input bg-card px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/10">
          {SUPPORTED_LOCALES.map((locale) => <option key={locale.value} value={locale.value}>{locale.label}</option>)}
        </select>
      </div>
      {state.message ? <p role="status" className="rounded-control border border-destructive bg-destructive-muted p-3 text-sm text-destructive">{state.message}</p> : null}
      <button disabled={pending} className="h-12 w-full rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "A guardar…" : "Entrar no Triply"}</button>
    </form>
  );
}
