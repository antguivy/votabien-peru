"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Pen,
  Crosshair,
  CheckCircle2,
  XCircle,
  Square,
  AlertTriangle,
  Lightbulb,
  Trophy,
  ArrowRight,
  List,
  Minus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Point,
  ColumnAnalysis,
  SimulatorMode,
  SimulatorPhase,
} from "@/interfaces/simulator";
import { COLUMNS, CHALLENGES } from "@/constants/challenge";
import type { BallotCanvasRef } from "@/components/simulador/ballot-canvas";

const BallotCanvas = dynamic(
  () => import("@/components/simulador/ballot-canvas"),
  { ssr: false },
);

// ─── Result metadata ──────────────────────────────────────────────────────────

type VoteResult = ColumnAnalysis["result"];

const RESULT_META = {
  blank: {
    label: "Blanco",
    Icon: Square,
    pill: "bg-muted text-muted-foreground",
    banner: "bg-muted/60",
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    ring: "ring-muted-foreground/20",
  },
  valid: {
    label: "Válido",
    Icon: CheckCircle2,
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    banner: "bg-emerald-50/80 dark:bg-emerald-950/30",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    ring: "ring-emerald-200 dark:ring-emerald-800/60",
  },
  null: {
    label: "Nulo",
    Icon: XCircle,
    pill: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    banner: "bg-red-50/80 dark:bg-red-950/30",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    ring: "ring-red-200 dark:ring-red-800/60",
  },
  viciado: {
    label: "Viciado",
    Icon: AlertTriangle,
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    banner: "bg-amber-50/80 dark:bg-amber-950/30",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    ring: "ring-amber-200 dark:ring-amber-800/60",
  },
} as const satisfies Record<
  VoteResult,
  {
    label: string;
    Icon: React.ElementType;
    pill: string;
    banner: string;
    dot: string;
    text: string;
    ring: string;
  }
>;

// ─── Intro ────────────────────────────────────────────────────────────────────

function IntroScreen({ onSelect }: { onSelect: (m: SimulatorMode) => void }) {
  const [showColumns, setShowColumns] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Brand */}
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-[1.15]">
          Simulador de Votación
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[300px]">
          Practica cómo marcar tu cédula antes del día de la elección.
        </p>
      </div>

      {/* Mode cards */}
      <div className="flex flex-col gap-2.5">
        <ModeCard
          Icon={Pen}
          label="Modo Libre"
          desc="Vota en las 5 columnas como quieras y analiza el resultado."
          onClick={() => onSelect("libre")}
        />
        <ModeCard
          Icon={Crosshair}
          label="Modo Retos"
          desc="5 retos guiados para dominar cada tipo de voto."
          onClick={() => onSelect("retos")}
        />
      </div>

      {/* Vote types */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-2.5">
          Tipos de voto
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            Object.entries(RESULT_META) as [
              VoteResult,
              (typeof RESULT_META)[VoteResult],
            ][]
          ).map(([key, meta]) => {
            const Icon = meta.Icon;
            return (
              <div
                key={key}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2",
                  meta.pill,
                )}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                <span className="text-xs font-semibold">{meta.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Columns reference — collapsible */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        <button
          onClick={() => setShowColumns((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-card text-left"
        >
          <div className="flex items-center gap-2.5">
            <List
              className="w-3.5 h-3.5 text-muted-foreground"
              strokeWidth={2}
            />
            <span className="text-xs font-semibold text-foreground">
              Las 5 columnas de la cédula
            </span>
          </div>
          <div
            className={cn(
              "w-5 h-5 rounded-full bg-muted flex items-center justify-center transition-transform duration-200",
              showColumns && "rotate-180",
            )}
          >
            <ChevronRight
              className="w-3 h-3 text-muted-foreground rotate-90"
              strokeWidth={2.5}
            />
          </div>
        </button>

        {showColumns && (
          <div className="px-4 pb-4 bg-card border-t border-border/50 space-y-3 pt-3">
            {COLUMNS.map((col, i) => (
              <div key={col.id} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: "var(--brand)" }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {col.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {col.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/40 text-center pb-2">
        Partidos ficticios · Solo educativo · VotaBien Perú
      </p>
    </div>
  );
}

function ModeCard({
  Icon,
  label,
  desc,
  onClick,
}: {
  Icon: React.ElementType;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-card text-left
        active:scale-[0.98] transition-all duration-150"
      style={{
        boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: "color-mix(in oklch, var(--brand) 12%, transparent)",
        }}
      >
        <Icon
          className="w-4.5 h-4.5"
          style={{ color: "var(--brand)" }}
          strokeWidth={2}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
          {desc}
        </p>
      </div>
      <ArrowRight
        className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 group-active:translate-x-0.5 transition-transform"
        strokeWidth={2}
      />
    </button>
  );
}

// ─── Voting Screen ────────────────────────────────────────────────────────────

function VotingScreen({
  mode,
  colIndex,
  allStrokes,
  allAnalyses,
  onUpdate,
  onNext,
  onBack,
}: {
  mode: SimulatorMode;
  colIndex: number;
  allStrokes: Record<number, Point[][]>;
  allAnalyses: Record<number, ColumnAnalysis>;
  onUpdate: (strokes: Point[][], analysis: ColumnAnalysis) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const col = COLUMNS[colIndex];
  const analysis = allAnalyses[colIndex] ?? null;
  const saved = allStrokes[colIndex] ?? [];
  const canvasRef = useRef<BallotCanvasRef>(null);
  const [showTip, setShowTip] = useState(false);

  const challenge = mode === "retos" ? CHALLENGES[colIndex] : null;
  const emptyAnalysis: ColumnAnalysis = {
    result: "blank",
    feedbackType: "blank",
    boxAnalyses: [],
    hasOutOfBoxStrokes: false,
    message: "",
  };
  const challengeDone = challenge
    ? challenge.checkPassed(analysis ?? emptyAnalysis)
    : true;
  const canProceed = mode === "libre" || challengeDone;

  return (
    <div className="flex flex-col h-full">
      {/* ── Progress + header ── */}
      <div className="flex-shrink-0 mb-3">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-3">
          {COLUMNS.map((_, i) => {
            const r = allAnalyses[i]?.result as VoteResult | undefined;
            const meta = r ? RESULT_META[r] : null;
            const isCurrent = i === colIndex;
            const isDone = i < colIndex;

            return (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  isCurrent ? "w-6 h-1.5" : "w-1.5 h-1.5",
                  isCurrent
                    ? "opacity-100"
                    : isDone && meta
                      ? `${meta.dot} opacity-100`
                      : "bg-border opacity-100",
                )}
                style={
                  isCurrent ? { backgroundColor: "var(--brand)" } : undefined
                }
              />
            );
          })}
          <span className="text-[11px] text-muted-foreground ml-1 font-medium">
            {colIndex + 1} / {COLUMNS.length}
          </span>
        </div>

        {/* Column title + clear */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
              {mode === "retos" ? `Reto ${colIndex + 1}` : "Columna"}
            </p>
            <h2 className="text-lg font-bold text-foreground leading-tight mt-0.5">
              {col.label}
              <span className="text-sm font-normal text-muted-foreground ml-1.5">
                {col.sublabel}
              </span>
            </h2>
          </div>
          <button
            onClick={() => {
              canvasRef.current?.clear();
              setShowTip(false);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground
              bg-muted/60 hover:bg-muted rounded-xl px-3 py-2 transition-colors
              active:scale-[0.97] flex-shrink-0 mt-1"
          >
            <RotateCcw className="w-3 h-3" strokeWidth={2.5} />
            Borrar
          </button>
        </div>
      </div>

      {/* ── Challenge banner ── */}
      {challenge && (
        <div
          className={cn(
            "flex-shrink-0 rounded-2xl px-4 py-3 flex items-start gap-3 mb-3 transition-all duration-300",
            challengeDone
              ? "bg-emerald-50 dark:bg-emerald-950/40"
              : "bg-muted/50",
          )}
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
              challengeDone
                ? "bg-emerald-100 dark:bg-emerald-900/60"
                : "bg-muted",
            )}
          >
            {challengeDone ? (
              <Check
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                strokeWidth={3}
              />
            ) : (
              <Crosshair
                className="w-3.5 h-3.5 text-muted-foreground"
                strokeWidth={2}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-xs font-semibold",
                challengeDone
                  ? "text-emerald-800 dark:text-emerald-300"
                  : "text-foreground",
              )}
            >
              {challengeDone ? "¡Reto completado!" : challenge.title}
            </p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
              {challengeDone
                ? 'Pulsa "Siguiente" para continuar.'
                : challenge.instruction}
            </p>
          </div>
          {!challengeDone && (
            <button
              onClick={() => setShowTip((t) => !t)}
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                showTip ? "bg-amber-100 dark:bg-amber-900/40" : "bg-muted",
              )}
            >
              <Lightbulb
                className={cn(
                  "w-3 h-3",
                  showTip
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground",
                )}
                strokeWidth={2}
              />
            </button>
          )}
        </div>
      )}

      {/* ── Tip ── */}
      {showTip && challenge && !challengeDone && (
        <div className="flex-shrink-0 mb-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-3">
          <Lightbulb
            className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"
            strokeWidth={2}
          />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
            {challenge.tip}
          </p>
        </div>
      )}

      {/* ── Canvas ── */}
      <div
        className="flex-shrink-0 rounded-2xl overflow-hidden bg-card"
        style={{
          boxShadow: "0 2px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        <BallotCanvas
          ref={canvasRef}
          col={col}
          savedStrokes={saved}
          onUpdate={onUpdate}
        />
      </div>

      {/* ── Feedback ── */}
      <div className="flex-shrink-0 mt-2.5 min-h-[52px]">
        {analysis ? (
          <FeedbackPanel analysis={analysis} col={col} />
        ) : (
          <EmptyHint col={col} />
        )}
      </div>

      <div className="flex-1 min-h-0" />

      {/* ── Navigation ── */}
      <div className="flex-shrink-0 flex items-center gap-2 pt-3">
        {colIndex > 0 && (
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center
              text-muted-foreground hover:bg-muted transition-colors active:scale-[0.96]"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "flex-1 h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5",
            "transition-all duration-150 active:scale-[0.98]",
            canProceed
              ? "text-white shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
          style={canProceed ? { backgroundColor: "var(--brand)" } : undefined}
        >
          {colIndex < COLUMNS.length - 1 ? (
            <>
              Siguiente
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </>
          ) : (
            <>
              Ver mi cédula
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Feedback Panel ───────────────────────────────────────────────────────────

function FeedbackPanel({
  analysis,
  col,
}: {
  analysis: ColumnAnalysis;
  col: (typeof COLUMNS)[0];
}) {
  const meta = RESULT_META[analysis.result];
  const Icon = meta.Icon;

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 transition-all duration-300",
        meta.banner,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn("w-4 h-4 flex-shrink-0 mt-0.5", meta.text)}
          strokeWidth={2}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn("text-xs font-bold", meta.text)}>
              {meta.label}
            </span>
            {analysis.submessage && (
              <span className="text-xs text-muted-foreground">
                {analysis.submessage}
              </span>
            )}
          </div>

          {analysis.hint && (
            <p className="text-[11px] text-muted-foreground leading-snug mt-1.5">
              {analysis.hint}
            </p>
          )}

          {col.type !== "presidente" &&
            analysis.result === "valid" &&
            analysis.preferentialStatus && (
              <span
                className={cn(
                  "inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  analysis.preferentialStatus === "written"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {analysis.preferentialStatus === "written"
                  ? "Con preferencial"
                  : "Sin preferencial"}
              </span>
            )}
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ col }: { col: (typeof COLUMNS)[0] }) {
  const hint =
    col.type === "presidente"
      ? "Marca el logo o la foto del candidato con aspa (✗) o cruz (+)."
      : col.type === "senador_nacional"
        ? "Marca el logo. Opcionalmente escribe el número de candidato en cada recuadro."
        : col.prefBoxCount > 0
          ? "Marca el logo. Opcionalmente escribe el número del candidato."
          : "Marca el logo del partido con aspa (✗) o cruz (+).";

  return (
    <div className="flex items-start gap-2.5 px-1 py-2">
      <Minus
        className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0 mt-0.5"
        strokeWidth={2}
      />
      <p className="text-[11px] text-muted-foreground/50 leading-snug">
        {hint}
      </p>
    </div>
  );
}

// ─── Result Summary ───────────────────────────────────────────────────────────

function ResultSummary({
  allAnalyses,
  onRestart,
}: {
  allAnalyses: Record<number, ColumnAnalysis>;
  onRestart: () => void;
}) {
  const results = COLUMNS.map(
    (_, i) => allAnalyses[i]?.result ?? "blank",
  ) as VoteResult[];
  const counts = { valid: 0, null: 0, blank: 0, viciado: 0 };
  results.forEach((r) => counts[r]++);
  const allValid = counts.valid === COLUMNS.length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          {allValid ? (
            <Trophy className="w-5 h-5 text-amber-500" strokeWidth={2} />
          ) : (
            <CheckCircle2
              className="w-5 h-5 text-muted-foreground"
              strokeWidth={2}
            />
          )}
          <h2 className="text-xl font-bold text-foreground">
            {allValid ? "¡Cédula perfecta!" : "Resumen de tu cédula"}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Así quedaría registrada tu votación.
        </p>
      </div>

      {/* Column rows */}
      <div className="flex flex-col gap-1.5">
        {COLUMNS.map((col, i) => {
          const r = results[i];
          const meta = RESULT_META[r];
          const Icon = meta.Icon;
          const a = allAnalyses[i];
          return (
            <div
              key={col.id}
              className="flex items-start gap-3 rounded-2xl px-4 py-3 bg-card"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
            >
              <Icon
                className={cn("w-4 h-4 flex-shrink-0 mt-0.5", meta.text)}
                strokeWidth={2}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      meta.text,
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {col.label}
                  </span>
                </div>
                {a?.submessage && (
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {a.submessage}
                  </p>
                )}
                {r === "valid" &&
                  a?.preferentialStatus === "written" &&
                  col.type !== "presidente" && (
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                      Con preferencial
                    </span>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5">
        {(Object.entries(counts) as [VoteResult, number][]).map(([r, n]) => {
          const meta = RESULT_META[r];
          const Icon = meta.Icon;
          return (
            <div
              key={r}
              className="rounded-2xl bg-card flex flex-col items-center justify-center py-3 gap-1"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
            >
              <Icon className={cn("w-3.5 h-3.5", meta.text)} strokeWidth={2} />
              <p className="text-[22px] font-black leading-none text-foreground">
                {n}
              </p>
              <p
                className={cn(
                  "text-[9px] font-bold tracking-wider uppercase",
                  meta.text,
                )}
              >
                {meta.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div
        className="rounded-2xl bg-card px-4 py-4"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
          <p className="text-xs font-semibold text-foreground">
            Para el día de la votación
          </p>
        </div>
        <div className="space-y-2">
          {[
            "Solo aspa (✗) o cruz (+) en el logo o foto del candidato.",
            "Los trazos deben cruzarse dentro del recuadro.",
            "Un solo partido por columna — marcar dos vicia el voto.",
            "Recuadros preferenciales: escribe el número, nunca una aspa.",
            "Cada columna es independiente — un nulo no afecta a las demás.",
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30 flex-shrink-0 mt-1.5" />
              <p className="text-xs text-muted-foreground leading-snug">{t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Restart */}
      <button
        onClick={onRestart}
        className="w-full h-11 rounded-xl text-white text-sm font-semibold
          flex items-center justify-center gap-2 shadow-sm
          active:scale-[0.98] transition-all duration-150"
        style={{ backgroundColor: "var(--brand)" }}
      >
        <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
        Volver a simular
      </button>
    </div>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export default function SimuladorView() {
  const [phase, setPhase] = useState<SimulatorPhase>("intro");
  const [mode, setMode] = useState<SimulatorMode>("libre");
  const [colIndex, setColIndex] = useState(0);
  const [allStrokes, setAllStrokes] = useState<Record<number, Point[][]>>({});
  const [allAnalyses, setAllAnalyses] = useState<
    Record<number, ColumnAnalysis>
  >({});

  const handleUpdate = useCallback(
    (strokes: Point[][], analysis: ColumnAnalysis) => {
      setAllStrokes((prev) => ({ ...prev, [colIndex]: strokes }));
      setAllAnalyses((prev) => ({ ...prev, [colIndex]: analysis }));
    },
    [colIndex],
  );

  const handleNext = useCallback(() => {
    if (colIndex < COLUMNS.length - 1) setColIndex((i) => i + 1);
    else setPhase("result");
  }, [colIndex]);

  const handleBack = useCallback(
    () => setColIndex((i) => Math.max(0, i - 1)),
    [],
  );

  const handleStart = useCallback((m: SimulatorMode) => {
    setMode(m);
    setPhase("voting");
  }, []);

  const handleRestart = useCallback(() => {
    setPhase("intro");
    setColIndex(0);
    setAllStrokes({});
    setAllAnalyses({});
  }, []);

  if (phase === "intro") return <IntroScreen onSelect={handleStart} />;
  if (phase === "result")
    return (
      <ResultSummary allAnalyses={allAnalyses} onRestart={handleRestart} />
    );

  return (
    <VotingScreen
      mode={mode}
      colIndex={colIndex}
      allStrokes={allStrokes}
      allAnalyses={allAnalyses}
      onUpdate={handleUpdate}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
