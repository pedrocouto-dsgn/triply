"use client";

import { useState } from "react";
import { BarList, ChartLegend, ColumnChart, DonutChart, RingProgress, StackedBar } from "@/components/ui/charts";
import { Icon } from "@/components/ui/icons";
import { DestinationImage } from "@/components/ui/media";
import { Badge, button, EmptyState, HeroChip, Notice, PageHero, Panel, StatTile } from "@/components/ui/page";
import { TripDashboard } from "@/features/dashboard/components/trip-dashboard";
import type { DashboardData } from "@/features/dashboard/types";
import type { Stop } from "@/features/route/types";
import { TripCard } from "@/features/trips/components/trip-card";
import type { Trip } from "@/features/trips/types";
import { calculateSavingsPlan } from "@/features/savings/calculations";
import { AppShell } from "./app-shell";

const exampleTrip: Trip = {
  id: "00000000-0000-4000-8000-000000000001",
  userId: "00000000-0000-4000-8000-000000000002",
  name: "Japão, ao nosso ritmo",
  startDate: "2027-04-03", endDate: "2027-04-17",
  originLabel: "Lisboa", returnLabel: "Lisboa", travelersCount: 2,
  baseCurrency: "EUR", targetBudgetMinor: "420000", archivedAt: null,
  createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z",
};
const exampleStop = (position: number, placeName: string, arrivalDate: string, departureDate: string): Stop => ({
  id: `00000000-0000-4000-8000-00000000010${position}`, tripId: exampleTrip.id, position, placeName, countryCode: "JP", countryName: "Japão",
  arrivalDate, departureDate, timezone: "Asia/Tokyo", notes: null, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z",
});
const exampleStops = [exampleStop(1, "Tóquio", "2027-04-03", "2027-04-08"), exampleStop(2, "Quioto", "2027-04-08", "2027-04-13"), exampleStop(3, "Osaka", "2027-04-13", "2027-04-17")];

const palette = [
  ["Canvas", "#111315", "bg-background"], ["Cartão", "#1c2024", "bg-card"],
  ["Superfície", "#16191c", "bg-surface"], ["Elevado", "#252a2f", "bg-elevated"],
  ["Primária", "#c6f432", "bg-primary"], ["Texto", "#f5f7f2", "bg-foreground"],
] as const;
const chartPalette = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6", "bg-chart-7"];
const panel = "rounded-card border border-border bg-card p-5 sm:p-7";
const exampleDashboard: DashboardData = {
  trip: exampleTrip,
  route: { status: "ready", data: { stops: exampleStops, legs: [] } },
  finance: { status: "ready", data: {
    data: { categories: [], costs: [], payments: [], actuals: [], adjustments: [] },
    totals: { estimated: 420000n, committed: 280000n, forecast: 380000n, paid: 160000n, actual: 145000n, unplannedActual: 0n },
  } },
  savings: { status: "ready", data: { record: null, calculation: calculateSavingsPlan({
    targetBudgetMinor: exampleTrip.targetBudgetMinor, forecastMinor: "380000", hasForecast: true,
    netPaidMinor: "160000", currentAvailableMinor: "80000", startDate: exampleTrip.startDate, today: "2026-09-06",
  }) } },
  itinerary: { status: "ready", data: [] },
  planning: { status: "ready", data: { reservations: [], checklist: [] } },
  documents: { status: "error" },
};
const budgetExample = [{ label: "Alojamento", value: 1600, display: "1 600,00 €" }, { label: "Transportes", value: 1200, display: "1 200,00 €" }, { label: "Experiências", value: 650, display: "650,00 €" }, { label: "Refeições", value: 350, display: "350,00 €" }];

export function DesignSystemShowcase() {
  const [name, setName] = useState("Japão, ao nosso ritmo");
  const [saved, setSaved] = useState(false);
  return (<AppShell account="Triply · Biblioteca visual">
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <DestinationImage seed="Triply biblioteca visual" className="rounded-feature border border-border">
        <div className="flex min-h-[260px] flex-col justify-end p-6 text-white sm:p-10">
          <p className="w-fit rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-medium backdrop-blur">Triply / Biblioteca visual</p>
          <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-6xl">Design system</h1>
          <p className="mt-3 max-w-2xl text-white/80">Cinza-carvão e verde-lima, com imagens, gráficos e banners a toda a largura. Simples de ler, fácil de usar.</p>
        </div>
      </DestinationImage>
      <p className="mt-4 text-sm text-warning">Exemplos fictícios · Os dados desta página são apenas demonstrativos.</p>
      <nav aria-label="Secções do design system" className="mt-4 flex flex-wrap gap-2 text-sm">{[["fundamentos", "Fundamentos"], ["componentes", "Componentes"], ["graficos", "Gráficos"], ["viagem", "Viagem e rota"]].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-border bg-card px-4 py-2 hover:border-primary/60">{label}</a>)}</nav>

      <section id="fundamentos" aria-labelledby="foundations-title" className="py-9">
        <h2 id="foundations-title" className="text-2xl font-semibold">01 / Fundamentos</h2>
        <p className="mt-2 text-sm text-muted-foreground">Superfícies escuras em camadas, um verde-lima de ação e cores de gráfico distintas.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{palette.map(([label, value, color]) => <div key={label} className="overflow-hidden rounded-card border border-border"><div aria-hidden="true" className={`h-20 border-b border-border ${color}`} /><div className="p-3"><p className="text-sm font-medium">{label}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{value}</p></div></div>)}</div>
        <div className="mt-3 flex gap-2" aria-label="Cores de gráfico">{chartPalette.map((color) => <span key={color} aria-hidden="true" className={`h-3 flex-1 rounded-full ${color}`} />)}</div>
        <div className={`${panel} mt-6`}><p className="text-xs uppercase tracking-widest text-muted-foreground">Tipografia · Sistema / Inter quando disponível</p><p className="mt-5 text-4xl font-light tracking-tight sm:text-5xl">Planeie a sua <span className="font-semibold">próxima viagem</span></p><p className="mt-4 max-w-xl leading-7 text-muted-foreground">Títulos fortes, texto com espaço para respirar e números fáceis de comparar. Uma viagem pode ter um ou muitos destinos.</p><p className="mt-5 font-mono text-sm text-muted-foreground">4 · 8 · 16 · 24 · 40 px / Raios: 12, 20 e 28 px</p></div>
      </section>

      <section id="componentes" aria-labelledby="components-title" className="border-t border-border py-9">
        <h2 id="components-title" className="text-2xl font-semibold">02 / Componentes</h2>
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <form className={panel} onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
            <h3 className="text-lg font-semibold">Formulário de exemplo</h3><p className="mt-2 text-sm text-muted-foreground">Experimente guardar. O exemplo fica apenas nesta página.</p>
            <label htmlFor="example-trip-name" className="mt-6 block text-sm font-medium">Nome da viagem</label><input id="example-trip-name" value={name} required onChange={(event) => { setName(event.target.value); setSaved(false); }} className="mt-2 h-12 w-full px-4" />
            <label htmlFor="example-invalid" className="mt-5 block text-sm font-medium">Data de fim · exemplo de erro</label><input id="example-invalid" defaultValue="" placeholder="Escolha uma data" aria-invalid="true" aria-describedby="example-invalid-help" className="mt-2 h-12 w-full px-4" /><p id="example-invalid-help" className="mt-2 text-sm text-destructive">Indique uma data de fim para a viagem.</p>
            <div className="mt-6 flex flex-wrap gap-3"><button className={button.primary} type="submit">Guardar exemplo</button><button type="button" onClick={() => { setName("Japão, ao nosso ritmo"); setSaved(false); }} className={button.secondary}>Repor</button><button type="button" disabled className="inline-flex min-h-11 items-center rounded-full bg-muted px-5 text-sm text-muted-foreground">Indisponível</button></div>
            <div role="status" className="mt-4 text-sm text-success">{saved ? "Exemplo guardado." : ""}</div>
          </form>
          <div className={panel}><h3 className="text-lg font-semibold">Estados e feedback</h3><div className="mt-6 space-y-3 text-sm"><Notice tone="success">Sucesso · Alterações guardadas.</Notice><Notice tone="warning">Atenção · Existem detalhes por completar.</Notice><Notice tone="danger">Erro · Não foi possível guardar. Tente novamente.</Notice><Notice tone="neutral">A carregar · A preparar o seu espaço.</Notice></div><div className="mt-4 flex flex-wrap gap-2"><Badge tone="primary">Próxima</Badge><Badge tone="success">Reservada</Badge><Badge tone="warning">Por rever</Badge><Badge tone="danger">Expirado</Badge><Badge>Arquivada</Badge></div><EmptyState className="mt-5" icon="ticket" title="Ainda não há reservas" description="As reservas da viagem aparecem aqui depois de serem adicionadas." /></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4"><StatTile icon="mapPin" label="Destinos" value="3" hint="1 país" /><StatTile icon="wallet" tone="success" label="Orçamento" value="4 200,00 €" hint="Dentro do orçamento" /><StatTile icon="piggy" tone="warning" label="Financiado" value="57%" /><StatTile icon="checklist" tone="neutral" label="Checklist" value="8/12" /></div>
      </section>

      <section id="graficos" aria-labelledby="charts-title" className="border-t border-border py-9">
        <h2 id="charts-title" className="text-2xl font-semibold">03 / Gráficos</h2>
        <p className="mt-2 text-sm text-muted-foreground">Cada gráfico mostra os valores em texto; a cor nunca é a única informação.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Panel><h3 className="font-semibold">Donut · categorias</h3><div className="mt-5 flex flex-wrap items-center gap-5"><DonutChart size={140} label="Exemplo de orçamento por categoria" segments={budgetExample} center={<><span className="text-xs text-muted-foreground">Total</span><span className="text-sm font-semibold">3 800,00 €</span></>} /><ChartLegend segments={budgetExample} className="min-w-40 flex-1" /></div></Panel>
          <Panel><h3 className="font-semibold">Anel · progresso</h3><div className="mt-5 flex items-center gap-5"><RingProgress percent={57} label="Exemplo de progresso" /><div className="flex-1 space-y-3"><p className="text-sm text-muted-foreground">Pago, comprometido e previsto</p><StackedBar label="Exemplo de barra empilhada" segments={[{ label: "Pago", value: 1600 }, { label: "Comprometido", value: 1200 }, { label: "Previsto", value: 1000 }]} /></div></div></Panel>
          <Panel><h3 className="font-semibold">Barras · destinos e dias</h3><BarList className="mt-5" items={[{ label: "Tóquio", value: 1700, display: "1 700,00 €" }, { label: "Quioto", value: 1150, display: "1 150,00 €" }, { label: "Osaka", value: 950, display: "950,00 €" }]} /><div className="mt-5"><ColumnChart label="Exemplo de atividades por dia" height={64} items={[2, 4, 3, 5, 1, 3, 4].map((value, index) => ({ label: `Dia ${index + 1}`, value }))} /></div></Panel>
        </div>
      </section>

      <section id="viagem" aria-labelledby="trip-example-title" className="border-t border-border py-9">
        <h2 id="trip-example-title" className="text-2xl font-semibold">04 / Viagem e rota</h2><p className="mt-2 text-sm text-muted-foreground">Exemplos fictícios · Datas locais de cada destino. Valores ilustrativos em EUR. As imagens são marcadores visuais gerados a partir do nome do destino.</p>
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><TripCard trip={exampleTrip} today="2026-09-06" /><div className={panel}><h3 className="text-lg font-semibold">Uma viagem, vários destinos</h3><p className="mt-2 text-sm text-muted-foreground">Partida de Lisboa · Regresso a Lisboa</p><ol className="scroll-row mt-5">{[["Tóquio", "3–8 abr. 2027"], ["Quioto", "8–13 abr. 2027"], ["Osaka", "13–17 abr. 2027"]].map(([city, dates], index) => <li key={city}><DestinationImage seed={city} className="h-40 w-48 rounded-2xl border border-border"><div className="flex h-full flex-col justify-between p-3 text-white"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span><div><p className="font-semibold">{city}</p><p className="flex items-center gap-1 text-xs text-white/75"><Icon name="calendar" size={12} />{dates}</p></div></div></DestinationImage></li>)}</ol></div></div>
      </section>
      <section aria-labelledby="dashboard-example-title" className="border-t border-border py-9">
        <h2 id="dashboard-example-title" className="text-2xl font-semibold">05 / Visão geral da viagem</h2>
        <p className="mb-6 mt-2 text-sm text-warning">Exemplos fictícios · Demonstração do dashboard com totais ilustrativos, secções vazias e erro de documentos simulado.</p>
        <PageHero bleed={false} seed="Tóquio" headingLevel={2} eyebrow={<><Icon name="calendar" size={14} />3 abr. 2027 — 17 abr. 2027</>} title={exampleTrip.name} meta={<><HeroChip icon="sun">15 dias</HeroChip><HeroChip icon="users">2 viajantes</HeroChip></>}><TripTabsPreview /></PageHero>
        <div className="mt-4"><TripDashboard dashboard={exampleDashboard} today="2026-09-06" /></div>
      </section>
      <footer className="border-t border-border py-6 text-xs text-muted-foreground">Triply · Carvão + verde-lima, inspirado nas referências de layout do projeto.</footer>
    </main>
  </AppShell>);
}

function TripTabsPreview() {
  return <div aria-hidden="true" className="scroll-row w-fit max-w-full rounded-full border border-white/10 bg-black/45 p-1.5 backdrop-blur-md">{["Visão geral", "Rota", "Orçamento", "Poupança", "Itinerário"].map((label, index) => <span key={label} className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium ${index === 0 ? "bg-primary text-primary-foreground" : "text-white/80"}`}>{label}</span>)}</div>;
}
