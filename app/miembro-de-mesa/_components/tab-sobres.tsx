"use client";

import { useCopilotoStore } from "../_lib/store";
import { SECURITY_ENVELOPES } from "../_lib/constants";
import { EnvelopeColor } from "../_lib/types";
import { Mail, CheckCircle2, AlertTriangle, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TabSobres() {
  const sealedEnvelopes = useCopilotoStore((s) => s.sealedEnvelopes);
  const toggleEnvelopeSealed = useCopilotoStore((s) => s.toggleEnvelopeSealed);

  const sealedCount = Object.values(sealedEnvelopes).filter(Boolean).length;
  const totalCount = SECURITY_ENVELOPES.length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── Encabezado Editorial de Sobres ── */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
            <Mail className="h-3.5 w-3.5 text-brand" />
            <span>Sobres Plásticos de Seguridad Inviolables</span>
          </div>

          <span
            className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded border -rotate-1 shadow-2xs ${
              sealedCount === totalCount
                ? "text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400"
                : "text-muted-foreground bg-muted/40 border-border"
            }`}
          >
            {sealedCount}/{totalCount} lacrados
          </span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
            Los 5 Sobres Oficiales de la ONPE
          </h2>
          <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
            Cada ejemplar del acta electoral tiene un destino constitucional
            independiente. Los sobres plásticos tienen cinta de seguridad
            inviolable: revisá el contenido antes de sellar.
          </p>
        </div>
      </section>

      {/* ── Lista de Sobres con Estilo VotaBien ── */}
      <div className="space-y-3">
        {SECURITY_ENVELOPES.map((env) => {
          const isSealed = !!sealedEnvelopes[env.color];

          return (
            <section
              key={env.color}
              className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs space-y-3 ${
                isSealed
                  ? "bg-card border-emerald-600/40"
                  : "bg-card border-border/80"
              }`}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border -rotate-1 shadow-2xs ${
                        isSealed
                          ? "text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400"
                          : "text-foreground bg-muted/50 border-border/80"
                      }`}
                    >
                      {env.name}
                    </span>
                    <span className="text-[10.5px] font-mono text-muted-foreground">
                      {env.priority}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground">
                    {env.recipient}
                  </h4>
                </div>

                <Button
                  size="sm"
                  variant={isSealed ? "default" : "outline"}
                  onClick={() =>
                    toggleEnvelopeSealed(env.color as EnvelopeColor)
                  }
                  className={`h-8 px-3 text-xs font-mono font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    isSealed
                      ? "bg-foreground text-background border-foreground hover:bg-foreground/90 shadow-xs"
                      : "border-border text-foreground hover:bg-muted/40"
                  }`}
                >
                  {isSealed ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Sellado</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Marcar Sellado</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Document List */}
              <div className="space-y-1.5 bg-muted/20 p-3 rounded-xl border border-border/60">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold block mb-1">
                  Documentos obligatorios adentro:
                </span>
                <ul className="space-y-1">
                  {env.contents.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-2 text-xs text-foreground/90 font-medium leading-snug"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning note */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-600/30 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>{env.warning}</span>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
