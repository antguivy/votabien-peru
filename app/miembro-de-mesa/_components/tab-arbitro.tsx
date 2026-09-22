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

  const renderRealisticBallot = (type: VoteScenario["visualType"]) => {
    // ── Caso: Cédula Rota o Rasgada ──
    if (type === "cedula_rota") {
      return (
        <div className="w-full h-32 sm:h-36 rounded-xl bg-[#fdfcf7] dark:bg-zinc-900/90 border border-border/80 overflow-hidden flex items-center justify-center p-2 select-none shadow-inner">
          <svg
            className="w-full max-w-[260px] h-full"
            viewBox="0 0 240 100"
            fill="none"
          >
            {/* Top Left Half */}
            <path
              d="M 10 10 L 130 10 L 122 35 L 135 48 L 118 58 L 126 72 L 108 85 L 115 90 L 10 90 Z"
              fill="#f5f4ee"
              stroke="#9ca3af"
              strokeWidth="1.2"
            />
            {/* Displaced Bottom Right Half */}
            <g transform="translate(6, 4)">
              <path
                d="M 136 10 L 230 10 L 230 90 L 122 90 L 115 85 L 133 72 L 125 58 L 142 48 L 129 35 Z"
                fill="#ecebe5"
                stroke="#9ca3af"
                strokeWidth="1.2"
              />
            </g>
            {/* Faint party symbol on left */}
            <rect
              x="30"
              y="25"
              width="36"
              height="36"
              rx="4"
              stroke="#d1d5db"
              strokeWidth="1"
              strokeDasharray="2 2"
              fill="none"
            />
            <circle cx="48" cy="43" r="10" fill="#e5e7eb" />

            {/* Voting box on right cut through */}
            <rect
              x="145"
              y="25"
              width="44"
              height="44"
              rx="4"
              stroke="#9ca3af"
              strokeWidth="1.2"
              fill="white"
            />

            {/* Red Alert Pill */}
            <rect
              x="65"
              y="40"
              width="110"
              height="22"
              rx="6"
              fill="#dc2626"
              opacity="0.95"
            />
            <text
              x="120"
              y="55"
              fill="white"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="900"
              textAnchor="middle"
              letterSpacing="1"
            >
              CÉDULA MUTILADA
            </text>
          </svg>
        </div>
      );
    }

    // ── Caso: Cédula Sin Firma en el Reverso ──
    if (type === "cedula_sin_firma") {
      return (
        <div className="w-full h-32 sm:h-36 rounded-xl bg-[#fdfcf7] dark:bg-zinc-900/90 border border-border/80 p-2.5 flex flex-col justify-between select-none font-mono shadow-inner">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              Reverso Oficial de Cédula ONPE
            </span>
            <span className="text-[8.5px] text-destructive font-black uppercase">
              Invalida el Voto
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-auto">
            {/* Presidente: Vacío */}
            <div className="p-2 rounded-lg bg-destructive/10 border border-dashed border-destructive/60 text-center space-y-1">
              <span className="text-[8px] font-bold text-destructive block">
                PRESIDENTE
              </span>
              <div className="h-6 flex items-center justify-center">
                <span className="text-[9px] font-black text-destructive tracking-tight">
                  ✗ SIN FIRMA
                </span>
              </div>
            </div>

            {/* Secretario: Firmado */}
            <div className="p-2 rounded-lg bg-background border border-border/70 text-center space-y-1">
              <span className="text-[8px] font-bold text-muted-foreground block">
                SECRETARIO
              </span>
              <div className="h-6 flex items-center justify-center">
                <svg className="w-16 h-5 text-blue-700" viewBox="0 0 50 16">
                  <path
                    d="M 3 10 C 10 2, 16 14, 24 6 C 30 2, 36 12, 48 8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* 3er Miembro: Firmado */}
            <div className="p-2 rounded-lg bg-background border border-border/70 text-center space-y-1">
              <span className="text-[8px] font-bold text-muted-foreground block">
                3er MIEMBRO
              </span>
              <div className="h-6 flex items-center justify-center">
                <svg className="w-16 h-5 text-blue-700" viewBox="0 0 50 16">
                  <path
                    d="M 3 8 C 12 14, 20 2, 30 10 C 36 14, 42 4, 48 10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="text-[8.5px] text-center text-muted-foreground font-medium">
            Art. 282 LOE: Si no tiene la firma de los miembros de mesa en el
            reverso, es nula automáticamente.
          </div>
        </div>
      );
    }

    // ── Casos de Marcado en Cédula (Cruz, Aspa, Mancha, etc.) ──
    return (
      <div className="w-full h-32 sm:h-36 rounded-xl bg-[#fdfcf7] dark:bg-zinc-900/90 border border-border/80 p-2.5 flex flex-col justify-between select-none shadow-inner">
        {/* Top simulated ballot row header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-1 text-[8px] font-mono text-muted-foreground font-semibold uppercase tracking-wider">
          <span>ELECCIONES 2026 · CÉDULA DE SUFRAGIO</span>
          <span>COLUMNA 01</span>
        </div>

        {/* Ballot Row with Logo + Vote Box */}
        <div className="flex items-center justify-between gap-3 px-2 my-auto">
          {/* Simulated Party Logo & Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-muted/70 border border-border flex items-center justify-center shrink-0">
              <span className="text-[9px] font-mono font-bold text-muted-foreground">
                SÍMBOLO
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] font-bold text-foreground block truncate">
                Organización Política
              </span>
              <span className="text-[8.5px] font-mono text-muted-foreground block">
                Candidato Oficial
              </span>
            </div>
          </div>

          {/* Voting Box (white paper cell with gray border) */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-zinc-950 border-2 border-zinc-400 dark:border-zinc-700 rounded-lg shadow-inner flex items-center justify-center shrink-0">
            {/* 1. Cruz perfecta */}
            {type === "cruz_perfecta" && (
              <svg
                className="w-14 h-14 sm:w-16 sm:h-16 text-blue-700"
                viewBox="0 0 60 60"
                fill="none"
              >
                <path
                  d="M 12 12 C 22 25, 36 38, 48 48"
                  stroke="#1d4ed8"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 48 13 C 35 24, 24 37, 12 48"
                  stroke="#1d4ed8"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* 2. Cruz desbordada con intersección adentro */}
            {type === "cruz_desbordada" && (
              <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                <svg
                  className="w-24 h-24 text-blue-700 absolute -top-4 -left-4 overflow-visible"
                  viewBox="0 0 80 80"
                  fill="none"
                >
                  <path
                    d="M 4 6 C 28 32, 52 54, 76 74"
                    stroke="#1d4ed8"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 75 7 C 51 31, 30 52, 5 73"
                    stroke="#1d4ed8"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                  {/* Green circle showing intersection is inside */}
                  <circle
                    cx="40"
                    cy="40"
                    r="5"
                    fill="#16a34a"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            )}

            {/* 3. Intersección sobre la línea o fuera */}
            {type === "cruz_linea" && (
              <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                <svg
                  className="w-24 h-24 text-destructive absolute -bottom-4 -right-4 overflow-visible"
                  viewBox="0 0 80 80"
                  fill="none"
                >
                  <path
                    d="M 30 16 C 46 38, 60 58, 78 76"
                    stroke="#dc2626"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 78 24 C 62 44, 46 62, 26 80"
                    stroke="#dc2626"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                  {/* Red circle showing intersection on line/outside */}
                  <circle
                    cx="54"
                    cy="52"
                    r="5"
                    fill="#dc2626"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            )}

            {/* 4. Signo check */}
            {type === "signo_check" && (
              <svg
                className="w-14 h-14 text-destructive"
                viewBox="0 0 60 60"
                fill="none"
              >
                <path
                  d="M 12 30 C 16 36, 21 42, 26 48 C 34 34, 43 20, 52 10"
                  stroke="#dc2626"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {/* 5. Carita feliz */}
            {type === "carita_feliz" && (
              <svg
                className="w-12 h-12 text-destructive"
                viewBox="0 0 60 60"
                fill="none"
              >
                <circle
                  cx="30"
                  cy="30"
                  r="20"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                />
                <circle cx="23" cy="24" r="2.2" fill="#dc2626" />
                <circle cx="37" cy="24" r="2.2" fill="#dc2626" />
                <path
                  d="M 21 35 C 25 44, 35 44, 39 35"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* 6. Texto o firma */}
            {type === "texto_o_firma" && (
              <svg
                className="w-16 h-16 text-destructive"
                viewBox="0 0 60 60"
                fill="none"
              >
                <path
                  d="M 6 32 C 12 20, 16 16, 20 34 C 23 44, 28 20, 34 32 C 38 26, 42 38, 54 28"
                  stroke="#dc2626"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 44 Q 30 40, 50 42"
                  stroke="#dc2626"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <text
                  x="30"
                  y="53"
                  fill="#dc2626"
                  fontSize="6.5"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  FIRMA / TEXTO
                </text>
              </svg>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[7px] font-mono text-muted-foreground border-t border-border/40 pt-1">
          <span>ONPE 2026</span>
          <span className="font-bold">CÉDULA OFICIAL</span>
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
            type="button"
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
            type="button"
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
            type="button"
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

      {/* ── Casos de Voto: Tarjetas Flashcard Desahogadas y Amplias ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredScenarios.map((item) => (
          <section
            key={item.id}
            className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between space-y-3"
          >
            {/* Header: Badge + Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border -rotate-1 shadow-2xs ${
                    item.ruling === "valid"
                      ? "text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400"
                      : "text-destructive bg-destructive/10 border-destructive/30"
                  }`}
                >
                  {item.ruling === "valid" ? "✓ Voto Válido" : "✗ Voto Nulo"}
                </span>

                <span className="text-[10px] font-mono text-muted-foreground">
                  {item.legalArticle.split("/")[0]}
                </span>
              </div>

              <h4 className="text-sm font-bold text-foreground leading-snug">
                {item.title}
              </h4>
            </div>

            {/* Realistic Graphic Ballot Illustration (Full Width Inside Card) */}
            <div>{renderRealisticBallot(item.visualType)}</div>

            {/* Direct Clear Rule in Plain Language (No redundant box) */}
            <div className="space-y-1.5 pt-1">
              <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                {item.rule}
              </p>

              <div
                className={`p-2.5 rounded-xl text-[11.5px] font-medium leading-snug ${
                  item.ruling === "valid"
                    ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-600/25"
                    : "bg-destructive/10 text-destructive border border-destructive/25"
                }`}
              >
                <strong className="block text-[10px] font-mono uppercase tracking-wider mb-0.5">
                  Criterio de la mesa:
                </strong>
                {item.recommendation}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
