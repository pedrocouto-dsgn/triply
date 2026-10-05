import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Triply",
  description: "Planeie viagens com vários destinos, orçamento, poupança e itinerário num só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      {/* Browser extensions add attributes to <body>; that mismatch is not an app bug. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
