"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOwnedTrip, requireTripUser } from "@/features/trips/queries";

export type ChecklistToggleState = { status: "idle" | "success" | "error"; message?: string };

/** Mark a checklist task done/undone in place (no redirect), refreshing every trip page. */
export async function setChecklistDoneAction(tripId: string, itemId: string, done: boolean): Promise<ChecklistToggleState> {
  if (!z.string().uuid().safeParse(tripId).success || !z.string().uuid().safeParse(itemId).success || !await getOwnedTrip(tripId)) return { status: "error", message: "Tarefa não encontrada." };
  const { supabase } = await requireTripUser();
  const { error } = await supabase.from("checklist_items").update({ is_completed: done, completed_at: done ? new Date().toISOString() : null }).eq("trip_id", tripId).eq("id", itemId);
  if (error) return { status: "error", message: "Não foi possível atualizar a tarefa." };
  revalidatePath(`/trips/${tripId}`, "layout");
  return { status: "success" };
}

/** Delete a checklist task in place (the row asks for confirmation first). */
export async function deleteChecklistItemAction(tripId: string, itemId: string): Promise<ChecklistToggleState> {
  if (!z.string().uuid().safeParse(tripId).success || !z.string().uuid().safeParse(itemId).success || !await getOwnedTrip(tripId)) return { status: "error", message: "Tarefa não encontrada." };
  const { supabase } = await requireTripUser();
  const { data, error } = await supabase.from("checklist_items").delete().eq("trip_id", tripId).eq("id", itemId).select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "Não foi possível excluir a tarefa." };
  revalidatePath(`/trips/${tripId}`, "layout");
  return { status: "success" };
}
