"use client";

import { useState } from "react";
import { VOTE_SCENARIOS } from "../_lib/constants";
import { VoteScenario } from "../_lib/types";
import { Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TabArbitro() {
  const [filter, setFilter] = useState<"all" | "valid" | "null">("all");
  const [search, setSearch] = useState("");

  const filteredScenarios = VOTE_SCENARIOS.filter((item) => {
    if (filter !== "all" && item.ruling !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.rule.toLowerCase().includes(q) ||
        item.recommendation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const renderVisualBallotBox = (type: VoteScenario["visualType"]) => {
    return (
      <div className="p-1 rounded-2xl bg-muted/30 border border-border/60 shrink-0 shadow-2xs">
        <div className="relative w-20 h-20 border border-border/80 bg-card rounded-xl flex items-center justify-center p-1 select-none">
          <div className="w-12 h-12 border border-dashed border-border/60 rounded-lg flex items-center justify-center relative">
            {type === "cruz_perfecta" && (
              <svg
                className="w-9 h-9 text-foreground stroke-[3.5]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            )}

            {type === "cruz_desbordada" && (
              <svg
                className="w-14 h-14 text-foreground stroke-[3.5] absolute -top-1 -left-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <circle
                  cx="12"
                  cy="12"
                  r="2.5"
                  className="fill-emerald-600 dark:fill-emerald-400"
                />
              </svg>
            )}

            {type === "cruz_linea" && (
              <svg
                className="w-12 h-12 text-destructive stroke-[3.5] absolute -bottom-3 -right-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <circle cx="12" cy="12" r="2.5" className="fill-destructive" />
              </svg>
            )}

            {type === "signo_check" && (
              <svg
                className="w-9 h-9 text-destructive stroke-[3.5]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}

            {type === "carita_feliz" && (
              <span className="text-2xl text-destructive select-none">😊</span>
            )}

            {type === "texto_o_firma" && (
              <span className="text-[9px] font-serif italic text-destructive rotate-[-12deg] select-none font-bold">
                Texto
              </span>
            )}

            {type === "cedula_rota" && (
              <span className="text-[9px] font-mono text-destructive font-bold border-y border-destructive px-1">
                ROTA
              </span>
            )}

            {type === "cedula_sin_firma" && (
              <span className="text-[8px] font-mono text-destructive font-bold text-center leading-tight">
                SIN FIRMA
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── Regla de Oro (Veredicto de Autoridad de Mesa) ── */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-brand" />
            <span>Ley Orgánica de Elecciones (Art. 283)</span>
          </div>

          <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded border -rotate-1 shadow-2xs text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400">
            Mayoría 2 de 3
          </span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
            La Mesa es la Máxima Autoridad
          </h2>
          <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
            La calificación de un voto se define exclusivamente por los{" "}
            <strong>3 miembros de mesa por mayoría simple</strong>. Los
            personeros no tienen voto ni deciden. Si discrepan, su único
            mecanismo legal es formular una impugnación por escrito.
          </p>
        </div>
      </section>

      {/* ── Filtros y Buscador (CandidateNavChips style) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
              filter === "all"
                ? "bg-foreground text-background border-foreground shadow-xs"
                : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <span className="text-[10px] font-bold text-brand">01</span>
            <span>Todos</span>
            <span className="text-[10px] opacity-70">
              ({VOTE_SCENARIOS.length})
            </span>
          </button>

          <button
            onClick={() => setFilter("valid")}
            className={`shrink-0 inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
              filter === "valid"
                ? "bg-foreground text-background border-foreground shadow-xs"
                : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ✓
            </span>
            <span>Válidos</span>
          </button>

          <button
            onClick={() => setFilter("null")}
            className={`shrink-0 inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
              filter === "null"
                ? "bg-foreground text-background border-foreground shadow-xs"
                : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <span className="text-[10px] font-bold text-destructive">✗</span>
            <span>Nulos</span>
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar caso (cruz, check...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9 bg-card border-border/80 rounded-xl"
          />
        </div>
      </div>

      {/* ── Casos Visuales de Voto ── */}
      <div className="space-y-3">
        {filteredScenarios.map((item) => (
          <section
            key={item.id}
            className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border -rotate-1 shadow-2xs ${
                      item.ruling === "valid"
                        ? "text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400"
                        : "text-destructive bg-destructive/10 border-destructive/30"
                    }`}
                  >
                    {item.ruling === "valid" ? "✓ Voto Válido" : "✗ Voto Nulo"}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-foreground leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {item.rule}
                </p>
              </div>

              {/* Graphic Ballot Box */}
              {renderVisualBallotBox(item.visualType)}
            </div>

            {/* Practical Recommendation Box */}
            <div
              className={`p-3 rounded-xl text-xs font-medium leading-relaxed ${
                item.ruling === "valid"
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30"
                  : "bg-muted/30 text-muted-foreground border border-border/60"
              }`}
            >
              <strong className="block text-[10px] font-mono uppercase tracking-wider text-foreground mb-0.5">
                Criterio oficial aplicable:
              </strong>
              {item.recommendation}
            </div>

            {/* Legal footer */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10.5px] font-mono text-muted-foreground">
              <span>{item.legalArticle}</span>
              <span>ONPE 2026</span>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
