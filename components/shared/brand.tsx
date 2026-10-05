import Link from "next/link";

export function Brand({ href = "/", tone = "default" }: { href?: string; tone?: "default" | "light" }) {
  return <Link href={href} className={`inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight ${tone === "light" ? "text-white" : ""}`} aria-label="Triply — início"><span aria-hidden="true" className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18c3-1 5-4 7-12M12 6c1.5 4 3.5 7 7 8M8 11h8" /></svg></span><span className="lowercase">Triply</span></Link>;
}
