import type { Coordinates } from "@/features/media/geocode";

// Static route map with no dependency: OpenStreetMap tiles (darkened with a CSS filter to
// match the theme) rendered in an SVG, plus numbered pins and a dashed route line. Two layouts are drawn so
// pins stay visible on both wide banners and narrow phones.
export type MapPoint = Coordinates & { label: string; number: number };

const TILE = 256;
const project = (point: Coordinates, zoom: number) => {
  const scale = TILE * 2 ** zoom, sin = Math.sin((point.lat * Math.PI) / 180);
  return { x: ((point.lon + 180) / 360) * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
};

type Layout = { width: number; height: number; area: { x0: number; x1: number; y0: number; y1: number } };
const desktop: Layout = { width: 1600, height: 560, area: { x0: 0.46, x1: 0.94, y0: 0.16, y1: 0.66 } };
const mobile: Layout = { width: 760, height: 760, area: { x0: 0.14, x1: 0.86, y0: 0.16, y1: 0.52 } };

function MapLayer({ points, layout, className }: { points: MapPoint[]; layout: Layout; className: string }) {
  const { width, height, area } = layout;
  const boxW = (area.x1 - area.x0) * width, boxH = (area.y1 - area.y0) * height;
  let zoom = 3;
  for (let z = 11; z >= 2; z -= 1) {
    const projected = points.map((point) => project(point, z));
    const spanX = Math.max(...projected.map((p) => p.x)) - Math.min(...projected.map((p) => p.x));
    const spanY = Math.max(...projected.map((p) => p.y)) - Math.min(...projected.map((p) => p.y));
    // Tightest zoom that fits the whole route (owner asked for a closer view); a single city stays at street-area level.
    if (spanX <= boxW && spanY <= boxH) { zoom = points.length === 1 ? Math.min(z, 9) : z; break; }
  }
  const projected = points.map((point) => project(point, zoom));
  const minX = Math.min(...projected.map((p) => p.x)), maxX = Math.max(...projected.map((p) => p.x));
  const minY = Math.min(...projected.map((p) => p.y)), maxY = Math.max(...projected.map((p) => p.y));
  // World pixel at the top-left corner of the viewBox, so the points' centre lands in the target area.
  const originX = (minX + maxX) / 2 - ((area.x0 + area.x1) / 2) * width;
  const originY = (minY + maxY) / 2 - ((area.y0 + area.y1) / 2) * height;
  const tiles: { x: number; y: number; href: string }[] = [];
  const count = 2 ** zoom;
  for (let tx = Math.floor(originX / TILE); tx <= Math.floor((originX + width) / TILE); tx += 1) {
    for (let ty = Math.floor(originY / TILE); ty <= Math.floor((originY + height) / TILE); ty += 1) {
      if (ty < 0 || ty >= count) continue;
      const wrapped = ((tx % count) + count) % count;
      tiles.push({ x: tx * TILE - originX, y: ty * TILE - originY, href: `https://tile.openstreetmap.org/${zoom}/${wrapped}/${ty}.png` });
    }
  }
  const pins = projected.map((p) => ({ x: p.x - originX, y: p.y - originY }));
  const scale = width / 800;
  return <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className={className}>
    <rect width={width} height={height} fill="#0f1215" />
    <g style={{ filter: "invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9) saturate(0.6)" }}>{tiles.map((tile) => <image key={`${tile.x}-${tile.y}`} href={tile.href} x={tile.x} y={tile.y} width={TILE} height={TILE} />)}</g>
    {pins.length > 1 ? <polyline points={pins.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--chart-1)" strokeWidth={1.3 * scale} strokeDasharray={`${2.5 * scale} ${3.5 * scale}`} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" /> : null}
    {pins.map((pin, index) => <g key={index} transform={`translate(${pin.x} ${pin.y}) scale(${scale * 0.55})`}>
      <ellipse cy={1} rx={7} ry={2.5} fill="#000" opacity="0.35" />
      <path d="M0 0C-2-7-14-13-14-25a14 14 0 1 1 28 0C14-13 2-7 0 0z" fill="var(--chart-1)" stroke="#0a0b0b" strokeWidth={2.5} />
      <circle cy={-25} r={5.5} fill="#0a0b0b" />
      <text x={19} y={-25} dominantBaseline="central" fontSize={13} fontWeight="600" fill="#f2f4f3" stroke="#0a0b0b" strokeWidth={3.5} paintOrder="stroke">{points[index].label}</text>
    </g>)}
  </svg>;
}

export function RouteMap({ points }: { points: MapPoint[] }) {
  return <div role="img" aria-label={`Mapa da rota, por ordem: ${points.map((point) => point.label).join(" → ")}`} className="absolute inset-0">
    <MapLayer points={points} layout={desktop} className="absolute inset-0 hidden size-full sm:block" />
    <MapLayer points={points} layout={mobile} className="absolute inset-0 size-full sm:hidden" />
    <p className="absolute bottom-2 right-3 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">contribuidores do OpenStreetMap</a></p>
  </div>;
}
