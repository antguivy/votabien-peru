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
      <div className="relative w-28 h-28 border-2 border-zinc-600 bg-white rounded-lg flex items-center justify-center p-2 shadow-inner shrink-0 select-none">
        {/* Mock Party Symbol Box */}
        <div className="absolute top-1 left-1 text-[8px] font-mono text-zinc-400 uppercase">
          Símbolo
        </div>
        <div className="w-16 h-16 border border-dashed border-zinc-300 rounded flex items-center justify-center relative">
          {type === "cruz_perfecta" && (
            <svg
              className="w-12 h-12 text-blue-600 stroke-[3.5]"
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
              className="w-20 h-20 text-blue-600 stroke-[3.5] absolute -top-2 -left-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              {/* Intersección destacada en verde dentro del recuadro */}
              <circle cx="12" cy="12" r="2.5" fill="#16a34a" />
            </svg>
          )}

          {type === "cruz_linea" && (
            <svg
              className="w-16 h-16 text-rose-600 stroke-[3.5] absolute -bottom-5 -right-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              {/* Intersección en rojo fuera/sobre borde */}
              <circle cx="12" cy="12" r="3" fill="#dc2626" />
            </svg>
          )}

          {type === "signo_check" && (
            <svg
              className="w-12 h-12 text-rose-600 stroke-[3.5]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}

          {type === "carita_feliz" && (
            <span className="text-3xl text-rose-600 select-none">😊</span>
          )}

          {type === "texto_o_firma" && (
            <span className="text-[10px] font-serif italic text-rose-600 rotate-[-12deg] select-none font-bold">
              ¡Gana Perú!
            </span>
          )}

          {type === "cedula_rota" && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-rose-600 font-mono text-xs font-bold rotate-45 border-t-2 border-b-2 border-rose-500 w-full text-center">
                ROTURA
              </span>
            </div>
          )}

          {type === "cedula_sin_firma" && (
            <div className="text-center p-1">
              <span className="text-[8px] font-mono text-rose-700 font-bold block leading-tight">
                REVERSO
              </span>
              <span className="text-[9px] text-zinc-400 line-through">
                [Sin Firma]
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Legal Authority Golden Banner */}
      <div className="rounded-2xl border border-blue-500/40 bg-blue-950/40 p-4 sm:p-5 text-blue-100 flex items-start gap-3.5 shadow-md shadow-blue-950/50">
        <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
          <Shield className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
            Regla de Oro: La Mesa es la Máxima Autoridad
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-blue-200/90">
            La validez o nulidad de un voto la definen exclusivamente los{" "}
            <strong>3 miembros de mesa por mayoría simple (2 contra 1)</strong>.
            Los personeros tienen derecho a presenciar y observar, pero{" "}
            <strong>NO TIENEN VOTO</strong> ni pueden ordenar la calificación de
            una cédula. Si insisten, su único camino legal es la impugnación.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Todos ({VOTE_SCENARIOS.length})
          </button>
          <button
            onClick={() => setFilter("valid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              filter === "valid"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-400/80 hover:text-emerald-300"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Votos Válidos
          </button>
          <button
            onClick={() => setFilter("null")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              filter === "null"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-rose-400/80 hover:text-rose-300"
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            Votos Nulos
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            type="text"
            placeholder="Buscar caso (cruz, check, firma...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
          />
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredScenarios.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all ${
              item.ruling === "valid"
                ? "bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-700/60"
                : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
                        item.ruling === "valid"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {item.ruling === "valid"
                        ? "✓ Voto Válido"
                        : "✗ Voto Nulo"}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {item.title}
                  </h3>
                </div>

                {/* Graphic Visual Representation */}
                {renderVisualBallotBox(item.visualType)}
              </div>

              {/* Rule Description */}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {item.rule}
              </p>

              {/* Practical Guidance Box */}
              <div
                className={`p-3 rounded-xl text-xs leading-relaxed ${
                  item.ruling === "valid"
                    ? "bg-emerald-950/40 text-emerald-200 border border-emerald-800/40"
                    : "bg-zinc-950/80 text-zinc-300 border border-zinc-800"
                }`}
              >
                <span className="font-bold uppercase tracking-wider block mb-1">
                  Criterio de la Mesa:
                </span>
                {item.recommendation}
              </div>
            </div>

            {/* Legal Cite */}
            <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>{item.legalArticle}</span>
              <span className="text-zinc-400">ONPE 2026</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
