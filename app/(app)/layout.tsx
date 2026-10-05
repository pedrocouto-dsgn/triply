import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/app-shell";

export default async function PrivateAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding");
  // Sidebar trip shortcuts are a convenience: a failure here must never block the workspace.
  let trips: { id: string; name: string }[] = [];
  try {
    const { data } = await supabase.from("trips").select("id,name,start_date,archived_at").eq("user_id", user.id);
    trips = ((data ?? []) as { id: string; name: string; start_date: string; archived_at: string | null }[])
      .filter((trip) => !trip.archived_at).sort((a, b) => a.start_date.localeCompare(b.start_date))
      .map((trip) => ({ id: trip.id, name: trip.name }));
  } catch { trips = []; }
  const name = profile.display_name?.trim() || user.email?.split("@")[0] || "Viajante";
  return <AppShell userName={name} trips={trips}>{children}</AppShell>;
}
