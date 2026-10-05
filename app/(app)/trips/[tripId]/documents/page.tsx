import Link from "next/link";
import { notFound } from "next/navigation";
import { BarList, ChartLegend, DonutChart } from "@/components/ui/charts";
import { Icon, type IconName } from "@/components/ui/icons";
import { Badge, button, EmptyState, IconBadge, PageContainer, Panel, SectionHeader, type Tone } from "@/components/ui/page";
import { deriveDocumentValidity, expiresDuringTrip, type DocumentValidity } from "@/features/documents/helpers";
import { documentTypeLabels } from "@/features/documents/labels";
import { listOwnedDocuments } from "@/features/documents/queries";
import type { DocumentType } from "@/features/documents/types";
import { getOwnedRoute } from "@/features/route/queries";
import { todayInLisbon } from "@/features/trips/lifecycle";
import { TripHero } from "@/features/trips/components/trip-hero";
import { getOwnedTrip } from "@/features/trips/queries";

const validityLabels: Record<DocumentValidity, string> = { expired: "Expirado", expiring_soon: "Expira em breve", valid: "Válido", no_expiry: "Sem validade indicada" };
const validityTones: Record<DocumentValidity, Tone> = { expired: "danger", expiring_soon: "warning", valid: "success", no_expiry: "neutral" };
const validityColors: Record<DocumentValidity, string> = { expired: "var(--chart-6)", expiring_soon: "var(--chart-2)", valid: "var(--chart-3)", no_expiry: "var(--chart-7)" };
const typeIcons: Partial<Record<DocumentType, IconName>> = { passport: "globe", national_id: "users", visa: "shield", travel_insurance: "shield", ticket_or_boarding_pass: "ticket", accommodation_voucher: "bed", reservation_voucher: "ticket", driver_document: "car", rental_document: "car" };
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function DocumentsPage({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const [trip, documents, route] = await Promise.all([getOwnedTrip(tripId), listOwnedDocuments(tripId), getOwnedRoute(tripId)]);
  if (!trip || !documents || !route) notFound();
  const today = todayInLisbon(), q = (first(query.q) ?? "").toLocaleLowerCase("pt-PT"), type = first(query.type), holder = first(query.holder), stop = first(query.stop), status = first(query.status);
  const shown = documents.filter((d) => !q || `${d.title} ${d.holderLabel ?? ""}`.toLocaleLowerCase("pt-PT").includes(q)).filter((d) => !type || d.type === type).filter((d) => !holder || d.holderLabel === holder).filter((d) => !stop || d.stopId === stop).filter((d) => !status || deriveDocumentValidity(d.expiryDate, today) === status).sort((a, b) => rank(deriveDocumentValidity(a.expiryDate, today)) - rank(deriveDocumentValidity(b.expiryDate, today)));
  const holders = [...new Set(documents.map((d) => d.holderLabel).filter((x): x is string => Boolean(x)))].sort();
  const validitySegments = (Object.keys(validityLabels) as DocumentValidity[]).map((key) => { const count = documents.filter((d) => deriveDocumentValidity(d.expiryDate, today) === key).length; return { label: validityLabels[key], value: count, display: String(count), color: validityColors[key] }; });
  const typeCounts = [...new Set(documents.map((d) => d.type))].map((key) => { const count = documents.filter((d) => d.type === key).length; return { label: documentTypeLabels[key], value: count, display: String(count) }; }).sort((a, b) => b.value - a.value);
  return <PageContainer hero={<TripHero trip={trip} active="documents" title="Documentos" description="Organize metadados e ficheiros privados sem guardar identificadores sensíveis desnecessários." actions={<Link href={`/trips/${tripId}/documents/new`} className={button.primary}><Icon name="plus" size={16} />Adicionar documento</Link>} />}>

    {documents.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Panel aria-labelledby="validity-title"><SectionHeader id="validity-title" as="h2" title="Validade" description={`${documents.length} registo(s) · ${documents.filter((d) => d.attachmentPath).length} com ficheiro`} /><div className="mt-5 flex flex-wrap items-center gap-6"><DonutChart size={132} thickness={15} label={`Documentos por validade: ${validitySegments.map((item) => `${item.label} ${item.display}`).join(", ")}`} segments={validitySegments} center={<><span className="text-2xl font-semibold">{documents.length}</span><span className="text-xs text-muted-foreground">registos</span></>} /><ChartLegend segments={validitySegments} className="min-w-40 flex-1" /></div></Panel>
      <Panel aria-labelledby="types-title"><SectionHeader id="types-title" as="h2" title="Por tipo" /><BarList className="mt-5" items={typeCounts.slice(0, 5)} /></Panel>
    </div> : null}

    <form className="mt-4 grid gap-3 rounded-card border border-border bg-card p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]">
      <label className="relative sm:col-span-2 xl:col-span-1"><span className="sr-only">Pesquisar documentos</span><Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input name="q" defaultValue={q} placeholder="Pesquisar título ou titular" aria-label="Pesquisar documentos" className="h-11 w-full min-w-0 rounded-control border border-input bg-surface pl-9 pr-3" /></label>
      <Filter name="type" label="Todos os tipos" value={type} items={Object.entries(documentTypeLabels)} />
      <Filter name="holder" label="Todos os titulares" value={holder} items={holders.map((x) => [x, x])} />
      <Filter name="stop" label="Todos os destinos" value={stop} items={route.stops.map((x) => [x.id, x.placeName])} />
      <Filter name="status" label="Todos os estados" value={status} items={Object.entries(validityLabels)} />
      <button className={`${button.secondary} sm:col-span-2 xl:col-span-1`}>Aplicar filtros</button>
    </form>

    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map((document) => {
      const validity = deriveDocumentValidity(document.expiryDate, today), during = expiresDuringTrip(document, trip.endDate);
      return <article key={document.id} className="flex flex-col rounded-card border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3"><IconBadge icon={typeIcons[document.type] ?? "file"} tone={validityTones[validity]} /><Badge tone={validityTones[validity]}>{validityLabels[validity]}</Badge></div>
        <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">{documentTypeLabels[document.type]}</p>
        <h2 className="mt-1 text-lg font-semibold">{document.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{document.holderLabel ? `Titular: ${document.holderLabel} · ` : ""}{document.attachmentPath ? "Ficheiro disponível" : "Sem ficheiro"}{document.expiryDate ? ` · Validade ${document.expiryDate}` : ""}</p>
        <div className="pb-4">{during ? <p role="status" className="mt-3 text-sm font-semibold text-warning">Atenção: expira antes do fim da viagem. Confirme os requisitos oficiais aplicáveis.</p> : null}{document.needsReview ? <p role="status" className="mt-3 text-sm font-semibold text-warning">Rever associação: o item relacionado foi alterado ou removido.</p> : null}</div>
        <div className="mt-auto flex flex-wrap gap-4 border-t border-border pt-4 text-sm font-semibold"><Link href={`/trips/${tripId}/documents/${document.id}/edit`} className="text-link underline">Editar</Link>{document.attachmentPath ? <a href={`/trips/${tripId}/documents/${document.id}/download`} className="text-link underline">Abrir ficheiro</a> : null}</div>
      </article>;
    })}{!shown.length ? <EmptyState className="md:col-span-2 xl:col-span-3" icon="file" title={documents.length ? "Nenhum documento corresponde aos filtros" : "Ainda não existem documentos"} description="Pode começar por um passaporte, seguro, visto ou voucher quando for relevante." action={<Link href={`/trips/${tripId}/documents/new`} className={button.primary}>Adicionar documento</Link>} /> : null}</section>
  </PageContainer>;
}

function Filter({ name, label, value, items }: { name: string; label: string; value?: string; items: [string, string][] }) { return <select name={name} defaultValue={value ?? ""} aria-label={label} className="h-11 min-w-0 rounded-control border border-input bg-surface px-3"><option value="">{label}</option>{items.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select>; }
function rank(value: DocumentValidity) { return value === "expired" ? 0 : value === "expiring_soon" ? 1 : value === "valid" ? 2 : 3; }
