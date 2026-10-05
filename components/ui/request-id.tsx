"use client";

import { useEffect, useRef } from "react";

/**
 * Hidden idempotency key for create forms. React 19 resets uncontrolled forms after every
 * action (also when it returns a validation error), which would blank a key set only once.
 * The key is assigned on mount and restored after each reset, so retrying the same form never
 * creates a duplicate record.
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
  return <input ref={ref} type="hidden" name={name} defaultValue="" />;
}
