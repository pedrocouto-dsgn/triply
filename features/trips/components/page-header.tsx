import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { button } from "@/components/ui/page";
import { signOutAction } from "@/features/auth/actions";

export function TripsPageHeader({ identity }: { identity: string }) {
  return <header className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-muted text-base font-semibold uppercase text-link">{identity.trim().charAt(0) || "T"}</span><div className="min-w-0"><p className="text-xs text-muted-foreground">O seu espaço / Viagens</p><p className="mt-0.5 max-w-full break-all text-sm font-medium">{identity}</p></div></div>
    <div className="flex flex-wrap items-center gap-2"><Link href="/settings" className={button.ghost}><Icon name="settings" size={16} />Definições</Link><form action={signOutAction}><button className={button.ghost}><Icon name="logout" size={16} />Terminar sessão</button></form><Link href="/trips/new" className={button.primary}><Icon name="plus" size={16} />Nova viagem</Link></div>
  </header>;
}
