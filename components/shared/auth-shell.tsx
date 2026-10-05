import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { DestinationImage } from "@/components/ui/media";
import { Brand } from "./brand";

const steps: { icon: IconName; label: string }[] = [{ icon: "compass", label: "Imaginar a viagem" }, { icon: "route", label: "Organizar cada etapa" }, { icon: "plane", label: "Partir com tudo preparado" }];

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[1.05fr_1fr]">
    <DestinationImage seed="Triply costa ao entardecer" variant={6} className="min-h-[220px] lg:m-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-feature">
      <div className="flex h-full min-h-[220px] flex-col justify-between p-6 sm:p-10 lg:min-h-[calc(100vh-2rem)] lg:p-12">
        <Brand tone="light" />
        <div className="hidden max-w-md text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Menos separadores. Mais viagem.</p>
          <h2 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight">Cada destino.<br />Tudo no seu lugar.</h2>
          <p className="mt-5 text-base leading-7 text-white/80">Da primeira ideia ao último destino, reúna a rota, as contas e os planos num único espaço.</p>
          <ol aria-hidden="true" className="mt-10 grid gap-3">{steps.map((step, index) => <li key={step.label} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 backdrop-blur"><span className="flex size-9 items-center justify-center rounded-xl bg-white/15"><Icon name={step.icon} size={18} /></span><span className="text-sm font-medium">{step.label}</span><span className="ml-auto text-xs text-white/60">0{index + 1}</span></li>)}</ol>
        </div>
        <p className="hidden text-xs text-white/70 lg:block">O seu próximo capítulo começa aqui.</p>
      </div>
    </DestinationImage>
    <section className="relative flex items-center justify-center overflow-hidden px-4 py-12 sm:px-10 lg:px-16">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative w-full max-w-md rounded-feature border border-border bg-card/80 p-6 shadow-2xl backdrop-blur sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-link">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  </main>;
}
