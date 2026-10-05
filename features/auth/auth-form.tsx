"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthActionState } from "./types";
import { initialAuthActionState } from "./types";

type Field = { name: "email" | "password" | "confirmPassword"; label: string; type: string; autoComplete: string; placeholder?: string };

export function AuthForm({
  action,
  fields,
  submitLabel,
  next,
  footer,
}: {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  fields: Field[];
  submitLabel: string;
  next?: string;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="mb-2 block text-sm font-medium">{field.label}</label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            aria-invalid={Boolean(state.fieldErrors?.[field.name])}
            aria-describedby={state.fieldErrors?.[field.name] ? `${field.name}-error` : undefined}
            className="h-12 w-full rounded-control border border-input bg-surface px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          {state.fieldErrors?.[field.name] ? (
            <p id={`${field.name}-error`} className="mt-2 text-sm text-destructive">{state.fieldErrors[field.name]}</p>
          ) : null}
        </div>
      ))}

      {state.message ? (
        <p role="status" className={`rounded-control border p-3 text-sm ${state.status === "success" ? "border-success bg-success-muted text-success" : "border-destructive bg-destructive-muted text-destructive"}`}>
          {state.message}
        </p>
      ) : null}

      <button disabled={pending} className="h-12 w-full rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "A processar…" : submitLabel}
      </button>

      {footer ? <div className="text-sm text-muted-foreground">{footer}</div> : null}
    </form>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="font-medium text-link underline underline-offset-4 hover:text-foreground">{children}</Link>;
}
