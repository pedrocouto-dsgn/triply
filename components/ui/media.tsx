/* eslint-disable @next/next/no-img-element -- remote photos and signed URLs are shown as-is, without the image optimizer. */
import type { ReactNode } from "react";
import type { PlaceImage } from "@/features/media/types";
import { cn } from "@/lib/utils";

// Illustrated image placeholders. Each destination name maps to a stable scene so the
// same city always gets the same artwork until real photos are supported.
type Scene = { sky: [string, string]; sun: string; far: string; near: string; kind: "mountains" | "sea" | "dunes" | "city" | "hills" };

const scenes: Scene[] = [
  { sky: ["#ff9a5a", "#7a2e5f"], sun: "#ffd29a", far: "#5a2346", near: "#2a1024", kind: "mountains" },
  { sky: ["#4cc3d9", "#0d3b63"], sun: "#e9fbff", far: "#1d6f95", near: "#0a2a47", kind: "sea" },
  { sky: ["#f7c27b", "#c0603a"], sun: "#fff1cf", far: "#d4834a", near: "#8e3f22", kind: "dunes" },
  { sky: ["#8a9bff", "#1c2050"], sun: "#ffe7b8", far: "#3a3f86", near: "#15183a", kind: "city" },
  { sky: ["#7fd6a3", "#145541"], sun: "#f4ffe0", far: "#2f8a64", near: "#0e3b2d", kind: "hills" },
  { sky: ["#ff8fab", "#43206e"], sun: "#ffe3ec", far: "#7b3a8c", near: "#2c1446", kind: "mountains" },
  { sky: ["#ffb36b", "#1f3b6e"], sun: "#fff4d6", far: "#2f5a8f", near: "#14284b", kind: "sea" },
  { sky: ["#c4b5fd", "#3b2a6b"], sun: "#fdf4ff", far: "#5b4794", near: "#22174a", kind: "city" },
];

function hash(value: string): number {
  let result = 2166136261;
  for (const char of value.toLocaleLowerCase("pt-PT")) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  // Final avalanche so similar names still land on different scenes.
  result ^= result >>> 16; result = Math.imul(result, 0x85ebca6b); result ^= result >>> 13; result = Math.imul(result, 0xc2b2ae35); result ^= result >>> 16;
  return result >>> 0;
}

function Silhouette({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case "sea":
      return <><path d="M0 150 Q100 135 200 150 T400 150 V240 H0z" fill={scene.far} /><path d="M0 180 Q100 165 200 180 T400 180 V240 H0z" fill={scene.near} /><path d="M0 205 Q100 195 200 205 T400 205" stroke={scene.sun} strokeOpacity=".25" strokeWidth="2" fill="none" /></>;
    case "dunes":
      return <><path d="M0 160 Q90 120 180 155 T400 140 V240 H0z" fill={scene.far} /><path d="M0 200 Q120 150 240 190 T400 180 V240 H0z" fill={scene.near} /></>;
    case "city":
      return <><path d="M0 170h30v-40h24v25h20v-60h28v75h18v-35h26v45h22v-70h30v70h20v-30h24v40h26v-55h28v55h20v-25h24v35h40v70H0z" fill={scene.far} /><path d="M0 200h40v-25h30v15h36v-30h30v40h44v-20h34v30h40v-35h36v35h40v-15h50v65H0z" fill={scene.near} /></>;
    case "hills":
      return <><path d="M0 165 Q70 120 150 150 T300 135 T400 150 V240 H0z" fill={scene.far} /><path d="M0 200 Q100 160 210 190 T400 185 V240 H0z" fill={scene.near} /></>;
    default:
      return <><path d="M0 170 L70 105 L120 145 L190 80 L260 150 L320 110 L400 165 V240 H0z" fill={scene.far} /><path d="M190 80 L172 97 L190 92 L205 100z" fill={scene.sun} fillOpacity=".55" /><path d="M0 205 L90 160 L160 195 L240 150 L320 195 L400 170 V240 H0z" fill={scene.near} /></>;
  }
}

export function SceneArt({ seed, className, variant }: { seed: string; className?: string; variant?: number }) {
  const value = hash(seed || "triply");
  const scene = scenes[(variant ?? value) % scenes.length];
  const id = `scene-${value.toString(36)}`;
  const sunX = 80 + ((value >>> 4) % 240), sunY = 55 + ((value >>> 12) % 45);
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={cn("absolute inset-0 size-full", className)}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={scene.sky[0]} /><stop offset="1" stopColor={scene.sky[1]} /></linearGradient></defs>
    <rect width="400" height="240" fill={`url(#${id})`} />
    <circle cx={sunX} cy={sunY} r="26" fill={scene.sun} fillOpacity=".85" />
    <circle cx={sunX} cy={sunY} r="44" fill={scene.sun} fillOpacity=".12" />
    <Silhouette scene={scene} />
  </svg>;
}

/** Image slot: a real photo when available, otherwise an illustrated placeholder. Overlay children sit above a readability gradient. */
export function DestinationImage({ seed, image, className, children, overlay = true, label, variant, showCredit = false }: { seed: string; image?: PlaceImage | null; className?: string; children?: ReactNode; overlay?: boolean | "bottom"; label?: string; variant?: number; showCredit?: boolean }) {
  return <div role={label ? "img" : undefined} aria-label={label} className={cn("relative isolate overflow-hidden bg-muted", className)}>
    {image ? <img src={image.src} alt={label ? "" : image.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" /> : <SceneArt seed={seed} variant={variant} />}
    {overlay === "bottom" ? <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" /> : overlay ? <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" /> : null}
    {children ? <div className="relative h-full">{children}</div> : null}
    {showCredit && image?.credit ? <ImageCredit image={image} /> : null}
  </div>;
}

export function ImageCredit({ image, className }: { image: PlaceImage; className?: string }) {
  if (!image.credit) return null;
  return <p className={cn("absolute bottom-2 right-3 z-10 text-[10px] text-white/70", className)}>Foto: <a href={image.credit.profileUrl} target="_blank" rel="noreferrer" className="underline hover:text-white">{image.credit.name}</a> / <a href={image.credit.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-white">{image.credit.source}</a></p>;
}
