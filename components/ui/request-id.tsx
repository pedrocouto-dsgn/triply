"use client";

import { useEffect, useRef } from "react";

/**
 * Hidden idempotency key for create forms. The input has no `value`/`defaultValue` prop on
 * purpose: for a hidden input both map to the `value` attribute, so React would blank the key on
 * every re-render of the form (e.g. after choosing a file), and the action would fail with
 * "O formulário expirou". React 19 also resets uncontrolled forms after each action. The key is
 * assigned on mount and restored after a reset, so retrying the same form never creates a duplicate.
 */
export function RequestIdInput({ name = "requestId" }: { name?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    const key = crypto.randomUUID();
    const assign = () => { input.value = key; };
    const onReset = () => { window.setTimeout(assign, 0); };
    assign();
    const form = input.form;
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, []);
  return <input ref={ref} type="hidden" name={name} />;
}
