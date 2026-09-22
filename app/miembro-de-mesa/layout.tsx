import type { Metadata, Viewport } from "next";
import { CopilotoHeader } from "./_components/copiloto-header";
import { CopilotoNav } from "./_components/copiloto-nav";

export const metadata: Metadata = {
  title: "Copiloto de Mesa Electoral — ONPE 2026 | VotaBien",
  description:
    "Asistente operativo offline para miembros de mesa: checklist de fases, calculadora de cuadre de actas, árbitro visual de votos y guía de sobres.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function MiembroDeMesaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      {/* Top Header */}
      <CopilotoHeader />

      {/* Main Content Area (Fluid full-width on mobile, max-w-4xl on desktop) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 pb-28 text-foreground">
        {children}
      </main>

      {/* New Styled Bottom Navbar */}
      <CopilotoNav />
    </div>
  );
}
