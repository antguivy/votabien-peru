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

      {/* Main Responsive Canvas (same max-w-4xl as candidatos/[candidatosId]) */}
      <article className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-24 sm:pb-16 text-foreground">
        {/* Sticky Nav Chips with Auto-Scroll (exact same pattern as CandidateNavChips) */}
        <CopilotoNav />

        {/* Content Modules */}
        <div className="pt-4">{children}</div>
      </article>
    </div>
  );
}
