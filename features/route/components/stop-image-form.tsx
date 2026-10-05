"use client";

import { useActionState, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { DestinationImage } from "@/components/ui/media";
import { button } from "@/components/ui/page";
import type { PlaceImage } from "@/features/media/types";
import { removeStopImageAction, uploadStopImageAction } from "../image-actions";
import { initialStopImageState, MAX_STOP_IMAGE_BYTES, STOP_IMAGE_HINT } from "../image-types";

export function StopImageForm({ tripId, stopId, placeName, image, hasUpload }: { tripId: string; stopId: string; placeName: string; image: PlaceImage | null; hasUpload: boolean }) {
  const [uploadState, uploadAction, uploading] = useActionState(uploadStopImageAction.bind(null, tripId, stopId), initialStopImageState);
  const [removeState, removeAction, removing] = useActionState(removeStopImageAction.bind(null, tripId, stopId), initialStopImageState);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onSelect = (file: File | undefined) => {
    setNote(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!file) { setPreview(null); return; }
    if (file.size > MAX_STOP_IMAGE_BYTES) { setPreview(null); setNote({ tone: "warn", text: "Esta imagem tem mais de 5 MB. Escolha uma versão mais leve." }); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    const probe = new window.Image();
    probe.onload = () => setNote(probe.naturalWidth < 1600 || probe.naturalHeight < 900
      ? { tone: "warn", text: `${probe.naturalWidth} × ${probe.naturalHeight} px — abaixo do recomendado; pode ficar desfocada nos banners.` }
      : { tone: "ok", text: `${probe.naturalWidth} × ${probe.naturalHeight} px — ótimo tamanho.` });
    probe.src = url;
  };

  return <div>
    <DestinationImage seed={placeName} image={preview ? { src: preview, alt: `Pré-visualização de ${placeName}` } : image} className="h-52 rounded-2xl border border-border sm:h-60">
      <div className="flex h-full items-end justify-between gap-3 p-4 text-white"><p className="text-lg font-light">{placeName}</p><span className="rounded-full bg-black/45 px-3 py-1 text-xs backdrop-blur">{preview ? "Pré-visualização" : hasUpload ? "A sua imagem" : image ? "Foto automática" : "Ilustração"}</span></div>
    </DestinationImage>
    <form action={uploadAction} className="mt-4 space-y-3">
      <label htmlFor="stop-image" className="block text-sm font-medium">{hasUpload ? "Substituir imagem" : "Carregar imagem"}</label>
      <input id="stop-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => onSelect(event.target.files?.[0])} className="block w-full text-sm" aria-describedby="stop-image-hint" />
      <p id="stop-image-hint" className="text-xs text-muted-foreground">{STOP_IMAGE_HINT}</p>
      {note ? <p className={`text-xs font-medium ${note.tone === "ok" ? "text-success" : "text-warning"}`}>{note.text}</p> : null}
      {uploadState.message ? <p role="alert" className="text-sm text-destructive">{uploadState.message}</p> : null}
      <button disabled={uploading} className={button.primary}><Icon name="image" size={16} />{uploading ? "A carregar…" : "Guardar imagem"}</button>
    </form>
    {hasUpload ? <form action={removeAction} className="mt-4 border-t border-border pt-4">
      {removeState.message ? <p role="alert" className="mb-2 text-sm text-destructive">{removeState.message}</p> : null}
      <button disabled={removing} className={button.ghost}><Icon name="trash" size={16} />{removing ? "A remover…" : "Remover a minha imagem"}</button>
      <p className="mt-1 text-xs text-muted-foreground">Sem imagem própria, o destino volta a usar uma foto automática ou ilustração.</p>
    </form> : null}
  </div>;
}
