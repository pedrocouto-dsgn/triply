import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { BackLink, IconBadge, Notice, PageContainer, PageHero } from "@/components/ui/page";
import { AccountSettingsForm } from "@/features/settings/components/forms";
import { getAccountSettings } from "@/features/settings/queries";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [settings, query] = await Promise.all([getAccountSettings(), searchParams]);
  return <PageContainer width="medium">
    <div className="mb-4"><BackLink href="/trips">Voltar às viagens</BackLink></div>
    <PageHero seed="Triply definições da conta" size="sm" eyebrow={<><Icon name="users" size={14} />Conta</>} title="Definições" description="Escolha os valores predefinidos para novas viagens sem alterar o histórico existente." />
    {query.saved ? <div className="mt-4"><Notice tone="success">Definições guardadas.</Notice></div> : null}
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <section aria-labelledby="profile-title" className="rounded-feature border border-border bg-card p-5 sm:p-8"><div className="mb-6 flex items-center gap-3"><IconBadge icon="users" size="sm" /><h2 id="profile-title" className="text-xl font-semibold">Perfil e preferências</h2></div><AccountSettingsForm settings={settings} /></section>
      <section aria-labelledby="security-title" className="rounded-feature border border-border bg-card p-5 sm:p-6"><div className="flex items-center gap-3"><IconBadge icon="shield" tone="success" size="sm" /><h2 id="security-title" className="text-xl font-semibold">Segurança</h2></div><p className="mt-3 text-sm text-muted-foreground">A alteração de email e eliminação da conta não fazem parte destas definições.</p><Link href="/auth/forgot-password" className="mt-4 inline-block font-semibold text-link underline">Recuperar ou alterar palavra-passe</Link></section>
    </div>
  </PageContainer>;
}
