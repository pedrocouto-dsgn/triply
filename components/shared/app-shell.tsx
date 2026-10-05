"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { Brand } from "./brand";

type NavLink = { href: string; label: string; icon: IconName };

export function AppShell({ children, account }: { children: ReactNode; account?: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const tripId = segments[0] === "trips" && segments[1] && segments[1] !== "new" ? segments[1] : null;
  const tripLinks: NavLink[] = tripId ? [
    { href: `/trips/${tripId}`, label: "Visão geral", icon: "home" },
    { href: `/trips/${tripId}#route`, label: "Rota e destinos", icon: "route" },
    { href: `/trips/${tripId}/finance`, label: "Orçamento", icon: "wallet" },
    { href: `/trips/${tripId}/savings`, label: "Poupança", icon: "piggy" },
    { href: `/trips/${tripId}/itinerary`, label: "Itinerário", icon: "calendar" },
    { href: `/trips/${tripId}/planning`, label: "Planeamento", icon: "checklist" },
    { href: `/trips/${tripId}/documents`, label: "Documentos", icon: "file" },
    { href: `/trips/${tripId}/settings`, label: "Definições da viagem", icon: "settings" },
  ] : [];
  const isActive = (href: string) => pathname === href || (tripId !== null && href.startsWith(`/trips/${tripId}/`) && pathname.startsWith(`${href}/`));
  const renderLink = ({ href, label, icon }: NavLink) => {
    const active = isActive(href);
    return <Link key={href} href={href} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} aria-current={active ? "page" : undefined} className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${active ? "bg-elevated font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)]" : "text-muted-foreground hover:bg-elevated hover:text-foreground"}`}>
      {active ? <span aria-hidden="true" className="absolute -left-3 h-6 w-1 rounded-r-full bg-primary" /> : null}
      <span aria-hidden="true" className={`flex size-8 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}><Icon name={icon} size={16} /></span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active ? <Icon name="chevronRight" size={16} className="text-muted-foreground" /> : null}
    </Link>;
  };
  const navigation = <>
    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Menu principal</p>
    <div className="space-y-1">{([{ href: "/trips", label: "Todas as viagens", icon: "grid" }, { href: "/trips/new", label: "Nova viagem", icon: "plus" }] as NavLink[]).map(renderLink)}</div>
    {tripLinks.length > 0 && <div className="mt-6 border-t border-border pt-5">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Nesta viagem</p>
      <div className="space-y-1">{tripLinks.map(renderLink)}</div>
    </div>}
    <div className="mt-6 border-t border-border pt-4"><Link href="/settings" aria-current={pathname === "/settings" ? "page" : undefined} className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-elevated hover:text-foreground"><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-muted"><Icon name="users" size={16} /></span>Definições da conta</Link></div>
  </>;
  return <div className="min-h-screen bg-background text-foreground">
    <a href="#workspace-content" className="sr-only z-50 rounded-full bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar para o conteúdo</a>
    <aside className="fixed inset-y-0 left-0 hidden w-[260px] flex-col border-r border-border bg-surface lg:flex">
      <div className="px-6 py-6"><Brand href="/trips" /></div>
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-2">{navigation}</nav>
      <div className="m-3 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">{account ?? <span className="flex items-center gap-2"><Icon name="compass" size={16} className="text-link" />Um espaço para cada viagem.</span>}</div>
    </aside>
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden"><Brand href="/trips" /><details key={pathname}><summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium [&::-webkit-details-marker]:hidden"><Icon name="menu" size={16} />Menu de navegação</summary><div className="absolute inset-x-0 top-full max-h-[80vh] overflow-y-auto border-b border-border bg-surface px-4 pb-4 pt-4 shadow-2xl"><nav aria-label="Navegação principal">{navigation}</nav>{account && <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{account}</div>}</div></details></header>
    <div id="workspace-content" tabIndex={-1} className="min-w-0 lg:ml-[260px]">{children}</div>
  </div>;
}
