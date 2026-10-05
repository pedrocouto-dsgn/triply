import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icons";
import { DestinationImage } from "./media";

export const button = {
  primary: "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60",
  secondary: "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-elevated px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60",
  ghost: "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
  glass: "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-black/35 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-black/55",
} as const;

export function PageContainer({ children, width = "wide", className }: { children: ReactNode; width?: "wide" | "medium" | "narrow"; className?: string }) {
  const max = width === "wide" ? "max-w-7xl" : width === "medium" ? "max-w-5xl" : "max-w-3xl";
  return <main className={cn("min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10 lg:py-8", className)}><div className={cn("mx-auto", max)}>{children}</div></main>;
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-sm font-medium text-muted-foreground hover:text-foreground"><span className="flex size-8 items-center justify-center rounded-full border border-border bg-card"><Icon name="arrowLeft" size={16} /></span>{children}</Link>;
}

/** Image banner used at the top of trip pages. */
export function PageHero({ seed, eyebrow, title, description, actions, meta, children, size = "md", headingLevel = 1 }: { seed: string; eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; meta?: ReactNode; children?: ReactNode; size?: "sm" | "md" | "lg"; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const height = size === "lg" ? "min-h-[300px] sm:min-h-[340px]" : size === "md" ? "min-h-[220px] sm:min-h-[250px]" : "min-h-[170px]";
  return <DestinationImage seed={seed} className={cn("rounded-feature border border-border", height)}>
    <div className={cn("flex h-full flex-col justify-end gap-5 p-5 sm:p-8", height)}>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 max-w-3xl text-white">
          {eyebrow ? <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-medium backdrop-blur">{eyebrow}</p> : null}
          <Heading className="mt-3 text-3xl font-semibold tracking-tight drop-shadow sm:text-5xl">{title}</Heading>
          {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{description}</p> : null}
          {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  </DestinationImage>;
}

export function HeroChip({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">{icon ? <Icon name={icon} size={14} /> : null}{children}</span>;
}

export function SectionHeader({ title, description, action, id, as: Heading = "h2" }: { title: ReactNode; description?: ReactNode; action?: ReactNode; id?: string; as?: "h2" | "h3" }) {
  return <div className="flex flex-wrap items-end justify-between gap-3"><div className="min-w-0"><Heading id={id} className="text-xl font-semibold tracking-tight">{title}</Heading>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>{action}</div>;
}

export function Panel({ children, className, as: Tag = "section", ...props }: { children: ReactNode; className?: string; as?: "section" | "article" | "div" } & React.HTMLAttributes<HTMLElement>) {
  return <Tag className={cn("min-w-0 rounded-card border border-border bg-card p-5 sm:p-6", className)} {...props}>{children}</Tag>;
}

const tones = {
  primary: "bg-primary-muted text-link",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-destructive-muted text-destructive",
  neutral: "bg-muted text-muted-foreground",
} as const;
export type Tone = keyof typeof tones;

export function IconBadge({ icon, tone = "primary", size = "md" }: { icon: IconName; tone?: Tone; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-12 rounded-2xl" : size === "md" ? "size-10 rounded-xl" : "size-8 rounded-lg";
  return <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center", box, tones[tone])}><Icon name={icon} size={size === "sm" ? 16 : 20} /></span>;
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

export function StatTile({ icon, label, value, hint, tone = "primary" }: { icon: IconName; label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return <article className="min-w-0 rounded-card border border-border bg-card p-5"><div className="flex items-center gap-3"><IconBadge icon={icon} tone={tone} size="sm" /><p className="text-sm text-muted-foreground">{label}</p></div><p className="mt-4 break-words text-2xl font-semibold tracking-tight tabular-nums">{value}</p>{hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}</article>;
}

export function EmptyState({ icon, title, description, action, className }: { icon: IconName; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col items-center rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center", className)}><IconBadge icon={icon} size="lg" /><h3 className="mt-4 text-base font-semibold">{title}</h3>{description ? <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}{action ? <div className="mt-5">{action}</div> : null}</div>;
}

export function Notice({ tone, children, role = "status" }: { tone: Exclude<Tone, "neutral" | "primary"> | "neutral"; children: ReactNode; role?: "status" | "alert" }) {
  const icon: IconName = tone === "success" ? "check" : tone === "neutral" ? "clock" : "alert";
  return <p role={role} className={cn("flex items-start gap-3 rounded-control border p-4 text-sm font-medium", tone === "success" ? "border-success/40 bg-success-muted text-success" : tone === "warning" ? "border-warning/40 bg-warning-muted text-warning" : tone === "danger" ? "border-destructive/40 bg-destructive-muted text-destructive" : "border-border bg-muted text-muted-foreground")}><Icon name={icon} size={18} className="mt-0.5 shrink-0" /><span>{children}</span></p>;
}

/** Consistent frame for every create/edit form. */
export function FormShell({ backHref, backLabel, eyebrow, title, description, icon = "pencil", children, aside }: { backHref: string; backLabel: string; eyebrow?: string; title: string; description?: ReactNode; icon?: IconName; children: ReactNode; aside?: ReactNode }) {
  return <PageContainer width="narrow">
    <BackLink href={backHref}>{backLabel}</BackLink>
    <header className="my-6 flex items-start gap-4"><IconBadge icon={icon} size="lg" /><div className="min-w-0">{eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-link">{eyebrow}</p> : null}<h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>{description ? <p className="mt-2 leading-7 text-muted-foreground">{description}</p> : null}</div></header>
    <section className="rounded-feature border border-border bg-card p-5 sm:p-8">{children}</section>
    {aside}
  </PageContainer>;
}
