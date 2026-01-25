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
    detenerInvestigacion,
    resetEstado,
  } = useInvestigacionStream();

  const showForm = !isStreaming && logs.length === 0 && !resultadoFinal;

  return (
    <div className="flex flex-col w-full h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">
      <div className="flex max-w-5xl w-full mx-auto py-4 items-center z-10">
        <div className="flex px-4 items-center gap-2 select-none opacity-80">
          <div className="bg-primary/10 text-primary rounded-md">
            <TerminalSquare className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-muted-foreground/80">
            AI Research
          </span>
        </div>

        {(resultadoFinal || logs.length > 0) && (
          <Button
            onClick={resetEstado}
            variant="ghost"
            size="sm"
            disabled={isStreaming}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Nueva Búsqueda
          </Button>
        )}
      </div>

      <main className="flex-1 w-full relative flex flex-col overflow-hidden">
        <div className="w-full h-full overflow-y-auto px-4">
          <div
            className={`
            w-full min-h-full flex flex-col
            ${showForm ? "items-center justify-center pb-20" : "justify-start pt-4 pb-20"}
          `}
          >
            <div className="w-full max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
              {/* 1. Formulario */}
              {showForm && (
                <InvestigacionForm
                  onSubmit={iniciarInvestigacion}
                  disabled={isStreaming}
                />
              )}

              {/* 2. Logs (Streaming) */}
              {(isStreaming || (logs.length > 0 && !resultadoFinal)) && (
                <div className="pb-10">
                  <ProgressStream
                    logs={logs}
                    draftData={draftData}
                    progreso={progresoScraping}
                    isStreaming={isStreaming}
                    onStop={detenerInvestigacion}
                  />
                </div>
              )}

              {/* 3. Resultados Finales */}
              {resultadoFinal && (
                <div className="pb-10">
                  <ResultadoTablas resultado={resultadoFinal} />

                  <div className="mt-12 flex justify-center border-t border-border/20 pt-8">
                    <Button onClick={resetEstado} variant="outline" size="lg">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Realizar otra
                      búsqueda
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
