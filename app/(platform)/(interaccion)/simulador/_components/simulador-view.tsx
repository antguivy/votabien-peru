"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  PenLine,
  Target,
  CheckCircle2,
  XCircle,
  Square,
  AlertTriangle,
  Info,
  Lightbulb,
  Trophy,
  ArrowRight,
  Circle,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Point,
  ColumnAnalysis,
  SimulatorMode,
  SimulatorPhase,
} from "@/interfaces/simulator";
import { COLUMNS, PARTIES, CHALLENGES } from "@/constants/challenge";
import { BallotCanvasRef } from "@/components/simulador/ballot-canvas";

const BallotCanvas = dynamic(
  () => import("@/components/simulador/ballot-canvas"),
  { ssr: false },
);

// ─── Result meta ──────────────────────────────────────────────────────────────

type VoteResult = ColumnAnalysis["result"];

const RESULT_META: Record<
  VoteResult,
  { label: string; Icon: React.ElementType; colors: string; dot: string }
> = {
  blank: {
    label: "BLANCO",
    Icon: Square,
    colors: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  valid: {
    label: "VÁLIDO",
    Icon: CheckCircle2,
    colors:
      "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  null: {
    label: "NULO",
    Icon: XCircle,
    colors:
      "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    dot: "bg-red-500",
  },
  viciado: {
    label: "VICIADO",
    Icon: AlertTriangle,
    colors:
      "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500",
  },
};

// ─── Intro ────────────────────────────────────────────────────────────────────

function IntroScreen({ onSelect }: { onSelect: (m: SimulatorMode) => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Title area */}
      <div className="flex-shrink-0 px-1 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Simulador de Votación
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Practica cómo marcar tu cédula. Tu dedo es el lapicero.
        </p>
      </div>

      {/* Mode cards */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <button
          onClick={() => onSelect("libre")}
          className="group w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-card hover:border-primary/40 hover:bg-accent/40 transition-all duration-200 text-left active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
            <PenLine className="w-6 h-6 text-primary" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Modo Libre</p>
            <p className="text-sm text-muted-foreground leading-snug mt-0.5">
              Vota en las 5 columnas libremente y ve el resultado de tu cédula.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
        </button>

        <button
          onClick={() => onSelect("retos")}
          className="group w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-card hover:border-brand/40 hover:bg-accent/40 transition-all duration-200 text-left active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/15 transition-colors">
            <Target className="w-6 h-6 text-brand" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Modo Retos</p>
            <p className="text-sm text-muted-foreground leading-snug mt-0.5">
              5 retos para aprender cada tipo de voto paso a paso.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-brand transition-colors" />
        </button>
      </div>

      {/* Vote type legend */}
      <div className="mt-4 flex-shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
          Tipos de voto
        </p>
        <div className="grid grid-cols-2 gap-2">
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
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
                  meta.colors,
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                <span className="text-xs font-bold tracking-wide">
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules quick ref */}
      <div className="mt-4 flex-1 min-h-0 flex flex-col">
        <div className="rounded-2xl border border-border bg-card p-3 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reglas ONPE
            </p>
          </div>
          <div className="space-y-1.5">
            {[
              "Solo aspa (✗) o cruz (+) son marcas válidas",
              "El cruce de los trazos debe estar dentro del recuadro",
              "Solo un partido por columna — dos o más lo vician",
              "Escribir en la cédula la anula",
              "Cada columna se contabiliza de forma independiente",
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold text-xs mt-0.5 flex-shrink-0">
                  ·
                </span>
                <p className="text-xs text-muted-foreground leading-snug">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 text-center mt-3 flex-shrink-0 pb-1">
        Partidos ficticios · Solo uso educativo · Elecciones Generales 2026
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
  const results = COLUMNS.map((_, i) => allAnalyses[i]?.result ?? "blank");
  const counts = { valid: 0, null: 0, blank: 0, viciado: 0 };
  results.forEach((r) => counts[r]++);
  const allValid = counts.valid === COLUMNS.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 pb-4">
        <div className="flex items-center gap-2.5">
          {allValid ? (
            <Trophy className="w-5 h-5 text-emerald-500" strokeWidth={2} />
          ) : (
            <CheckCircle2
              className="w-5 h-5 text-muted-foreground"
              strokeWidth={2}
            />
          )}
          <h2 className="text-xl font-bold text-foreground">
            Resumen de tu Cédula
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Así quedaría registrada tu votación
        </p>
      </div>

      {/* Column results */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {COLUMNS.map((col, i) => {
          const r = results[i];
          const meta = RESULT_META[r];
          const Icon = meta.Icon;
          const a = allAnalyses[i];
          return (
            <div
              key={col.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-2.5",
                meta.colors,
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] font-black tracking-widest">
                    {meta.label}
                  </span>
                  <span className="text-xs font-semibold truncate opacity-80">
                    {col.label} · {col.sublabel}
                  </span>
                </div>
                {a?.submessage && (
                  <p className="text-[11px] opacity-70 leading-tight mt-0.5">
                    {a.submessage}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mt-3 flex-shrink-0">
        {(Object.entries(counts) as [VoteResult, number][]).map(([r, n]) => {
          const meta = RESULT_META[r];
          const Icon = meta.Icon;
          return (
            <div
              key={r}
              className={cn(
                "rounded-xl border text-center py-2.5 px-1",
                meta.colors,
              )}
            >
              <Icon className="w-4 h-4 mx-auto mb-1" strokeWidth={2} />
              <p className="text-xl font-black leading-none">{n}</p>
              <p className="text-[9px] font-bold tracking-wider mt-0.5 uppercase">
                {meta.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Key rule reminder */}
      <div className="mt-3 flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
            <p className="text-xs font-semibold text-foreground">
              Para el día de la votación
            </p>
          </div>
          <div className="space-y-1">
            {[
              "Solo aspa (✗) o cruz (+) — ningún otro símbolo",
              "El cruce debe estar dentro del recuadro",
              "Máximo un partido por columna",
              "Cada columna es independiente",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold text-xs mt-0.5 flex-shrink-0">
                  ·
                </span>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Restart */}
      <button
        onClick={onRestart}
        className="mt-3 flex-shrink-0 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
      >
        <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
        Volver a simular
      </button>
    </div>
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

  const challenge = mode === "retos" ? CHALLENGES[colIndex] : null;
  const challengeDone = challenge
    ? challenge.checkPassed(analysis ?? { result: "blank", message: "" })
    : true;

  const canProceed = mode === "libre" || challengeDone;

  const meta = analysis ? RESULT_META[analysis.result] : null;
  const ResultIcon = meta?.Icon;

  const [showTip, setShowTip] = useState(false);

  // Progress dots
  const dots = COLUMNS.map((_, i) => {
    const r = allAnalyses[i]?.result;
    const m = r ? RESULT_META[r] : null;
    return {
      done: i < colIndex,
      current: i === colIndex,
      result: r,
      dot: m?.dot,
    };
  });

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between pb-2 flex-shrink-0">
        {/* Column stepper */}
        <div className="flex items-center gap-1.5">
          {dots.map((d, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                d.current
                  ? "w-5 h-2 bg-primary"
                  : d.done && d.dot
                    ? `w-2 h-2 ${d.dot}`
                    : "w-2 h-2 bg-border",
              )}
            />
          ))}
          <span className="text-xs font-semibold text-muted-foreground ml-1">
            {col.label}
            {col.sublabel && (
              <span className="font-normal"> · {col.sublabel}</span>
            )}
          </span>
        </div>

        {/* Clear */}
        <button
          onClick={() => canvasRef.current?.clear()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors active:bg-muted"
        >
          <RotateCcw className="w-3 h-3" strokeWidth={2.5} />
          Borrar
        </button>
      </div>

      {/* ── Challenge banner ── */}
      {challenge && (
        <div
          className={cn(
            "flex-shrink-0 rounded-xl border px-3 py-2.5 flex items-start gap-2.5 mb-2 transition-colors duration-300",
            challengeDone
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
              : "bg-muted/50 border-border",
          )}
        >
          {challengeDone ? (
            <CheckCircle2
              className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />
          ) : (
            <Target
              className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-xs font-semibold",
                challengeDone
                  ? "text-emerald-800 dark:text-emerald-400"
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
              className="flex-shrink-0"
            >
              <Info
                className={cn(
                  "w-4 h-4 transition-colors",
                  showTip ? "text-primary" : "text-muted-foreground",
                )}
              />
            </button>
          )}
        </div>
      )}

      {/* Tip expand */}
      {showTip && challenge && !challengeDone && (
        <div className="flex-shrink-0 mb-2 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2.5 flex items-start gap-2">
          <Lightbulb
            className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"
            strokeWidth={2}
          />
          <p className="text-xs text-amber-800 dark:text-amber-400 leading-snug">
            {challenge.tip}
          </p>
        </div>
      )}

      {/* ── Ballot canvas ── */}
      <div
        className="flex-shrink-0 rounded-2xl overflow-hidden"
        style={{
          boxShadow: "0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        <BallotCanvas
          ref={canvasRef}
          columnIdx={colIndex}
          savedStrokes={saved}
          onUpdate={onUpdate}
        />
      </div>

      {/* ── Result feedback ── */}
      <div className="flex-shrink-0 mt-2 min-h-[52px]">
        {analysis && analysis.result !== "blank" && ResultIcon ? (
          <div
            className={cn(
              "rounded-xl border px-3 py-2.5 flex items-start gap-2.5",
              meta?.colors,
            )}
          >
            <ResultIcon
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-black tracking-widest">
                  {meta?.label}
                </span>
                <span className="text-xs font-medium opacity-80">
                  {analysis.message}
                </span>
              </div>
              {analysis.submessage && (
                <p className="text-[11px] opacity-65 leading-tight mt-0.5">
                  {analysis.submessage}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-1 py-2">
            <Circle
              className="w-3.5 h-3.5 text-muted-foreground/40"
              strokeWidth={1.5}
            />
            <p className="text-xs text-muted-foreground/60">
              {col.hasPreferential
                ? "Marca un partido · Puedes añadir voto preferencial"
                : "Dibuja dentro de uno de los recuadros"}
            </p>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-0" />

      {/* ── Nav footer ── */}
      <div className="flex-shrink-0 flex items-center gap-2 pt-2">
        {colIndex > 0 && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:scale-[0.97]"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]",
            canProceed
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {colIndex < COLUMNS.length - 1 ? (
            <>
              Siguiente <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </>
          ) : (
            <>
              Ver resultado <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
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
