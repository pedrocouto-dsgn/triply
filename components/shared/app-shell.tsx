"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { signOutAction } from "@/features/auth/actions";
import { Brand } from "./brand";

type NavLink = { href: string; label: string; icon: IconName };

// Sidebar preference lives in localStorage; the store pattern keeps server and client renders consistent.
const SIDEBAR_KEY = "triply.sidebar", SIDEBAR_EVENT = "triply:sidebar";
function readSidebarCollapsed() {
  try { return window.localStorage.getItem(SIDEBAR_KEY) === "collapsed"; } catch { return false; }
}
function subscribeSidebar(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SIDEBAR_EVENT, onChange);
  return () => { window.removeEventListener("storage", onChange); window.removeEventListener(SIDEBAR_EVENT, onChange); };
}

export function AppShell({ children, account, userName, trips = [] }: { children: ReactNode; account?: ReactNode; userName?: string; trips?: { id: string; name: string }[] }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeSidebar, readSidebarCollapsed, () => false);
  const toggle = () => {
    try { window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "expanded" : "collapsed"); } catch { /* storage unavailable */ }
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  };
  const segments = pathname.split("/").filter(Boolean);
  const tripId = segments[0] === "trips" && segments[1] && segments[1] !== "new" ? segments[1] : null;
  const tripLinks: NavLink[] = tripId ? [
    { href: `/trips/${tripId}`, label: "Visão geral", icon: "home" },
    { href: `/trips/${tripId}/route`, label: "Rota e destinos", icon: "route" },
    { href: `/trips/${tripId}/finance`, label: "Orçamento", icon: "wallet" },
    { href: `/trips/${tripId}/savings`, label: "Poupança", icon: "piggy" },
    { href: `/trips/${tripId}/itinerary`, label: "Itinerário", icon: "calendar" },
    { href: `/trips/${tripId}/planning`, label: "Planeamento", icon: "checklist" },
    { href: `/trips/${tripId}/documents`, label: "Documentos", icon: "file" },
    { href: `/trips/${tripId}/settings`, label: "Definições da viagem", icon: "settings" },
  ] : [];
  const isActive = (href: string) => pathname === href || (tripId !== null && href.startsWith(`/trips/${tripId}/`) && pathname.startsWith(`${href}/`)) || (tripId !== null && href === `/trips/${tripId}/route` && /\/(destinations|transport)(\/|$)/.test(pathname));
  const renderLink = ({ href, label, icon }: NavLink, compact = false) => {
    const active = isActive(href);
    return <Link key={href} href={href} title={compact ? label : undefined} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} aria-current={active ? "page" : undefined} className={`group relative flex min-h-11 items-center gap-3 rounded-xl py-2 text-sm transition-colors ${compact ? "justify-center px-0" : "px-3"} ${active ? "bg-elevated font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)]" : "text-muted-foreground hover:bg-elevated hover:text-foreground"}`}>
      {active ? <span aria-hidden="true" className="absolute -left-3 h-6 w-1 rounded-r-full bg-primary" /> : null}
      <span aria-hidden="true" className={`flex size-8 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}><Icon name={icon} size={16} /></span>
      <span className={compact ? "sr-only" : "min-w-0 flex-1 truncate"}>{label}</span>
      {active && !compact ? <Icon name="chevronRight" size={16} className="text-muted-foreground" /> : null}
    </Link>;
  };
  const navigation = (compact: boolean) => <>
    <p className={compact ? "sr-only" : "mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"}>Menu principal</p>
    <div className="space-y-1">{([{ href: "/trips", label: "Todas as viagens", icon: "grid" }, { href: "/trips/new", label: "Nova viagem", icon: "plus" }] as NavLink[]).map((link) => renderLink(link, compact))}</div>
    {trips.length ? <div className="mt-4">
      <p className={compact ? "sr-only" : "mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"}>As minhas viagens</p>
      <div className="space-y-1">{trips.map((trip) => <Link key={trip.id} href={`/trips/${trip.id}`} title={compact ? trip.name : undefined} data-current={tripId === trip.id || undefined} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className={`flex min-h-10 items-center gap-3 rounded-xl py-1.5 text-sm transition-colors ${compact ? "justify-center" : "px-3"} ${tripId === trip.id ? "text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground"}`}><span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase ${tripId === trip.id ? "bg-primary-muted text-link" : "bg-muted"}`}>{trip.name.trim().charAt(0) || "V"}</span><span className={compact ? "sr-only" : "min-w-0 flex-1 truncate"}>{trip.name}</span></Link>)}</div>
    </div> : null}
    {tripLinks.length > 0 && <div className="mt-6 border-t border-border pt-5">
      <p className={compact ? "sr-only" : "mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"}>Nesta viagem</p>
      <div className="space-y-1">{tripLinks.map((link) => renderLink(link, compact))}</div>
    </div>}
    <div className="mt-6 border-t border-border pt-4"><Link href="/settings" title={compact ? "Definições da conta" : undefined} aria-current={pathname === "/settings" ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl py-2 text-sm text-muted-foreground hover:bg-elevated hover:text-foreground ${compact ? "justify-center" : "px-3"}`}><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-muted"><Icon name="users" size={16} /></span><span className={compact ? "sr-only" : ""}>Definições da conta</span></Link></div>
  </>;
  return <div className="min-h-screen bg-background text-foreground">
    <a href="#workspace-content" className="sr-only z-50 rounded-full bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar para o conteúdo</a>
    <aside data-collapsed={collapsed} className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex ${collapsed ? "w-[84px]" : "w-[260px]"}`}>
      <div className={`flex items-center py-5 ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>{collapsed ? null : <Brand href="/trips" />}<button type="button" onClick={toggle} aria-expanded={!collapsed} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} title={collapsed ? "Expandir menu" : "Recolher menu"} className="flex size-10 min-h-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground"><Icon name="sidebar" size={18} className={collapsed ? "rotate-180" : ""} /></button></div>
      {userName && !collapsed ? <div className="mx-5 mb-3 border-b border-border pb-4"><p className="text-xs text-muted-foreground">Bem-vindo de volta</p><p className="mt-0.5 truncate text-xl font-semibold tracking-tight">{userName}</p></div> : null}
      <nav aria-label="Navegação principal" className={`flex-1 overflow-y-auto py-2 ${collapsed ? "px-3" : "px-3"}`}>{navigation(collapsed)}</nav>
      {account ? (collapsed ? null : <div className="m-3 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">{account}</div>) : <form action={signOutAction} className="m-3"><button title={collapsed ? "Terminar sessão" : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-card py-2 text-sm text-muted-foreground hover:text-foreground ${collapsed ? "justify-center" : "px-3"}`}><Icon name="logout" size={16} /><span className={collapsed ? "sr-only" : ""}>Terminar sessão</span></button></form>}
    </aside>
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden"><Brand href="/trips" /><details key={pathname}><summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium [&::-webkit-details-marker]:hidden"><Icon name="menu" size={16} />Menu de navegação</summary><div className="absolute inset-x-0 top-full max-h-[80vh] overflow-y-auto border-b border-border bg-surface px-4 pb-4 pt-4 shadow-2xl">{userName ? <div className="mb-4 border-b border-border pb-3"><p className="text-xs text-muted-foreground">Bem-vindo de volta</p><p className="text-lg font-semibold">{userName}</p></div> : null}<nav aria-label="Navegação principal">{navigation(false)}</nav>{account ? <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{account}</div> : <form action={signOutAction} className="mt-3 border-t border-border pt-3"><button className="flex min-h-11 items-center gap-3 px-3 text-sm text-muted-foreground hover:text-foreground"><Icon name="logout" size={16} />Terminar sessão</button></form>}</div></details></header>
    <div id="workspace-content" tabIndex={-1} className={`min-w-0 transition-[margin] duration-200 ${collapsed ? "lg:ml-[84px]" : "lg:ml-[260px]"}`}>{children}</div>
  </div>;
}
