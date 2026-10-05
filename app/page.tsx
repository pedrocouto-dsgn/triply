import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { ChartLegend, ColumnChart, DonutChart, RingProgress } from "@/components/ui/charts";
import { Icon, type IconName } from "@/components/ui/icons";
import { DestinationImage } from "@/components/ui/media";
import { button, IconBadge } from "@/components/ui/page";

const exampleRoute = [{ city: "Lisboa", country: "Portugal" }, { city: "Madrid", country: "Espanha" }, { city: "Paris", country: "França" }];
const inspiration = [
  { city: "Quioto", country: "Japão", tag: "Cultura" }, { city: "Marraquexe", country: "Marrocos", tag: "Mercados" },
  { city: "Reiquiavique", country: "Islândia", tag: "Natureza" }, { city: "Lisboa", country: "Portugal", tag: "Cidade" },
  { city: "Bali", country: "Indonésia", tag: "Praia" }, { city: "Nova Iorque", country: "EUA", tag: "Cidade" },
];
const budgetExample = [{ label: "Alojamento", value: 45, display: "45%" }, { label: "Transportes", value: 30, display: "30%" }, { label: "Experiências", value: 15, display: "15%" }, { label: "Outros", value: 10, display: "10%" }];
const features: { icon: IconName; title: string; description: string }[] = [
  { icon: "route", title: "Todos os destinos, por ordem", description: "Paragens e trajetos entre cidades e países, numa rota que faz sentido." },
  { icon: "wallet", title: "As contas, com contexto", description: "Orçamento, poupança e custos, distinguindo estimativas de valores reais." },
  { icon: "calendar", title: "Cada dia planeado", description: "Itinerário diário com horas locais e transportes no sítio certo." },
  { icon: "file", title: "Tudo pronto para partir", description: "Reservas, listas e documentos privados junto dos seus planos." },
];

export default function HomePage() {
  return <main className="min-h-screen bg-background text-foreground">
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8"><Brand /><nav aria-label="Conta" className="flex items-center gap-2"><Link href="/auth/sign-in" className={button.ghost}>Iniciar sessão</Link><Link href="/auth/sign-up" className={button.secondary}>Criar conta</Link></nav></header>

    <section className="mx-auto max-w-7xl px-4 sm:px-8">
      <DestinationImage seed="Triply Alpes ao pôr do sol" variant={0} className="rounded-feature border border-border">
        <div className="flex min-h-[540px] flex-col justify-between gap-10 p-6 sm:p-10 lg:p-14">
          <div className="max-w-2xl text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-medium backdrop-blur"><Icon name="sparkles" size={14} />Um espaço para a viagem inteira</p>
            <h1 className="mt-6 border-l-4 border-primary pl-5 text-5xl font-bold uppercase leading-[0.98] tracking-[-0.03em] sm:text-6xl lg:text-7xl">Planeie a sua<br />próxima viagem</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/85 sm:text-lg">Destinos, orçamento, itinerário e documentos num único lugar. Do primeiro esboço a cada etapa pelo caminho.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link className={button.primary} href="/auth/sign-up">Começar a planear <Icon name="arrowUpRight" size={16} /></Link><Link className={button.glass} href="/auth/sign-in">Já tenho conta</Link></div>
          </div>
          <figure className="rounded-3xl border border-white/15 bg-black/45 p-4 text-white backdrop-blur-md sm:p-5">
            <figcaption className="flex items-center justify-between gap-3 text-xs text-white/70"><span>Uma viagem, várias etapas</span><span className="rounded-full bg-white/10 px-2 py-0.5">Exemplo de rota</span></figcaption>
            <ol className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">{exampleRoute.map((stop, index) => <li key={stop.city} className="flex items-center gap-2 sm:gap-3"><span className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2"><span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{index + 1}</span><span className="text-sm font-semibold">{stop.city}</span><span className="hidden text-xs text-white/60 sm:inline">{stop.country}</span></span>{index < exampleRoute.length - 1 ? <Icon name={index === 0 ? "train" : "plane"} size={18} className="text-white/70" /> : null}</li>)}</ol>
          </figure>
        </div>
      </DestinationImage>
    </section>

    <section aria-labelledby="inspiration-title" className="mx-auto mt-16 max-w-7xl px-4 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-link">Inspiração</p><h2 id="inspiration-title" className="mt-2 text-3xl font-semibold tracking-tight">Para onde vai a seguir?</h2></div><p className="text-sm text-muted-foreground">Exemplos ilustrativos · as imagens são marcadores visuais.</p></div>
      <div className="scroll-row mt-6">{inspiration.map((place) => <DestinationImage key={place.city} seed={place.city} className="h-64 w-56 rounded-card border border-border sm:w-64"><div className="flex h-full flex-col justify-between p-4 text-white"><span className="w-fit rounded-full bg-black/40 px-2.5 py-1 text-xs backdrop-blur">{place.tag}</span><div><p className="text-xl font-semibold">{place.city}</p><p className="flex items-center gap-1 text-sm text-white/75"><Icon name="mapPin" size={14} />{place.country}</p></div></div></DestinationImage>)}</div>
    </section>

    <section aria-labelledby="features-title" className="mx-auto mt-16 max-w-7xl px-4 sm:px-8">
      <h2 id="features-title" className="sr-only">O que pode organizar</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature) => <article key={feature.title} className="rounded-card border border-border bg-card p-6"><IconBadge icon={feature.icon} /><h3 className="mt-5 text-base font-semibold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p></article>)}</div>
    </section>

    <section aria-labelledby="preview-title" className="mx-auto mt-16 max-w-7xl px-4 sm:px-8">
      <div className="rounded-feature border border-border bg-surface p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-link">Visual e claro</p><h2 id="preview-title" className="mt-2 text-3xl font-semibold tracking-tight">Veja a viagem de relance</h2></div><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Dados de exemplo</span></div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-card border border-border bg-card p-5"><h3 className="font-semibold">Distribuição do orçamento</h3><div className="mt-5 flex flex-wrap items-center gap-6"><DonutChart size={140} label="Exemplo de distribuição do orçamento por categoria" segments={budgetExample} center={<><span className="text-xs text-muted-foreground">Total</span><span className="text-lg font-semibold">100%</span></>} /><ChartLegend segments={budgetExample} className="min-w-40 flex-1" /></div></article>
          <article className="rounded-card border border-border bg-card p-5"><h3 className="font-semibold">Poupança para a viagem</h3><div className="mt-5 flex items-center gap-6"><RingProgress percent={68} label="Exemplo de progresso da poupança" /><p className="text-sm leading-6 text-muted-foreground">Acompanhe quanto falta financiar e o ritmo sugerido até à partida.</p></div></article>
          <article className="rounded-card border border-border bg-card p-5"><h3 className="font-semibold">Atividades por dia</h3><div className="mt-5"><ColumnChart label="Exemplo de atividades planeadas por dia" items={[3, 5, 2, 4, 6, 1, 3].map((value, index) => ({ label: `Dia ${index + 1}`, value }))} /><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Dia 1</span><span>Dia 7</span></div></div></article>
        </div>
      </div>
    </section>

    <footer className="mx-auto mt-16 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-6 text-xs text-muted-foreground sm:px-8"><span>Triply — cada etapa no seu lugar.</span><Link href="/auth/sign-in" className="inline-flex items-center gap-1 hover:text-foreground">Voltar ao meu espaço <Icon name="arrowUpRight" size={14} /></Link></footer>
  </main>;
}
