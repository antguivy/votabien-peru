"use client";

import { useState } from "react";
import { VOTE_SCENARIOS } from "../_lib/constants";
import { VoteScenario } from "../_lib/types";
import { CheckCircle2, XCircle, Shield, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      <div className="relative w-20 h-20 border-2 border-border/80 bg-background rounded-xl flex items-center justify-center p-1 shadow-inner shrink-0 select-none">
        <div className="w-12 h-12 border border-dashed border-border/60 rounded-lg flex items-center justify-center relative">
          {type === "cruz_perfecta" && (
            <svg
              className="w-9 h-9 text-brand stroke-[3.5]"
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
              className="w-14 h-14 text-brand stroke-[3.5] absolute -top-1 -left-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <circle cx="12" cy="12" r="2.5" className="fill-success" />
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
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Authority Banner */}
      <div className="rounded-2xl border border-brand/20 bg-brand/10 p-3.5 flex items-start gap-2.5">
        <div className="p-2 rounded-xl bg-brand text-brand-foreground shrink-0 shadow-sm">
          <Shield className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-xs font-black text-foreground">
            La Mesa es la Máxima Autoridad
          </h3>
          <p className="text-[11.5px] text-muted-foreground leading-snug">
            La calificación de un voto se decide por{" "}
            <strong>mayoría de los 3 miembros (2 a 1)</strong>. Los personeros
            no votan ni pueden ordenar calificar.
          </p>
        </div>
      </div>

      {/* Segmented Filter Control & Search */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-xl border border-border/60">
          <button
            onClick={() => setFilter("all")}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({VOTE_SCENARIOS.length})
          </button>
          <button
            onClick={() => setFilter("valid")}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
              filter === "valid"
                ? "bg-success text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Válidos
          </button>
          <button
            onClick={() => setFilter("null")}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
              filter === "null"
                ? "bg-destructive text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <XCircle className="h-3 w-3" />
            Nulos
          </button>
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar criterio (check, cruz, rotura...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9 bg-card border-border rounded-xl"
          />
        </div>
      </div>

      {/* Scenarios Cards List */}
      <div className="space-y-3">
        {filteredScenarios.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-3.5 space-y-2 shadow-sm ${
              item.ruling === "valid"
                ? "bg-card border-border/80"
                : "bg-card border-border/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <Badge
                  className={`text-[9.5px] uppercase font-bold tracking-wider ${
                    item.ruling === "valid"
                      ? "bg-success/15 text-success border border-success/30"
                      : "bg-destructive/15 text-destructive border border-destructive/30"
                  }`}
                >
                  {item.ruling === "valid" ? "✓ Válido" : "✗ Nulo"}
                </Badge>

                <h4 className="text-xs font-bold text-foreground leading-snug">
                  {item.title}
                </h4>

                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  {item.rule}
                </p>
              </div>

              {/* Graphical representation */}
              {renderVisualBallotBox(item.visualType)}
            </div>

            {/* Practical Recommendation Box */}
            <div
              className={`p-2.5 rounded-xl text-[11px] leading-snug font-medium ${
                item.ruling === "valid"
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-muted/40 text-muted-foreground border border-border/50"
              }`}
            >
              <strong className="block mb-0.5 text-foreground">
                Criterio aplicable:
              </strong>
              {item.recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
