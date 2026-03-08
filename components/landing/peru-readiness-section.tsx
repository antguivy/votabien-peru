"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Zap, CircleDashed } from "lucide-react";
import {
  ReadinessTool,
  THRESHOLDS,
  useReadiness,
} from "@/store/readiness-store";

const TOOL_CONFIG: Record<
  ReadinessTool,
  {
    label: string;
    sublabel: string;
    href: string;
    color: string;
    unit: string;
  }
> = {
  match: {
    // ← alineado con el store
    label: "Mi Candidato",
    sublabel: "Descubre tu candidato ideal",
    href: "/match",
    color: "#2563eb",
    unit: "búsquedas",
  },
  comparador: {
    label: "Comparador",
    sublabel: "Analiza diferencias entre fórmulas presidenciales",
    href: "/comparador",
    color: "#7c3aed",
    unit: "comparaciones",
  },
  trivia: {
    label: "Trivia Electoral",
    sublabel: "Conoce propuestas, historia, polémico, corrupción",
    href: "/trivia",
    color: "#d97706",
    unit: "regiones",
  },
  simulador: {
    label: "Simulador de Voto",
    sublabel: "Practica antes del día de votación",
    href: "/simulador",
    color: "#059669",
    unit: "simulaciones",
  },
};

const TOOLS: ReadinessTool[] = ["match", "comparador", "trivia", "simulador"];

function ToolRow({
  tool,
  raw,
  pct,
  done,
  mounted,
}: {
  tool: ReadinessTool;
  raw: number;
  pct: number;
  done: boolean;
  mounted: boolean;
}) {
  const cfg = TOOL_CONFIG[tool];
  const max = THRESHOLDS[tool];
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(mounted ? pct : 0), 100);
    return () => clearTimeout(t);
  }, [pct, mounted]);

  return (
    <Link
      href={cfg.href}
      className="group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:shadow-sm active:scale-[0.99]"
      style={
        done
          ? { backgroundColor: `${cfg.color}0d`, borderColor: `${cfg.color}40` }
          : {
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }
      }
    >
      {/* Color accent bar */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: done ? cfg.color : "var(--color-border)" }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p
            className="text-sm font-bold"
            style={{ color: done ? cfg.color : "var(--color-foreground)" }}
          >
            {cfg.label}
          </p>

          {done ? (
            <span
              className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
            >
              <Zap size={9} fill="currentColor" /> Completado
            </span>
          ) : raw > 0 ? (
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
              {raw} / {max} {cfg.unit}
            </span>
          ) : (
            <ArrowRight
              size={14}
              className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>

        {/* Progress track */}
        <div
          className="h-1.5 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--color-muted)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${width}%`,
              backgroundColor: cfg.color,
              boxShadow: done ? `0 0 6px ${cfg.color}55` : undefined,
            }}
          />
        </div>

        {!done && raw === 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">{cfg.sublabel}</p>
        )}
      </div>
    </Link>
  );
}

function ProgressRing({ count, mounted }: { count: number; mounted: boolean }) {
  const safeCount = mounted ? count : 0;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = circ * (safeCount / 4);
  const isComplete = safeCount === 4;

  return (
    <div className="relative flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={isComplete ? "#f59e0b" : "var(--color-primary)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          style={{
            transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[13px] font-black"
          style={{ color: isComplete ? "#f59e0b" : "var(--color-foreground)" }}
        >
          {safeCount}/4
        </span>
      </div>
    </div>
  );
}

export default function PeruReadinessSection() {
  const { raw, progress, isReady, completedCount, isFullyReady } =
    useReadiness();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeCount = mounted ? completedCount : 0;

  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <ProgressRing count={safeCount} mounted={mounted} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
              Elecciones Perú 2026
            </p>
            <h2 className="text-xl font-black text-foreground leading-tight">
              {mounted && isFullyReady
                ? "¡Listo para votar!"
                : safeCount > 0
                  ? "Sigue preparándote"
                  : "¿Qué tan listo estás para votar?"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {safeCount === 0
                ? "Completa las 4 herramientas para tomar la mejor decisión"
                : `${safeCount} de 4 herramientas completadas`}
            </p>
          </div>
        </div>

        {/* Tool rows */}
        <div className="flex flex-col gap-2">
          {TOOLS.map((tool) => (
            <ToolRow
              key={tool}
              tool={tool}
              raw={mounted ? raw[tool] : 0}
              pct={mounted ? progress[tool] : 0}
              done={mounted ? isReady(tool) : false}
              mounted={mounted}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
