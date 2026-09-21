"use client";

import { useCopilotoStore } from "../_lib/store";
import { SECURITY_ENVELOPES } from "../_lib/constants";
import { EnvelopeColor } from "../_lib/types";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TabSobres() {
  const sealedEnvelopes = useCopilotoStore((s) => s.sealedEnvelopes);
  const toggleEnvelopeSealed = useCopilotoStore((s) => s.toggleEnvelopeSealed);

  const sealedCount = Object.values(sealedEnvelopes).filter(Boolean).length;
  const totalCount = SECURITY_ENVELOPES.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Summary Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Los 5 Sobres Plásticos de Seguridad
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Cada ejemplar del acta electoral tiene un destino legal
            institucional independiente. No mezcles los sobres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-[10px] uppercase font-mono text-zinc-400">
                Sobres Lacrados
              </div>
              <div className="text-sm font-bold font-mono text-zinc-100">
                {sealedCount} de {totalCount} listos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Envelope Cards Grid */}
      <div className="space-y-4">
        {SECURITY_ENVELOPES.map((env) => {
          const isSealed = !!sealedEnvelopes[env.color];

          return (
            <div
              key={env.color}
              className={`rounded-2xl border transition-all p-5 sm:p-6 ${
                isSealed
                  ? "bg-zinc-950/80 border-emerald-800/60 shadow-md"
                  : `bg-zinc-900/90 border-zinc-800 hover:border-zinc-700`
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left: Envelope Identity */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono shadow-sm ${env.badgeColorClass}`}
                    >
                      {env.name}
                    </span>

                    <Badge
                      variant="outline"
                      className="border-zinc-700 bg-zinc-800/70 text-zinc-300 text-[11px]"
                    >
                      {env.priority}
                    </Badge>

                    {isSealed && (
                      <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-500/40 text-[11px] font-mono">
                        <Lock className="h-3 w-3 mr-1" />
                        Verificado y Lacrado
                      </Badge>
                    )}
                  </div>

                  <div className="pt-1">
                    <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
                      Destino Oficial:
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {env.recipient}
                    </h3>
                  </div>

                  {/* Required Documents Inside */}
                  <div className="pt-2 space-y-1.5">
                    <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
                      Contenido Exclusivo Obligatorio:
                    </span>
                    <ul className="space-y-1.5">
                      {env.contents.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start gap-2 text-xs sm:text-sm text-zinc-200"
                        >
                          <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Critical Packaging Warning */}
                  <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{env.warning}</span>
                  </div>
                </div>

                {/* Right: Seal / Toggle Action */}
                <div className="self-end sm:self-center">
                  <Button
                    onClick={() =>
                      toggleEnvelopeSealed(env.color as EnvelopeColor)
                    }
                    variant={isSealed ? "default" : "outline"}
                    className={`font-semibold flex items-center gap-2 ${
                      isSealed
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    {isSealed ? (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Sobre Sellado</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 text-zinc-400" />
                        <span>Marcar como Sellado</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
