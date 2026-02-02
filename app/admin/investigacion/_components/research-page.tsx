"use client";

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
    <div className="w-full h-full overflow-y-auto px-4">
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
          <ProgressStream
            logs={logs}
            draftData={draftData}
            progreso={progresoScraping}
            isStreaming={isStreaming}
            onStop={detenerInvestigacion}
          />
        )}

        {/* 3. Resultados Finales */}
        {resultadoFinal && (
          <ResultadoTablas resultado={resultadoFinal} onReset={resetEstado} />
        )}
      </div>
    </div>
  );
}
