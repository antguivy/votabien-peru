import type { Metadata, Viewport } from "next";
import { CopilotoHeader } from "./_components/copiloto-header";
import { CopilotoNav } from "./_components/copiloto-nav";

export const metadata: Metadata = {
  title: "Copiloto Electoral — Miembros de Mesa ONPE 2026 | VotaBien",
  description:
    "Asistente operativo offline para miembros de mesa: checklist de fases, calculadora de cuadre de actas, árbitro visual de votos y guía de sobres de seguridad.",
  keywords: [
    "ONPE",
    "miembros de mesa",
    "elecciones 2026",
    "escrutinio",
    "cuadre de actas",
    "sobre plomo",
    "sobre rojo",
    "ley 32231",
  ],
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Immersive Top Bar */}
      <CopilotoHeader />

      {/* Persistent Module Tabs */}
      <CopilotoNav />

      {/* Main Operational Canvas */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {children}
      </main>

      {/* Discreet Footer with Legal Reminder */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-3 px-4 text-center text-xs text-zinc-300">
        <p>
          Herramienta de asistencia ciudadana para miembros de mesa según Ley Nº
          26859, Ley Nº 32231 y Directivas Oficiales ONPE 2026.
        </p>
      </footer>
    </div>
  );
}
