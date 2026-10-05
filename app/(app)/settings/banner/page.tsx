import { FormShell, Notice } from "@/components/ui/page";
import { removeTripsBannerAction, uploadTripsBannerAction } from "@/features/profile/banner-actions";
import { getTripsBanner } from "@/features/profile/banner";
import { ImageUploadForm } from "@/features/route/components/stop-image-form";

export default async function TripsBannerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ image, hasUpload }, query] = await Promise.all([getTripsBanner(), searchParams]);
  return <FormShell backHref="/trips" backLabel="Todas as viagens" eyebrow="Capa" icon="image" title="Capa de “As suas viagens”" description="Esta imagem é só desta página. Pode trocá-la sempre que quiser, sem mudar a imagem de nenhuma viagem ou destino.">
    {query.saved ? <div className="mb-4"><Notice tone="success">Capa guardada.</Notice></div> : query.removed ? <div className="mb-4"><Notice tone="success">Capa removida.</Notice></div> : null}
    <ImageUploadForm upload={uploadTripsBannerAction} remove={removeTripsBannerAction} placeName="As suas viagens" image={image} hasUpload={hasUpload} removeHint="Sem capa própria, a página usa uma foto de viagem predefinida." />
  </FormShell>;
}
