"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Square,
  XCircle,
  AlertTriangle,
  Play,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Point,
  ColumnAnalysis,
  SimulatorPhase,
  ElectoralProcess,
  ColumnDef,
} from "@/interfaces/simulator";
import {
  COLUMNS_REGIONALES_2026,
  COLUMNS_GENERALES_2026,
  L,
} from "@/constants/challenge";
import type { BallotCanvasRef } from "@/components/simulador/ballot-canvas";
import { Button } from "@/components/ui/button";

const BallotCanvas = dynamic(
  () => import("@/components/simulador/ballot-canvas"),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full bg-muted/30 animate-pulse rounded-2xl flex items-center justify-center text-xs font-mono text-muted-foreground"
        style={{ aspectRatio: `${L.W} / ${L.H}` }}
      >
        Cargando cédula...
      </div>
    ),
  },
);

type VoteResult = ColumnAnalysis["result"];

const RESULT_META = {
  blank: {
    label: "En blanco",
    Icon: Square,
    badge: "text-muted-foreground bg-muted/70 border-border/80",
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
  },
  valid: {
    label: "Válido",
    Icon: CheckCircle2,
    badge:
      "text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  null: {
    label: "Nulo",
    Icon: XCircle,
    badge: "text-destructive bg-destructive/10 border-destructive/30",
    dot: "bg-red-500",
    text: "text-destructive",
  },
  viciado: {
    label: "Viciado",
    Icon: AlertTriangle,
    badge:
      "text-amber-700 bg-amber-500/10 border-amber-600/30 dark:text-amber-400",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
} as const satisfies Record<
  VoteResult,
  {
    label: string;
    Icon: React.ElementType;
    badge: string;
    dot: string;
    text: string;
  }
>;

function getColumnChipLines(type: string): [string, string] {
  switch (type) {
    case "gobernador":
      return ["Gobernador y", "Vicegobernador"];
    case "consejero":
      return ["Consejero", "Regional"];
    case "alcalde_provincial":
      return ["Alcalde", "Provincial"];
    case "alcalde_distrital":
      return ["Alcalde", "Distrital"];
    case "presidente":
      return ["Presidente y", "Vicepresidente"];
    case "senador_nacional":
      return ["Senador", "Nacional"];
    case "senador_regional":
      return ["Senador", "Regional"];
    case "diputado":
      return ["Cámara de", "Diputados"];
    case "parlamento_andino":
      return ["Parlamento", "Andino"];
    default:
      return ["Autoridad", "Electoral"];
  }
}

// ─── Process Selector ─────────────────────────────────────────────────────────

function ProcessSelector({ process }: { process: ElectoralProcess }) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-muted/50 border border-border/70 text-xs font-mono flex-wrap gap-1">
      <button
        type="button"
        disabled
        className="px-3 py-1.5 rounded-lg text-muted-foreground/50 cursor-not-allowed font-medium"
      >
        Generales 2026
      </button>
      <button
        type="button"
        className={cn(
          "px-3 py-1.5 rounded-lg font-semibold transition-all",
          process === "regionales_2026"
            ? "bg-background text-foreground shadow-2xs border border-border/60"
            : "text-muted-foreground",
        )}
      >
        Regionales y Municipales 2026 (4 Autoridades)
      </button>
    </div>
  );
}

// ─── Intro Screen ────────────────────────────────────────────────────────────

function IntroScreen({
  process,
  onStart,
}: {
  process: ElectoralProcess;
  onStart: () => void;
}) {
  const columns =
    process === "regionales_2026"
      ? COLUMNS_REGIONALES_2026
      : COLUMNS_GENERALES_2026;

  return (
    <div className="flex flex-col h-full overflow-y-auto min-h-0 gap-5 pb-6 pr-0.5">
      {/* Title & Subtitle */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
          Simulador de Votación
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          Practica cómo marcar tu cédula para las Elecciones Regionales y
          Municipales 2026. Aprende cómo funciona el voto cruzado entre
          autoridades y cómo emitir un voto válido con aspa (✗) o cruz (+).
        </p>
      </div>

      {/* Proceso Electoral */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
          Proceso Electoral
        </p>
        <ProcessSelector process={process} />
      </div>

      {/* CTA Button (Ubicado inmediatamente después del selector y antes de las autoridades) */}
      <div>
        <Button
          onClick={onStart}
          className="w-full h-12 text-sm font-mono font-bold tracking-wider uppercase bg-foreground text-background hover:bg-foreground/90 shadow-sm flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          Iniciar
        </Button>
      </div>

      {/* Columnas que contiene la cédula */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
            Las 4 autoridades que eliges en la cédula
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Voto independiente
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {columns.map((col, idx) => {
            const lines = getColumnChipLines(col.type);
            return (
              <div
                key={col.id}
                className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-md bg-foreground text-background font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  0{idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">
                    {lines[0]} {lines[1]}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                    {col.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tip clave del voto cruzado y la intersección */}
      <div className="p-4 rounded-2xl border border-border/70 bg-muted/20 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="font-mono uppercase font-bold text-foreground text-[11px]">
            Ten en cuenta antes de empezar
          </span>
        </div>
        <ul className="text-muted-foreground space-y-1.5 leading-relaxed pl-1">
          <li>
            • <strong>Voto cruzado:</strong> Puedes marcar por organizaciones
            distintas en cada una de las 4 columnas. Cada cargo se cuenta de
            forma independiente.
          </li>
          <li>
            • <strong>Regla del trazo:</strong> El punto donde se cruzan las
            líneas (del aspa o la cruz) debe quedar dentro del recuadro del
            símbolo para que el voto sea válido.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── NavChips Component con Auto-Centrado Inteligente y 2 Líneas ─────────────

function NavChips({
  columns,
  activeIndex,
  allAnalyses,
  onSelect,
}: {
  columns: ColumnDef[];
  activeIndex: number;
  allAnalyses: Record<number, ColumnAnalysis>;
  onSelect: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-centra el chip activo horizontalmente cuando cambia el índice
  useEffect(() => {
    if (!containerRef.current) return;
    const activeChip = containerRef.current.querySelector(
      `[data-chip-index="${activeIndex}"]`,
    ) as HTMLElement | null;

    if (activeChip) {
      activeChip.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none -mx-1 px-1"
      style={{ scrollbarWidth: "none" }}
    >
      {columns.map((col, i) => {
        const isCurrent = i === activeIndex;
        const analysis = allAnalyses[i];
        const meta = analysis?.result ? RESULT_META[analysis.result] : null;
        const lines = getColumnChipLines(col.type);

        return (
          <button
            key={col.id}
            type="button"
            data-chip-index={i}
            onClick={() => onSelect(i)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left transition-all shrink-0 select-none",
              isCurrent
                ? "bg-foreground text-background border-foreground shadow-xs"
                : "bg-card hover:bg-muted/60 text-muted-foreground border-border/80",
            )}
          >
            <span
              className={cn(
                "font-mono text-[11px] font-bold px-1.5 py-0.5 rounded",
                isCurrent
                  ? "bg-background/20 text-background"
                  : "bg-muted text-muted-foreground",
              )}
            >
              0{i + 1}
            </span>
            <div className="flex flex-col text-xs leading-tight">
              <span className="font-medium text-[10px] opacity-75">
                {lines[0]}
              </span>
              <span className="font-bold">{lines[1]}</span>
            </div>
            {meta && (
              <span
                className={cn("w-2 h-2 rounded-full shrink-0 ml-0.5", meta.dot)}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Panel de Evaluación del Trazo ───────────────────────────────────────────

function PanelEvaluacion({
  analysis,
  col,
}: {
  analysis: ColumnAnalysis | null;
  col: ColumnDef;
}) {
  if (!analysis || analysis.result === "blank") {
    return (
      <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
            Resultado de tu trazo
          </span>
          <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border -rotate-1 shadow-2xs text-muted-foreground bg-muted/60 border-border/70">
            En blanco
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Dibuja una cruz (+) o un aspa (✗) dentro del recuadro del símbolo de
          tu preferencia.
        </p>
      </div>
    );
  }

  const meta = RESULT_META[analysis.result];
  const isInterInside = analysis.isIntersectionInsideBox;
  const hasInter = analysis.intersectionPoint !== undefined;

  return (
    <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/60">
        <span className="text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
          Resultado de tu trazo
        </span>
        <span
          className={cn(
            "text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded border -rotate-1 shadow-2xs",
            meta.badge,
          )}
        >
          {meta.label}
        </span>
      </div>

      {/* Explicación en lenguaje sencillo */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground leading-snug">
          {analysis.submessage || analysis.message}
        </p>

        {analysis.hint && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {analysis.hint}
          </p>
        )}
      </div>

      {/* Detalle visual de la intersección */}
      {hasInter && (
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                isInterInside ? "bg-emerald-500" : "bg-destructive",
              )}
            />
            <span className="font-medium text-foreground">
              Punto de cruce del trazo:
            </span>
          </div>
          <span
            className={cn(
              "font-mono font-bold text-[11px]",
              isInterInside
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-destructive",
            )}
          >
            {isInterInside ? "Adentro (Válido)" : "Afuera (Nulo)"}
          </span>
        </div>
      )}

      {/* Detalle preferencial si aplica */}
      {col.type !== "presidente" &&
        analysis.result === "valid" &&
        analysis.preferentialStatus &&
        col.prefBoxCount > 0 && (
          <div className="pt-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md border",
                analysis.preferentialStatus === "written"
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900"
                  : "bg-muted text-muted-foreground border-border/60",
              )}
            >
              <span>Voto Preferencial:</span>
              <strong>
                {analysis.preferentialStatus === "written"
                  ? "Registrado ✓"
                  : "No utilizado"}
              </strong>
            </span>
          </div>
        )}
    </div>
  );
}

// ─── Voting Screen ────────────────────────────────────────────────────────────

function VotingScreen({
  process,
  colIndex,
  allStrokes,
  allAnalyses,
  onSelectCol,
  onUpdate,
  onNext,
  onBack,
  onHome,
}: {
  process: ElectoralProcess;
  colIndex: number;
  allStrokes: Record<number, Point[][]>;
  allAnalyses: Record<number, ColumnAnalysis>;
  onSelectCol: (i: number) => void;
  onUpdate: (strokes: Point[][], analysis: ColumnAnalysis) => void;
  onNext: () => void;
  onBack: () => void;
  onHome: () => void;
}) {
  const columns =
    process === "regionales_2026"
      ? COLUMNS_REGIONALES_2026
      : COLUMNS_GENERALES_2026;

  const col = columns[colIndex];
  const analysis = allAnalyses[colIndex] ?? null;
  const saved = allStrokes[colIndex] ?? [];
  const canvasRef = useRef<BallotCanvasRef>(null);

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      {/* ── Barra Superior: Salir + Contador + Limpiar trazo ── */}
      <div className="flex-shrink-0 space-y-2.5 pb-2.5 border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onHome}
            className="text-xs font-mono text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Salir al menú
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              Columna {colIndex + 1} de {columns.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                canvasRef.current?.clear();
              }}
              className="text-xs font-mono h-8 px-2.5"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Limpiar
            </Button>
          </div>
        </div>

        {/* Chips Inteligentes de 2 Líneas con Auto-Centrado */}
        <NavChips
          columns={columns}
          activeIndex={colIndex}
          allAnalyses={allAnalyses}
          onSelect={onSelectCol}
        />
      </div>

      {/* ── Cédula & Evaluación (Responsive Grid) ── */}
      <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Cédula Canvas Container (Borde Único) */}
          <div className="md:col-span-7 flex justify-center">
            <div className="rounded-xl overflow-hidden border border-border/80 shadow-xs w-full max-w-[340px] bg-card">
              <BallotCanvas
                ref={canvasRef}
                col={col}
                savedStrokes={saved}
                onUpdate={onUpdate}
              />
            </div>
          </div>

          {/* Panel de Evaluación & Ficha del Cargo */}
          <div className="md:col-span-5 space-y-3">
            <PanelEvaluacion analysis={analysis} col={col} />

            {/* Ficha del cargo */}
            <div className="p-3.5 rounded-2xl border border-border/70 bg-muted/20 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                <span className="font-mono uppercase font-bold text-muted-foreground text-[10px]">
                  Cargo a elegir
                </span>
              </div>
              <p className="font-bold text-foreground text-sm">{col.label}</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {col.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra de Navegación Inferior (Sticky al fondo) ── */}
      <div className="flex-shrink-0 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-border/60 flex items-center gap-2 bg-background">
        {colIndex > 0 && (
          <Button
            variant="outline"
            onClick={onBack}
            className="h-11 px-4 text-xs font-mono"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
        )}

        <Button
          onClick={onNext}
          className="flex-1 h-11 text-xs font-mono font-bold tracking-wider uppercase bg-foreground text-background hover:bg-foreground/90 shadow-xs"
        >
          {colIndex < columns.length - 1 ? (
            <>
              Siguiente Columna
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              Ver mi resultado
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Result Summary ───────────────────────────────────────────────────────────

function ResultSummary({
  process,
  allAnalyses,
  onRestart,
}: {
  process: ElectoralProcess;
  allAnalyses: Record<number, ColumnAnalysis>;
  onRestart: () => void;
}) {
  const columns =
    process === "regionales_2026"
      ? COLUMNS_REGIONALES_2026
      : COLUMNS_GENERALES_2026;

  const results = columns.map(
    (_, i) => allAnalyses[i]?.result ?? "blank",
  ) as VoteResult[];
  const counts = { valid: 0, null: 0, blank: 0, viciado: 0 };
  results.forEach((r) => counts[r]++);

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pb-4">
        {/* Header */}
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Resultado
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Revisa el estado de cada columna. Cada autoridad es independiente,
            por lo que tus votos válidos se cuentan aunque hayas dejado otra
            columna en blanco o anulada.
          </p>
        </div>

        {/* Resumen Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(Object.entries(counts) as [VoteResult, number][]).map(([r, n]) => {
            const meta = RESULT_META[r];
            const Icon = meta.Icon;
            return (
              <div
                key={r}
                className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col items-center justify-center space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("w-3.5 h-3.5", meta.text)} />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-muted-foreground">
                    {meta.label}
                  </span>
                </div>
                <span className="text-2xl font-black font-mono tabular-nums text-foreground">
                  {n}
                </span>
              </div>
            );
          })}
        </div>

        {/* Desglose por Autoridad (Borde Único) */}
        <div className="divide-y divide-border/60 rounded-xl overflow-hidden bg-card border border-border/80 shadow-xs">
          {columns.map((col, i) => {
            const r = results[i];
            const meta = RESULT_META[r];
            const a = allAnalyses[i];
            const lines = getColumnChipLines(col.type);

            return (
              <div
                key={col.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-muted text-foreground font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      0{i + 1}
                    </span>
                    <h4 className="text-sm font-bold text-foreground">
                      {lines[0]} {lines[1]}
                    </h4>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded border text-[10px] font-mono font-black uppercase tracking-wider -rotate-1 shadow-2xs",
                        meta.badge,
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {a?.submessage && (
                    <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                      {a.submessage}
                    </p>
                  )}
                </div>

                {a?.isIntersectionInsideBox !== undefined && (
                  <div className="text-xs font-mono text-muted-foreground shrink-0 pl-7 sm:pl-0">
                    Punto de cruce:{" "}
                    <strong
                      className={
                        a.isIntersectionInsideBox
                          ? "text-emerald-600"
                          : "text-destructive"
                      }
                    >
                      {a.isIntersectionInsideBox
                        ? "Adentro (Válido)"
                        : "Afuera (Nulo)"}
                    </strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recordatorios Importantes */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-foreground">
              Puntos clave para el día de la elección
            </span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>
              • <strong>Intersección del trazo:</strong> Lo que define si tu
              voto es válido es que el cruce de las dos líneas esté dentro del
              recuadro del símbolo. Si las puntas salen un poco del recuadro
              pero el centro está adentro, el voto se cuenta como válido.
            </li>
            <li>
              • <strong>Voto cruzado:</strong> No es obligatorio votar por el
              mismo partido en toda la cédula. Puedes elegir opciones distintas
              para cada autoridad regional y municipal.
            </li>
            <li>
              • <strong>Marcas válidas:</strong> Únicamente el aspa (✗) o la
              cruz (+) son válidas. No firmes ni escribas palabras en la cédula.
            </li>
          </ul>
        </div>
      </div>

      {/* Botón Inferior */}
      <div className="flex-shrink-0 pt-3 pb-28 lg:pb-3 border-t border-border/60 bg-background">
        <Button
          onClick={onRestart}
          className="w-full h-11 text-xs font-mono font-bold uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-2" />
          Volver a practicar
        </Button>
      </div>
    </div>
  );
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export default function SimuladorView() {
  const [process] = useState<ElectoralProcess>("regionales_2026");
  const [phase, setPhase] = useState<SimulatorPhase>("intro");
  const [colIndex, setColIndex] = useState(0);
  const [allStrokes, setAllStrokes] = useState<Record<number, Point[][]>>({});
  const [allAnalyses, setAllAnalyses] = useState<
    Record<number, ColumnAnalysis>
  >({});

  const columns = COLUMNS_REGIONALES_2026;

  // Ocultar barra de navegación inferior móvil únicamente durante la votación
  useEffect(() => {
    if (phase === "voting") {
      document.documentElement.classList.add("hide-mobile-bottom-nav");
    } else {
      document.documentElement.classList.remove("hide-mobile-bottom-nav");
    }
    return () => {
      document.documentElement.classList.remove("hide-mobile-bottom-nav");
    };
  }, [phase]);

  const handleUpdate = useCallback(
    (strokes: Point[][], analysis: ColumnAnalysis) => {
      setAllStrokes((prev) => ({ ...prev, [colIndex]: strokes }));
      setAllAnalyses((prev) => ({ ...prev, [colIndex]: analysis }));
    },
    [colIndex],
  );

  const handleNext = useCallback(() => {
    if (colIndex < columns.length - 1) {
      setColIndex((i) => i + 1);
    } else {
      setPhase("result");
    }
  }, [colIndex, columns.length]);

  const handleBack = useCallback(() => {
    setColIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleSelectCol = useCallback((i: number) => {
    setColIndex(i);
  }, []);

  const handleStart = useCallback(() => {
    setPhase("voting");
  }, []);

  const handleHome = useCallback(() => {
    setPhase("intro");
    setColIndex(0);
    setAllStrokes({});
    setAllAnalyses({});
  }, []);

  const handleRestart = useCallback(() => {
    setPhase("intro");
    setColIndex(0);
    setAllStrokes({});
    setAllAnalyses({});
  }, []);

  if (phase === "intro") {
    return <IntroScreen process={process} onStart={handleStart} />;
  }

  if (phase === "result") {
    return (
      <ResultSummary
        process={process}
        allAnalyses={allAnalyses}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <VotingScreen
      process={process}
      colIndex={colIndex}
      allStrokes={allStrokes}
      allAnalyses={allAnalyses}
      onSelectCol={handleSelectCol}
      onUpdate={handleUpdate}
      onNext={handleNext}
      onBack={handleBack}
      onHome={handleHome}
    />
  );
}
