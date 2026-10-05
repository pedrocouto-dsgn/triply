import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "../../components/shared/app-shell";

const location = vi.hoisted(() => ({ pathname: "/trips/new" }));
vi.mock("next/navigation", () => ({ usePathname: () => location.pathname }));

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
function color(name: string): string {
  const value = css.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))?.[1];
  if (!value) throw new Error(`Missing color token: ${name}`);
  return value;
}
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(first: string, second: string): number {
  const a = luminance(color(first)), b = luminance(color(second));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("Triply dark theme contrast", () => {
  it.each([
    ["foreground", "background"], ["foreground", "card"],
    ["muted-foreground", "card"], ["muted-foreground", "muted"], ["muted-foreground", "elevated"],
    ["primary-foreground", "primary"], ["primary-foreground", "primary-hover"],
    ["danger-foreground", "danger"], ["danger-foreground", "danger-hover"], ["link", "card"], ["link", "background"],
    ["success", "success-muted"], ["warning", "warning-muted"],
    ["destructive", "destructive-muted"],
  ])("%s text on %s meets AA for normal text", (text, background) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
  });
  it("input boundaries and keyboard focus remain discernible", () => {
    expect(contrast("input", "card")).toBeGreaterThanOrEqual(3);
    expect(contrast("ring", "background")).toBeGreaterThanOrEqual(3);
  });
});

describe("workspace navigation", () => {
  it("does not interpret the new-trip form as a trip", () => {
    location.pathname = "/trips/new";
    const html = renderToStaticMarkup(createElement(AppShell, null, "Formulário"));
    expect(html).not.toContain("/trips/new/finance");
    expect(html).not.toContain("Definições da viagem");
  });
  it("keeps finance active while editing costs without activating overview", () => {
    location.pathname = "/trips/example/finance/costs/new";
    const html = renderToStaticMarkup(createElement(AppShell, null, "Custo"));
    const links = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? [];
    const activeLinks = links.filter((link) => link.includes('aria-current="page"'));
    expect(activeLinks.length).toBe(2); // Desktop and mobile navigation.
    expect(activeLinks.every((link) => link.includes("Orçamento"))).toBe(true);
    expect(html).toContain('href="/trips/example#route"');
  });
});
