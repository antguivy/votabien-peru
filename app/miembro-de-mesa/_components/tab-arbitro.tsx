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
    // ── Cédula Rota o Rasgada ──
    if (type === "cedula_rota") {
      return (
        <div className="p-1 rounded-2xl bg-muted/30 border border-border/60 shrink-0 shadow-2xs">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-[#fbfaf6] dark:bg-zinc-900 border border-border/80 rounded-xl overflow-hidden p-1.5 flex items-center justify-center select-none">
            {/* Ripped ballot effect with jagged SVG tear */}
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Top Piece */}
              <path
                d="M 10 10 L 90 10 L 90 42 L 76 38 L 82 48 L 68 44 L 72 54 L 56 48 L 60 60 L 42 54 L 46 66 L 28 58 L 22 70 L 10 62 Z"
                fill="#f4f3ee"
                stroke="#9ca3af"
                strokeWidth="1.2"
              />
              {/* Faint symbol in top piece */}
              <rect
                x="25"
                y="18"
                width="20"
                height="20"
                rx="3"
                stroke="#d1d5db"
                strokeWidth="1"
                strokeDasharray="2 2"
                fill="none"
              />
              <path
                d="M 30 35 L 35 24 L 40 35 Z"
                fill="#d1d5db"
                opacity="0.8"
              />

              {/* Bottom Piece Displaced */}
              <g transform="translate(2, 6)">
                <path
                  d="M 10 70 L 22 76 L 28 64 L 46 72 L 42 60 L 60 66 L 56 54 L 72 60 L 68 50 L 82 54 L 76 44 L 90 48 L 90 90 L 10 90 Z"
                  fill="#e5e5df"
                  stroke="#9ca3af"
                  strokeWidth="1.2"
                />
              </g>

              {/* Ripped Tear Warning Label */}
              <rect
                x="15"
                y="46"
                width="70"
                height="16"
                rx="4"
                fill="#dc2626"
                opacity="0.9"
              />
              <text
                x="50"
                y="57"
                fill="white"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="900"
                textAnchor="middle"
                letterSpacing="1"
              >
                CÉDULA ROTA
              </text>
            </svg>
          </div>
        </div>
      );
    }

    // ── Cédula Sin Firma del Presidente en Reverso ──
    if (type === "cedula_sin_firma") {
      return (
        <div className="p-1 rounded-2xl bg-muted/30 border border-border/60 shrink-0 shadow-2xs">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-[#fdfcf8] dark:bg-zinc-900 border border-border/80 rounded-xl p-1.5 flex flex-col justify-between select-none font-mono text-[8px]">
            {/* Header */}
            <div className="border-b border-zinc-300 pb-0.5 text-center">
              <span className="font-bold text-[7.5px] text-zinc-600 dark:text-zinc-400 block tracking-tight">
                CÉDULA DE SUFRAGIO
              </span>
              <span className="text-[6.5px] text-zinc-500 uppercase tracking-widest block">
                REVERSO
              </span>
            </div>

            {/* Signature Rows */}
            <div className="space-y-1 my-auto">
              {/* Presidente: Missing Signature */}
              <div className="p-1 rounded bg-destructive/10 border border-dashed border-destructive/60 flex items-center justify-between">
                <span className="text-[7px] text-destructive font-black">
                  PRESIDENTE
                </span>
                <span className="text-[7.5px] font-black text-destructive tracking-tighter">
                  ✗ SIN FIRMA
                </span>
              </div>

              {/* Secretario: Signed */}
              <div className="flex items-center justify-between px-1 text-zinc-500">
                <span className="text-[6.5px]">Secretario</span>
                <svg className="w-10 h-3 text-blue-700" viewBox="0 0 40 12">
                  <path
                    d="M 2 8 C 8 2, 12 10, 18 4 C 22 1, 26 9, 38 6"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* 3er Miembro: Signed */}
              <div className="flex items-center justify-between px-1 text-zinc-500">
                <span className="text-[6.5px]">3er Miembro</span>
                <svg className="w-10 h-3 text-blue-700" viewBox="0 0 40 12">
                  <path
                    d="M 2 6 C 10 10, 16 1, 24 7 C 28 10, 32 3, 38 7"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Footer warning */}
            <div className="text-[6.5px] text-destructive text-center font-bold uppercase tracking-tight">
              Invalida el voto
            </div>
          </div>
        </div>
      );
    }

    // ── Casos de Marcado en Recuadro (Cruz, Aspa, Mancha, Texto, Check) ──
    return (
      <div className="p-1 rounded-2xl bg-muted/30 border border-border/60 shrink-0 shadow-2xs">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-[#fdfcf8] dark:bg-zinc-900 border border-border/80 rounded-xl overflow-hidden p-1.5 flex flex-col justify-between select-none">
          {/* Top simulated party strip */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-0.5 px-0.5">
            <span className="text-[7.5px] font-mono font-bold text-zinc-600 dark:text-zinc-400 truncate">
              ORGANIZACIÓN
            </span>
            <span className="text-[7px] font-mono text-zinc-400">01</span>
          </div>

          {/* Voting Cell Container with Simulated Party Symbol + Vote Box */}
          <div className="relative flex-1 flex items-center justify-center my-0.5">
            {/* Simulated Party Symbol in Background */}
            <div className="absolute left-1.5 w-7 h-7 rounded bg-zinc-200/70 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-[9px] font-mono font-bold text-zinc-400">
                LOGO
              </span>
            </div>

            {/* Voting Box (white paper cell with gray border) */}
            <div className="relative w-14 h-14 bg-white dark:bg-zinc-950 border border-zinc-400 dark:border-zinc-700 rounded-md shadow-inner flex items-center justify-center ml-8">
              {/* Realistic Hand-Drawn Stroke Paths */}

              {/* 1. Cruz o aspa perfecta */}
              {type === "cruz_perfecta" && (
                <svg
                  className="w-12 h-12 text-[#1e40af]"
                  viewBox="0 0 60 60"
                  fill="none"
                >
                  {/* Natural ballpoint pen strokes with realistic hand curves */}
                  <path
                    d="M 14 12 C 22 25, 36 38, 47 49"
                    stroke="#1d4ed8"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 46 13 C 35 24, 24 37, 13 48"
                    stroke="#1d4ed8"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* 2. Cruz que sobrepasa ligeramente pero intersección dentro */}
              {type === "cruz_desbordada" && (
                <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                  <svg
                    className="w-20 h-20 text-[#1e40af] absolute -top-3 -left-3 overflow-visible"
                    viewBox="0 0 80 80"
                    fill="none"
                  >
                    {/* Strokes extending beyond box borders */}
                    <path
                      d="M 6 8 C 28 32, 52 54, 74 74"
                      stroke="#1d4ed8"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 73 9 C 51 31, 30 52, 7 73"
                      stroke="#1d4ed8"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    {/* Green indicator: intersection is legally INSIDE */}
                    <circle
                      cx="40"
                      cy="41"
                      r="4.5"
                      fill="#16a34a"
                      stroke="white"
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                  </svg>
                </div>
              )}

              {/* 3. Intersección sobre la línea o fuera */}
              {type === "cruz_linea" && (
                <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                  <svg
                    className="w-20 h-20 text-[#dc2626] absolute -bottom-4 -right-4 overflow-visible"
                    viewBox="0 0 80 80"
                    fill="none"
                  >
                    {/* Strokes crossing on the bottom-right border */}
                    <path
                      d="M 28 15 C 44 38, 58 58, 76 76"
                      stroke="#dc2626"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 76 22 C 60 42, 44 60, 24 78"
                      stroke="#dc2626"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Red indicator: intersection falls on or outside line */}
                    <circle
                      cx="53"
                      cy="51"
                      r="4.5"
                      fill="#dc2626"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              )}

              {/* 4. Signo check (✓) */}
              {type === "signo_check" && (
                <svg
                  className="w-12 h-12 text-[#dc2626]"
                  viewBox="0 0 60 60"
                  fill="none"
                >
                  {/* Handwritten checkmark */}
                  <path
                    d="M 12 32 C 16 37, 20 42, 25 47 C 32 35, 41 22, 50 12"
                    stroke="#dc2626"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* 5. Carita feliz o garabatos */}
              {type === "carita_feliz" && (
                <svg
                  className="w-11 h-11 text-[#dc2626]"
                  viewBox="0 0 60 60"
                  fill="none"
                >
                  {/* Hand-drawn doodle smiley */}
                  <circle
                    cx="30"
                    cy="30"
                    r="19"
                    stroke="#dc2626"
                    strokeWidth="2.4"
                  />
                  <circle cx="23" cy="24" r="2.2" fill="#dc2626" />
                  <circle cx="37" cy="24" r="2.2" fill="#dc2626" />
                  <path
                    d="M 21 35 C 25 43, 35 43, 39 35"
                    stroke="#dc2626"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* 6. Texto escrito, firma o insulto */}
              {type === "texto_o_firma" && (
                <svg
                  className="w-14 h-14 text-[#dc2626]"
                  viewBox="0 0 60 60"
                  fill="none"
                >
                  {/* Realistic ballpoint scribble / handwriting */}
                  <path
                    d="M 8 32 C 14 22, 18 18, 22 34 C 25 42, 30 20, 36 32 C 40 26, 44 38, 52 30"
                    stroke="#dc2626"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 12 42 Q 32 38, 50 40"
                    stroke="#dc2626"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <text
                    x="30"
                    y="52"
                    fill="#dc2626"
                    fontSize="7"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    FIRMA / DNI
                  </text>
                </svg>
              )}
            </div>
          </div>

          {/* Bottom ballot indicator */}
          <div className="flex items-center justify-between text-[6.5px] font-mono text-zinc-400 px-0.5">
            <span>ONPE 2026</span>
            <span>VOTO</span>
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

      {/* ── Casos Visuales de Voto con Ilustración Realista ── */}
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

              {/* Graphic Realistic Ballot Box */}
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
