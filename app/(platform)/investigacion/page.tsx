"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, TerminalSquare } from "lucide-react";
import { InvestigacionForm } from "./_components/research-form";
import { ProgressStream } from "./_components/progress-stream";
import { ResultadoTablas } from "./_components/result-table";
import { useInvestigacionStream } from "@/hooks/use-research-stream";

export default function ResearchPage() {
  const {
    isStreaming,
    logs,
    draftData,
    resultadoFinal,
    progresoScraping,
    iniciarInvestigacion,
    detenerInvestigacion, // Importamos la función de stop
    resetEstado, // Importamos el reset
  } = useInvestigacionStream();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 pb-20">
      {/* Navbar Minimalista */}
      <header className="border-b border-border bg-background/95 backdrop-brightness-0 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 select-none">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <TerminalSquare className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              VotaBien{" "}
              <span className="text-muted-foreground font-normal">
                / Research Agent
              </span>
            </span>
          </div>

          {/* Botón de "Volver" o "Nueva Búsqueda" en el header */}
          {(resultadoFinal || logs.length > 0) && (
            <Button
              onClick={resetEstado} // Usamos resetEstado en vez de reload
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-primary"
              disabled={isStreaming} // Deshabilitado mientras procesa (el stop está abajo)
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Nueva Investigación
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto max-w-7xl py-8 px-4">
        {/* 1. Formulario (Solo visible si no hay actividad) */}
        {!isStreaming && logs.length === 0 && !resultadoFinal && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-10">
            <div className="mb-8 text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Investigación Política IA
              </h1>
              <p className="text-muted-foreground">
                Sube el contexto, selecciona el modelo y deja que el agente
                realice el Fact-Checking.
              </p>
            </div>
            <InvestigacionForm
              onSubmit={iniciarInvestigacion}
              disabled={isStreaming}
            />
          </div>
        )}

        {/* 2. Vista de Ejecución (Streaming) */}
        {(isStreaming || (logs.length > 0 && !resultadoFinal)) && (
          <div className="animate-in fade-in duration-500">
            <ProgressStream
              logs={logs}
              draftData={draftData}
              progreso={progresoScraping}
              isStreaming={isStreaming} // Pasamos estado
              onStop={detenerInvestigacion} // Pasamos función stop
            />
          </div>
        )}

        {/* 3. Resultados Finales */}
        {resultadoFinal && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ResultadoTablas resultado={resultadoFinal} />

            <div className="mt-8 flex justify-center">
              <Button onClick={resetEstado} variant="outline" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" /> Realizar otra búsqueda
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
