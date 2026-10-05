import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/features/auth/onboarding-form";
import { Brand } from "@/components/shared/brand";
import { DestinationImage } from "@/components/ui/media";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, default_currency, locale, onboarding_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) redirect("/trips");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-xl overflow-hidden rounded-feature border border-border bg-card shadow-2xl">
        <DestinationImage seed="Triply boas-vindas" className="h-40 sm:h-48"><div className="flex h-full items-end p-6 sm:p-8"><Brand tone="light" /></div></DestinationImage>
        <div className="p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-link">Configuração inicial · 3 passos</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Prepare o seu espaço</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">São apenas três preferências. Pode alterá-las mais tarde sem modificar as viagens já criadas.</p>
          <OnboardingForm initialName={profile?.display_name ?? ""} initialCurrency={profile?.default_currency ?? "EUR"} initialLocale={profile?.locale ?? "pt-PT"} />
        </div>
      </div>
    </main>
  );
}
