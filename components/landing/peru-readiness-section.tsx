"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Heart,
  HelpCircle,
  LucideIcon,
  Scale,
  Vote,
  Zap,
} from "lucide-react";
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
    detail: string;
    href: string;
    color: string;
    icon: LucideIcon;
  }
> = {
  match: {
    label: "Mi Candidato",
    sublabel: "Descubre tu candidato ideal",
    detail: "Test de afinidad política",
    href: "/match",
    color: "#2563eb",
    icon: Heart,
  },
  comparador: {
    label: "Comparador",
    sublabel: "Analiza fórmulas presidenciales",
    detail: "Diferencias lado a lado",
    href: "/comparador",
    color: "#7c3aed",
    icon: Scale,
  },
  trivia: {
    label: "Trivia Electoral",
    sublabel: "Pon a prueba lo que sabes",
    detail: "Propuestas, polémicas y más",
    href: "/trivia",
    color: "#d97706",
    icon: HelpCircle,
  },
  simulador: {
    label: "Simulador de Voto",
    sublabel: "Practica antes del día",
    detail: "Como en la cabina real",
    href: "/simulador",
    color: "#059669",
    icon: Vote,
  },
};

const TOOLS: ReadinessTool[] = ["match", "comparador", "trivia", "simulador"];

// Ring SVG animado
function ProgressRing({ count, mounted }: { count: number; mounted: boolean }) {
  const safe = mounted ? count : 0;
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = circ * (safe / 4);
  const done = safe === 4;
  const color = done ? "#f59e0b" : "oklch(0.4936 0.165 28.53)";

  return (
    <div className="relative flex-shrink-0" style={{ width: 68, height: 68 }}>
      <svg
        width="68"
        height="68"
        viewBox="0 0 68 68"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="4"
        />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{
            transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 4px ${color}80)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-black text-base leading-none"
          style={{ color: done ? "#f59e0b" : "var(--foreground)" }}
        >
          {safe}
        </span>
        <span className="text-[8px] text-muted-foreground font-bold">/4</span>
      </div>
    </div>
  );
}

function ToolCard({
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
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(mounted ? pct : 0), 150);
    return () => clearTimeout(t);
  }, [pct, mounted]);

  return (
    <Link
      href={cfg.href}
      className="group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-px active:scale-[0.99] overflow-hidden"
      style={
        done
          ? { backgroundColor: `${cfg.color}0c`, borderColor: `${cfg.color}35` }
          : { borderColor: "var(--border)", backgroundColor: "var(--card)" }
      }
    >
      {/* left color bar */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full rounded-l-2xl"
        style={{ background: done ? cfg.color : "var(--border)" }}
      />

      {/* icon badge — icono pintado con su color, bg tono más bajo */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{
          background: `${cfg.color}10`,
          border: `1px solid ${cfg.color}20`,
        }}
      >
        <cfg.icon
          className="size-5"
          style={{
            color: cfg.color,
            filter: done ? `drop-shadow(0 0 5px ${cfg.color}70)` : undefined,
          }}
        />
      </div>

      {/* text + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p
            className="text-sm font-black leading-tight"
            style={{ color: done ? cfg.color : "var(--foreground)" }}
          >
            {cfg.label}
          </p>
          {done ? (
            <span
              className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
            >
              <Zap size={9} fill="currentColor" /> Listo
            </span>
          ) : raw > 0 ? (
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground flex-shrink-0">
              {raw}/{max}
            </span>
          ) : (
            <ArrowRight
              size={13}
              className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            />
          )}
        </div>

        <p className="text-muted-foreground text-[11px] mb-2 leading-tight">
          {done ? cfg.detail : cfg.sublabel}
        </p>

        {/* progress bar */}
        <div className="h-1 w-full rounded-full overflow-hidden bg-muted">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${barWidth}%`,
              background: cfg.color,
              boxShadow: done ? `0 0 8px ${cfg.color}55` : "none",
            }}
          />
        </div>
      </div>
    </Link>
  );
}

export default function PeruReadinessSection() {
  const { raw, progress, isReady, completedCount, isFullyReady } =
    useReadiness();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const safe = mounted ? completedCount : 0;
  const allDone = mounted && isFullyReady;

  return (
    <section className="w-full py-14 px-4">
      <div className="max-w-lg mx-auto">
        {/* header */}
        <div className="flex items-center gap-5 mb-8">
          <ProgressRing count={safe} mounted={mounted} />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight">
              {allDone
                ? "¡Estás listo para votar!"
                : safe > 0
                  ? "Sigue preparándote"
                  : "¿Qué tan listo estás?"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-tight">
              {safe === 0
                ? "Usa las 4 herramientas antes del 12 de abril"
                : safe < 4
                  ? `${4 - safe} ${4 - safe === 1 ? "herramienta" : "herramientas"} más para completar tu preparación`
                  : "Has usado todas las herramientas — vota con confianza"}
            </p>
          </div>
        </div>

        {/* grid de tarjetas */}
        <div className="flex flex-col gap-2.5">
          {TOOLS.map((tool) => (
            <ToolCard
              key={tool}
              tool={tool}
              raw={mounted ? raw[tool] : 0}
              pct={mounted ? progress[tool] : 0}
              done={mounted ? isReady(tool) : false}
              mounted={mounted}
            />
          ))}
        </div>

        {/* footer motivacional */}
        {!allDone && (
          <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
            Un voto informado es la mejor defensa contra la demagogia.
          </p>
        )}
        {allDone && (
          <div
            className="mt-6 p-4 rounded-2xl text-center"
            style={{
              background: "oklch(0.4936 0.165 28.53 / 0.08)",
              border: "1px solid oklch(0.4936 0.165 28.53 / 0.2)",
            }}
          >
            <p
              className="font-black text-sm"
              style={{ color: "oklch(0.4936 0.165 28.53)" }}
            >
              🇵🇪 Tu voto informado hace la diferencia
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
