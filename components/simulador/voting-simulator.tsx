"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Point,
  ColumnAnalysis,
  SimulatorMode,
  SimulatorPhase,
} from "@/interfaces/simulator";
import { COLUMNS, CHALLENGES } from "@/constants/challenge";
import { BallotCanvasRef } from "@/components/simulador/ballot-canvas";

const BallotCanvas = dynamic(
  () => import("@/components/simulador/ballot-canvas"),
  { ssr: false },
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resultStyle(r: ColumnAnalysis["result"]) {
  return {
    blank: {
      bg: "bg-gray-100",
      border: "border-gray-300",
      text: "text-gray-600",
      label: "BLANCO",
      emoji: "⬜",
    },
    valid: {
      bg: "bg-green-50",
      border: "border-green-400",
      text: "text-green-800",
      label: "VÁLIDO",
      emoji: "✅",
    },
    null: {
      bg: "bg-red-50",
      border: "border-red-400",
      text: "text-red-800",
      label: "NULO",
      emoji: "❌",
    },
    viciado: {
      bg: "bg-orange-50",
      border: "border-orange-400",
      text: "text-orange-800",
      label: "VICIADO",
      emoji: "🚫",
    },
  }[r];
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onSelect }: { onSelect: (m: SimulatorMode) => void }) {
  return (
    <div
      className="flex flex-col min-h-full"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      {/* Header */}
      <div className="bg-[#c8102e] px-5 pt-8 pb-6 text-white flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl border border-white/20">
            🗳️
          </div>
          <div>
            <p
              className="text-[9px] tracking-[3px] font-bold opacity-70 uppercase"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              VOTABIENPERÚ
            </p>
            <p
              className="text-[10px] opacity-55"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Elecciones Generales 2026
            </p>
          </div>
        </div>
        <h1 className="text-[26px] font-bold leading-tight">
          Simulador de
          <br />
          Votación
        </h1>
        <p
          className="text-[12px] mt-2 opacity-80 leading-relaxed"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          Practica cómo marcar tu cédula antes del día de la elección. Tu dedo
          es el lapicero.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 bg-[#f5f3ef]">
        {/* How it works */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <p
            className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3"
            style={{ fontFamily: "Arial,sans-serif" }}
          >
            ¿Cómo funciona?
          </p>
          <div className="space-y-3">
            {[
              {
                icon: "✏️",
                text: "Dibuja con tu dedo en cualquier parte de la cédula, como en la vida real.",
              },
              {
                icon: "🔍",
                text: "El simulador analiza si tu marca es válida, nula, blanca o viciada.",
              },
              {
                icon: "📋",
                text: "Al final ves el resumen de tu cédula, columna por columna.",
              },
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <p
                  className="text-[13px] text-gray-600 leading-snug"
                  style={{ fontFamily: "Arial,sans-serif" }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Important notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <p
            className="text-[11px] font-bold text-amber-800 mb-1.5"
            style={{ fontFamily: "Arial,sans-serif" }}
          >
            ⚠️ Importante — esta es una herramienta educativa
          </p>
          <p
            className="text-[12px] text-amber-700 leading-relaxed"
            style={{ fontFamily: "Arial,sans-serif" }}
          >
            Los partidos mostrados son ficticios. No representan a ningún
            partido real de las elecciones 2026.
          </p>
        </div>

        {/* Mode selection */}
        <p
          className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3 px-0.5"
          style={{ fontFamily: "Arial,sans-serif" }}
        >
          Elige un modo
        </p>

        <button
          onClick={() => onSelect("libre")}
          className="w-full bg-white rounded-2xl border-2 border-[#003087] p-4 text-left mb-3 active:bg-blue-50 transition-colors shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">🗳️</span>
            <div>
              <p
                className="font-bold text-[#003087] text-base"
                style={{ fontFamily: "Georgia,serif" }}
              >
                Modo Libre
              </p>
              <p
                className="text-[12px] text-gray-500 mt-0.5 leading-snug"
                style={{ fontFamily: "Arial,sans-serif" }}
              >
                Vota en las 5 columnas como quieras. Experimenta libremente y ve
                el resultado.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect("retos")}
          className="w-full bg-white rounded-2xl border-2 border-[#c8102e] p-4 text-left active:bg-red-50 transition-colors shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <p
                className="font-bold text-[#c8102e] text-base"
                style={{ fontFamily: "Georgia,serif" }}
              >
                Modo Retos
              </p>
              <p
                className="text-[12px] text-gray-500 mt-0.5 leading-snug"
                style={{ fontFamily: "Arial,sans-serif" }}
              >
                5 retos guiados para aprender cada tipo de voto: válido, nulo,
                blanco y viciado.
              </p>
            </div>
          </div>
        </button>

        {/* Vote type legend */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p
            className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3"
            style={{ fontFamily: "Arial,sans-serif" }}
          >
            Tipos de voto
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["blank", "valid", "null", "viciado"] as const).map((r) => {
              const s = resultStyle(r);
              return (
                <div
                  key={r}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${s.bg} ${s.border}`}
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span
                    className={`text-[11px] font-bold ${s.text}`}
                    style={{ fontFamily: "Arial,sans-serif" }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-6" />
      </div>
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

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ fontFamily: "'Georgia',serif" }}
    >
      <div className="bg-[#003087] text-white px-5 pt-7 pb-5 flex-shrink-0">
        <p
          className="text-[9px] tracking-[3px] opacity-60 uppercase"
          style={{ fontFamily: "Arial,sans-serif" }}
        >
          Resultado final
        </p>
        <h2 className="text-[24px] font-bold leading-tight mt-1">Tu Cédula</h2>
        <p
          className="text-[12px] opacity-75 mt-1"
          style={{ fontFamily: "Arial,sans-serif" }}
        >
          Así quedaría registrada tu votación
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f5f3ef]">
        {/* Column results */}
        <div className="space-y-2 mb-5">
          {COLUMNS.map((col, i) => {
            const r = allAnalyses[i]?.result ?? "blank";
            const a = allAnalyses[i];
            const s = resultStyle(r);
            return (
              <div
                key={col.id}
                className={`rounded-2xl border-2 px-4 py-3 flex items-start gap-3 ${s.bg} ${s.border}`}
              >
                <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                <div className="flex-1">
                  <p
                    className={`text-[10px] font-black tracking-[2px] ${s.text}`}
                    style={{ fontFamily: "Arial,sans-serif" }}
                  >
                    {s.label}
                  </p>
                  {/* <p
                    className="text-[13px] font-bold text-gray-800"
                    style={{ fontFamily: "Georgia,serif" }}
                  >
                    {col.label}{" "}
                    {/* <span className="font-normal text-gray-500 text-[11px]">
                      {col.sublabel}
                    </span>
                  </p> 
                     */}
                  {a?.message && (
                    <p
                      className="text-[11px] text-gray-500 mt-0.5"
                      style={{ fontFamily: "Arial,sans-serif" }}
                    >
                      {a.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {(
            [
              ["valid", "Válidos"],
              ["null", "Nulos"],
              ["blank", "Blancos"],
              ["viciado", "Viciados"],
            ] as const
          ).map(([r, label]) => {
            const s = resultStyle(r);
            return (
              <div
                key={r}
                className={`rounded-2xl border-2 text-center py-3 ${s.bg} ${s.border}`}
              >
                <p className="text-[32px] font-bold leading-none">
                  {counts[r]}
                </p>
                <p
                  className={`text-[10px] font-black tracking-[1px] uppercase mt-1 ${s.text}`}
                  style={{ fontFamily: "Arial,sans-serif" }}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Rules reminder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <p className="font-bold text-[13px] text-gray-800 mb-2.5">
            💡 Para el día de la votación
          </p>
          {[
            "Solo aspa (✗) o cruz (+) son válidos",
            "El cruce de los trazos debe estar dentro del recuadro",
            "Solo un partido por columna — si marcas dos, queda viciado",
            "Cada columna se contabiliza de forma independiente",
            "Escribir en la cédula la anula",
          ].map((tip) => (
            <div key={tip} className="flex items-start gap-2 mb-1.5">
              <span className="text-green-600 font-bold text-[13px] flex-shrink-0">
                ·
              </span>
              <p
                className="text-[12px] text-gray-600 leading-snug"
                style={{ fontFamily: "Arial,sans-serif" }}
              >
                {tip}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl bg-[#c8102e] text-white font-bold text-[15px] shadow-md active:bg-red-700 transition-colors mb-4"
          style={{ fontFamily: "'Georgia',serif" }}
        >
          🔄 Volver a simular
        </button>
        <div className="h-2" />
      </div>
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

  const rs = analysis ? resultStyle(analysis.result) : resultStyle("blank");

  return (
    <div className="flex flex-col h-full">
      {/* ── Challenge banner ── */}
      {challenge && (
        <div
          className={[
            "px-4 py-3 flex-shrink-0 transition-colors",
            challengeDone ? "bg-green-700" : "bg-[#003087]",
          ].join(" ")}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-xl flex-shrink-0 mt-0.5">
              {challengeDone ? "✅" : challenge.emoji}
            </span>
            <div>
              <p
                className="text-[9px] font-bold text-white/60 tracking-[2px] uppercase"
                style={{ fontFamily: "Arial,sans-serif" }}
              >
                Reto {colIndex + 1} de {CHALLENGES.length}
              </p>
              <p
                className="text-white font-bold text-[13px]"
                style={{ fontFamily: "'Georgia',serif" }}
              >
                {challenge.title}
              </p>
              <p
                className="text-white/85 text-[11px] mt-0.5 leading-snug"
                style={{ fontFamily: "Arial,sans-serif" }}
              >
                {challengeDone
                  ? '¡Reto completado! Pulsa "Siguiente" para continuar.'
                  : challenge.instruction}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Column header ── */}
      <div className="bg-[#c8102e] flex-shrink-0 px-4 py-3 flex items-center justify-between">
        <div>
          <p
            className="text-white/60 text-[9px] tracking-[2px] font-bold uppercase"
            style={{ fontFamily: "Arial,sans-serif" }}
          >
            Columna {colIndex + 1} / {COLUMNS.length}
          </p>
          <p
            className="text-white font-bold text-[15px]"
            style={{ fontFamily: "'Georgia',serif" }}
          >
            {col.label}{" "}
            <span className="font-normal opacity-80 text-[12px]">
              {col.sublabel}
            </span>
          </p>
        </div>
        {/* Clear button */}
        <button
          onClick={() => canvasRef.current?.clear()}
          className="text-white/70 border border-white/30 rounded-xl px-3 py-1.5 text-[11px] font-bold active:bg-white/10"
          style={{ fontFamily: "Arial,sans-serif" }}
        >
          Borrar
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-red-200 flex-shrink-0">
        <div
          className="h-full bg-red-800 transition-all duration-500"
          style={{ width: `${((colIndex + 1) / COLUMNS.length) * 100}%` }}
        />
      </div>

      {/* ── Canvas area ── */}
      <div className="flex-1 overflow-y-auto bg-[#e8e5df]">
        <div className="p-3">
          {/* Shadow wrapper to make it look like a real ballot sheet */}
          <div
            className="rounded-sm overflow-hidden"
            style={{
              boxShadow:
                "0 2px 12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <BallotCanvas
              ref={canvasRef}
              col={col}
              savedStrokes={saved}
              onUpdate={onUpdate}
            />
          </div>

          {/* Tip for challenge */}
          {challenge && !challengeDone && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <span className="text-blue-500 flex-shrink-0 text-sm">💡</span>
              <p
                className="text-[11px] text-blue-800 leading-snug"
                style={{ fontFamily: "Arial,sans-serif" }}
              >
                {challenge.tip}
              </p>
            </div>
          )}

          {/* Result feedback */}
          {analysis && analysis.result !== "blank" && (
            <div
              className={`mt-3 rounded-xl border-2 px-3 py-2.5 flex items-start gap-2.5 ${rs.bg} ${rs.border}`}
            >
              <span className="text-xl flex-shrink-0">{rs.emoji}</span>
              <div>
                <p
                  className={`text-[11px] font-black tracking-[1px] ${rs.text}`}
                  style={{ fontFamily: "Arial,sans-serif" }}
                >
                  {rs.label}
                </p>
                <p className="text-[12px] text-gray-700 font-medium">
                  {analysis.message}
                </p>
                {analysis.submessage && (
                  <p
                    className="text-[11px] text-gray-500 mt-0.5"
                    style={{ fontFamily: "Arial,sans-serif" }}
                  >
                    {analysis.submessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preferential note */}
          {col.prefBoxCount && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-amber-800 font-bold">
                Voto Preferencial
              </p>
              <p
                className="text-[11px] text-amber-700 mt-0.5 leading-snug"
                style={{ fontFamily: "Arial,sans-serif" }}
              >
                En la cédula real puedes escribir hasta 2 números de candidatos
                del mismo partido que marcaste.
              </p>
            </div>
          )}
        </div>
        <div className="h-2" />
      </div>

      {/* ── Navigation footer ── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2.5">
        {colIndex > 0 && (
          <button
            onClick={onBack}
            className="py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-[13px] active:bg-gray-100 transition-colors"
            style={{ fontFamily: "'Georgia',serif" }}
          >
            ←
          </button>
        )}
        <button
          onClick={onNext}
          disabled={mode === "retos" && !challengeDone}
          className={[
            "flex-1 py-3 rounded-xl font-bold text-[14px] transition-all active:scale-95",
            mode === "retos" && !challengeDone
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#c8102e] text-white shadow-md active:bg-red-700",
          ].join(" ")}
          style={{ fontFamily: "'Georgia',serif" }}
        >
          {colIndex < COLUMNS.length - 1
            ? "Siguiente columna →"
            : "Ver mi cédula →"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export default function VotingSimulator() {
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
