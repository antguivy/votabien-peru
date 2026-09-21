import type { Metadata, Viewport } from "next";
import { CopilotoHeader } from "./_components/copiloto-header";
import { CopilotoNav } from "./_components/copiloto-nav";

export const metadata: Metadata = {
  title: "Copiloto de Mesa Electoral — ONPE 2026 | VotaBien",
  description:
    "Asistente operativo offline mobile-first para miembros de mesa: checklist de fases, calculadora de cuadre de actas, árbitro visual de votos y guía de sobres.",
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
    <div className="min-h-screen bg-muted/30 dark:bg-black/60 flex justify-center selection:bg-brand selection:text-white">
      {/* Mobile-First Centered App Shell */}
      <div className="w-full max-w-md min-h-screen bg-background border-x border-border/40 shadow-xl flex flex-col relative">
        {/* Top Header */}
        <CopilotoHeader />

        {/* Scrollable Main Content */}
        <main className="flex-1 w-full px-3.5 py-4 pb-24 overflow-x-hidden">
          {children}
        </main>

        {/* Bottom Thumb Navigation */}
        <CopilotoNav />
      </div>
    </div>
  );
}
