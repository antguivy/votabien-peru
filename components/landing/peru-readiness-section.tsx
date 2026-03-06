"use client";

// components/home/peru-readiness-section.tsx
// Muestra el progreso del usuario en las 4 herramientas
// con barras de progreso horizontales animadas.

import { useReadiness, ReadinessTool, THRESHOLDS } from "@/hooks/use-readiness";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";

// ── Tool config ───────────────────────────────────────────────────────────
const TOOL_CONFIG: Record<
  ReadinessTool,
  {
    label: string;
    sublabel: string;
    href: string;
    color: string;
    region: string;
    unit: string; // what each count represents
  }
> = {
  match: {
    label: "Match",
    sublabel: "Descubre tu candidato ideal",
    href: "/match",
    color: "#2563eb",
    region: "Costa",
    unit: "búsquedas",
  },
  trivia: {
    label: "Trivia",
    sublabel: "Conoce propuestas y candidatos",
    href: "/trivia",
    color: "#d97706",
    region: "Sierra",
    unit: "niveles",
  },
  comparador: {
    label: "Comparador",
    sublabel: "Analiza diferencias entre partidos",
    href: "/comparador",
    color: "#7c3aed",
    region: "Selva",
    unit: "comparaciones",
  },
  simulador: {
    label: "Simulador",
    sublabel: "Practica tu voto",
    href: "/simulador",
    color: "#059669",
    region: "Lima",
    unit: "simulaciones",
  },
};

const TOOLS: ReadinessTool[] = ["match", "trivia", "comparador", "simulador"];

// ── Raw counter per tool ──────────────────────────────────────────────────
function getRawCount(
  tool: ReadinessTool,
  readiness: ReturnType<typeof useReadiness>["readiness"],
): number {
  switch (tool) {
    case "match":
      return readiness.matchInteractions;
    case "trivia":
      return readiness.triviaLevelsCompleted;
    case "comparador":
      return readiness.comparadorInteractions;
    case "simulador":
      return readiness.simuladorInteractions;
  }
}

// ── Progress bar ─────────────────────────────────────────────────────────
function ProgressBar({
  pct,
  color,
  done,
  animate,
}: {
  pct: number;
  color: string;
  done: boolean;
  animate: boolean;
}) {
  const [width, setWidth] = useState(0);

  // Animate in on mount
  useEffect(() => {
    if (!animate) {
      setWidth(pct);
      return;
    }
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct, animate]);

  return (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          boxShadow: done ? `0 0 8px ${color}66` : undefined,
        }}
      />
    </div>
  );
}

// ── Single tool row ───────────────────────────────────────────────────────
function ToolRow({
  tool,
  readiness,
  progress,
  mounted,
}: {
  tool: ReadinessTool;
  readiness: ReturnType<typeof useReadiness>["readiness"];
  progress: ReturnType<typeof useReadiness>["progress"];
  mounted: boolean;
}) {
  const cfg = TOOL_CONFIG[tool];
  const done = mounted ? readiness[tool] : false;
  const pct = mounted ? progress[tool] : 0;
  const raw = mounted ? getRawCount(tool, readiness) : 0;
  const max = THRESHOLDS[tool];
  const started = raw > 0;

  return (
    <Link
      href={cfg.href}
      className={`group flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all duration-200
        ${
          done
            ? "border-opacity-40"
            : "border-border bg-muted/30 hover:bg-muted/50 hover:border-border"
        }
      `}
      style={
        done
          ? {
              backgroundColor: `${cfg.color}0a`,
              borderColor: `${cfg.color}45`,
            }
          : {}
      }
    >
      {/* Top row: region tag + tool name + status */}
      <div className="flex items-center gap-3">
        {/* Region badge */}
        <span
          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: done ? `${cfg.color}18` : "#f1f5f9",
            color: done ? cfg.color : "#94a3b8",
          }}
        >
          {cfg.region}
        </span>

        {/* Name + sublabel */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold leading-none mb-0.5"
            style={{ color: done ? cfg.color : undefined }}
          >
            {cfg.label}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {cfg.sublabel}
          </p>
        </div>

        {/* Right: checkmark or arrow */}
        {done ? (
          <CheckCircle2
            size={20}
            className="flex-shrink-0"
            style={{ color: cfg.color }}
          />
        ) : (
          <ArrowRight
            size={15}
            className="flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>

      {/* Progress bar + counter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar
            pct={pct}
            color={cfg.color}
            done={done}
            animate={mounted}
          />
        </div>
        <span
          className="text-[10px] font-black tabular-nums flex-shrink-0 w-14 text-right"
          style={{ color: done ? cfg.color : "#94a3b8" }}
        >
          {done ? (
            <span className="flex items-center justify-end gap-0.5">
              <Zap size={9} fill="currentColor" />
              Listo
            </span>
          ) : started ? (
            `${raw} / ${max}`
          ) : (
            `0 / ${max}`
          )}
        </span>
      </div>
    </Link>
  );
}

// ── Overall progress ring (mini) ─────────────────────────────────────────
function ProgressRing({ count }: { count: number }) {
  const pct = count / 4;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="flex-shrink-0">
      {/* Track */}
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        className="text-muted"
      />
      {/* Fill */}
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke={count === 4 ? "#f59e0b" : "var(--color-primary)"}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      {/* Label */}
      <text
        x="30"
        y="35"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fill={count === 4 ? "#f59e0b" : "var(--color-foreground)"}
      >
        {count}/4
      </text>
    </svg>
  );
}

// ── Main section ──────────────────────────────────────────────────────────
export default function PeruReadinessSection() {
  const { readiness, progress, completedCount, isFullyReady } = useReadiness();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeCount = mounted ? completedCount : 0;
  const safeReady = mounted ? isFullyReady : false;

  // First uncompleted tool for CTA
  const nextTool = TOOLS.find((t) => mounted && !readiness[t]);
  const ctaHref = nextTool ? TOOL_CONFIG[nextTool].href : "/trivia";

  return (
    <section className="w-full py-16 px-4 bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-5 mb-8">
          <ProgressRing count={safeCount} />
          <div className="pt-1">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary
              text-[10px] font-black uppercase tracking-widest mb-2"
            >
              Elecciones 2026
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
              {safeReady
                ? "¡Estás listo para votar! 🇵🇪"
                : safeCount > 0
                  ? "Sigue preparándote"
                  : "¿Qué tan listo estás para votar?"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {safeReady
                ? "Completaste las 4 herramientas. Eres un votante consciente."
                : "Usa las 4 herramientas para tomar la mejor decisión."}
            </p>
          </div>
        </div>

        {/* Tool rows */}
        <div className="flex flex-col gap-3">
          {TOOLS.map((tool) => (
            <ToolRow
              key={tool}
              tool={tool}
              readiness={readiness}
              progress={progress}
              mounted={mounted}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
