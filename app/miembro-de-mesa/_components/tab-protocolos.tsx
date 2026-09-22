"use client";

import { PROTOCOLS_LIST } from "../_lib/constants";
import { BookOpen, HelpCircle, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TabProtocolos() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Protocolos de Emergencia & Marco Legal
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Respuestas rápidas y fundamentadas para situaciones imprevistas
              durante la jornada electoral 2026.
            </p>
          </div>
        </div>
      </div>

      {/* Protocols List */}
      <div className="space-y-4">
        {PROTOCOLS_LIST.map((protocol) => (
          <div
            key={protocol.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6 space-y-4 hover:border-zinc-750 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-400 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {protocol.title}
                </h3>
              </div>
              <Badge
                variant="outline"
                className="border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-mono self-start sm:self-auto"
              >
                {protocol.legalReference}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium">
              {protocol.summary}
            </p>

            {/* Step-by-step guidance */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Paso a paso oficial:
              </span>
              <div className="space-y-2">
                {protocol.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-xs sm:text-sm text-zinc-200 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Official Ley 32231 Callout */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-900 p-5 sm:p-6 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
          <Award className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-amber-200">
            Derecho Laboral por Cumplimiento: Ley Nº 32231
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Todos los ciudadanos que cumplan la función de miembro de mesa en
            las Elecciones 2026 gozan de un{" "}
            <strong>día de descanso remunerado no compensable</strong> el día
            lunes inmediato posterior a la votación. Solicita tu Certificado de
            Participación a la ONPE antes de retirarte del aula.
          </p>
        </div>
      </div>
    </div>
  );
}
