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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Metric */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Mail className="h-3.5 w-3.5 text-brand" />
            <span>Sobres de Seguridad Oficiales</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cada acta tiene un destino legal inviolable.
          </p>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-mono border-border bg-muted/30 px-2 py-1 flex items-center gap-1"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span>
            {sealedCount}/{totalCount} lacrados
          </span>
        </Badge>
      </div>

      {/* Envelopes List */}
      <div className="space-y-3">
        {SECURITY_ENVELOPES.map((env) => {
          const isSealed = !!sealedEnvelopes[env.color];

          return (
            <div
              key={env.color}
              className={`rounded-2xl border p-3.5 space-y-3 transition-all shadow-sm ${
                isSealed
                  ? "bg-success/5 border-success/30"
                  : "bg-card border-border/80"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${env.badgeColorClass}`}
                    >
                      {env.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {env.priority}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-foreground">
                    {env.recipient}
                  </h4>
                </div>

                <Button
                  size="sm"
                  variant={isSealed ? "default" : "outline"}
                  onClick={() =>
                    toggleEnvelopeSealed(env.color as EnvelopeColor)
                  }
                  className={`h-7 px-2.5 text-[11px] rounded-lg font-semibold flex items-center gap-1 ${
                    isSealed
                      ? "bg-success text-white hover:bg-success/90"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {isSealed ? (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Sellado</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3 text-muted-foreground" />
                      <span>Marcar Sellado</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Document List */}
              <div className="space-y-1 bg-muted/20 p-2.5 rounded-xl border border-border/40">
                <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider block">
                  Documentos obligatorios adentro:
                </span>
                <ul className="space-y-1">
                  {env.contents.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-1.5 text-[11px] text-foreground/90"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning note */}
              <div className="p-2 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-1.5 text-[10.5px] text-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{env.warning}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
