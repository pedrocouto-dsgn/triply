import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Dependency-free SVG charts. Every chart is paired with visible text values, so colour
// is never the only carrier of information.
export const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--chart-7)"] as const;
export const chartColor = (index: number) => chartColors[index % chartColors.length];

export type ChartSegment = { label: string; value: number; display?: string; color?: string };

const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

export function DonutChart({ segments, size = 168, thickness = 18, label, center, className }: { segments: ChartSegment[]; size?: number; thickness?: number; label: string; center?: ReactNode; className?: string }) {
  const radius = (size - thickness) / 2, circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + positive(segment.value), 0);
  const gap = segments.filter((segment) => positive(segment.value) > 0).length > 1 ? 3 : 0;
  let offset = 0;
  return <div role="img" aria-label={label} className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
    <svg aria-hidden="true" width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--chart-track)" strokeWidth={thickness} />
      {total > 0 ? segments.map((segment, index) => {
        const length = (positive(segment.value) / total) * circumference;
        const dash = Math.max(length - gap, 0);
        const circle = <circle key={segment.label} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={segment.color ?? chartColor(index)} strokeWidth={thickness} strokeLinecap={dash > thickness ? "round" : "butt"} strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} />;
        offset += length;
        return length > 0 ? circle : null;
      }) : null}
    </svg>
    {center ? <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">{center}</div> : null}
  </div>;
}

export function ChartLegend({ segments, className }: { segments: ChartSegment[]; className?: string }) {
  return <ul className={cn("space-y-2.5 text-sm", className)}>{segments.map((segment, index) => <li key={segment.label} className="flex min-w-0 items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2.5"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: segment.color ?? chartColor(index) }} /><span className="truncate text-muted-foreground">{segment.label}</span></span><span className="shrink-0 font-medium tabular-nums">{segment.display ?? segment.value}</span></li>)}</ul>;
}

export function RingProgress({ percent, size = 132, thickness = 12, label, children, color = "var(--chart-1)" }: { percent: number; size?: number; thickness?: number; label: string; children?: ReactNode; color?: string }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const radius = (size - thickness) / 2, circumference = 2 * Math.PI * radius, dash = (clamped / 100) * circumference;
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped)} className="relative shrink-0" style={{ width: size, height: size }}>
    <svg aria-hidden="true" width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--chart-track)" strokeWidth={thickness} />
      {clamped > 0 ? <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} /> : null}
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children ?? <span className="text-2xl font-semibold tabular-nums">{Math.round(clamped)}%</span>}</div>
  </div>;
}

/** Horizontal bars, each with its own label and formatted value. */
export function BarList({ items, max, className }: { items: ChartSegment[]; max?: number; className?: string }) {
  const top = max ?? Math.max(...items.map((item) => positive(item.value)), 0);
  return <ul className={cn("space-y-4", className)}>{items.map((item, index) => {
    const width = top > 0 ? Math.max((positive(item.value) / top) * 100, positive(item.value) > 0 ? 2 : 0) : 0;
    return <li key={item.label}><div className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate text-muted-foreground">{item.label}</span><span className="shrink-0 font-medium tabular-nums">{item.display ?? item.value}</span></div><div aria-hidden="true" className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${width}%`, background: item.color ?? chartColor(index) }} /></div></li>;
  })}</ul>;
}

/** One bar split into proportional segments (e.g. paid vs committed vs remaining). */
export function StackedBar({ segments, label, total }: { segments: ChartSegment[]; label: string; total?: number }) {
  const sum = total ?? segments.reduce((value, segment) => value + positive(segment.value), 0);
  return <div role="img" aria-label={label} className="flex h-3 w-full overflow-hidden rounded-full bg-muted">{sum > 0 ? segments.map((segment, index) => <div key={segment.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${Math.min((positive(segment.value) / sum) * 100, 100)}%`, background: segment.color ?? chartColor(index) }} />) : null}</div>;
}

/** Small vertical column chart, e.g. activities per day. */
export function ColumnChart({ items, label, height = 96 }: { items: ChartSegment[]; label: string; height?: number }) {
  const top = Math.max(...items.map((item) => positive(item.value)), 1);
  return <div role="img" aria-label={label} className="flex items-end gap-1.5" style={{ height }}>{items.map((item, index) => <div key={`${item.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5 h-full"><div className="w-full max-w-7 rounded-t-md rounded-b-sm" style={{ height: `${Math.max((positive(item.value) / top) * 100, 4)}%`, background: positive(item.value) > 0 ? item.color ?? "var(--chart-1)" : "var(--chart-track)" }} /></div>)}</div>;
}
