"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, TerminalSquare } from "lucide-react";
import { InvestigacionForm } from "./research-form";
import { ProgressStream } from "./progress-stream";
import { ResultadoTablas } from "./result-table";
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
    <>
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
    </>
  );
}
