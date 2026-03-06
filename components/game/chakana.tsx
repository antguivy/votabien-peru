"use client";

// components/game/Chakana.tsx
// La Chakana (Cruz Andina) como indicador de preparación electoral.
// 4 brazos = 4 herramientas: match, trivia, comparador, simulador.
// Cada brazo se ilumina cuando el usuario completa esa herramienta.
// Sin auth — progreso en localStorage vía useReadiness.

import { ReadinessState, ReadinessTool } from "@/hooks/use-readiness";
import { CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

// ── Geometría de la Chakana ────────────────────────────────────────────────
// viewBox 260×260, center (130,130), arm width 60px, step 20px
const CHAKANA_OUTLINE =
  "M 100,20 L 160,20 L 160,80 L 180,80 L 180,100 " +
  "L 240,100 L 240,160 L 180,160 L 180,180 L 160,180 " +
  "L 160,240 L 100,240 L 100,180 L 80,180 L 80,160 " +
  "L 20,160 L 20,100 L 80,100 L 80,80 L 100,80 Z";

// Center circle hole (evenodd creates a void at center)
const CENTER_HOLE = "M 152,130 A 22,22 0 0,0 108,130 A 22,22 0 0,0 152,130 Z";

const FULL_PATH = CHAKANA_OUTLINE + " " + CENTER_HOLE;

// ── 4 arm clip regions (diagonal quadrant division, center 130,130) ────────
// Each is a polygon that covers one quadrant of the 260×260 canvas.
// The path is clipped to only render within that quadrant.
const ARM_CLIPS: Record<ReadinessTool, string> = {
  trivia: "130,130 0,0 260,0", // top
  comparador: "130,130 260,0 260,260", // right
  simulador: "130,130 260,260 0,260", // bottom
  match: "130,130 0,260 0,0", // left
};

// ── Colors & metadata ──────────────────────────────────────────────────────
const ARM_CONFIG: Record<
  ReadinessTool,
  {
    color: string;
    glow: string;
    label: string;
    sublabel: string;
    href: string;
    position: string;
  }
> = {
  trivia: {
    color: "#d97706",
    glow: "rgba(217,119,6,0.55)",
    label: "Trivia",
    sublabel: "Conoce las propuestas",
    href: "/trivia",
    position: "top",
  },
  comparador: {
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.55)",
    label: "Comparador",
    sublabel: "Analiza diferencias",
    href: "/comparador",
    position: "right",
  },
  simulador: {
    color: "#059669",
    glow: "rgba(5,150,105,0.55)",
    label: "Simulador",
    sublabel: "Practica tu voto",
    href: "/simulador",
    position: "bottom",
  },
  match: {
    color: "#2563eb",
    glow: "rgba(37,99,235,0.55)",
    label: "Match",
    sublabel: "Descubre tu candidato",
    href: "/match",
    position: "left",
  },
};

const TOOLS_ORDER: ReadinessTool[] = [
  "trivia",
  "comparador",
  "simulador",
  "match",
];

// ── Component ──────────────────────────────────────────────────────────────

interface ChakanaProps {
  readiness: ReadinessState;
  completedCount: number;
  isFullyReady: boolean;
  percentReady: number;
  /** compact = small floating widget; full = large featured view */
  variant?: "compact" | "full";
}

export function Chakana({
  readiness,
  completedCount,
  isFullyReady,
  percentReady,
  variant = "full",
}: ChakanaProps) {
  const isCompact = variant === "compact";
  const svgSize = isCompact ? 80 : 180;

  return (
    <div
      className={`flex flex-col items-center ${isCompact ? "gap-1" : "gap-4"}`}
    >
      {/* ── SVG Chakana ── */}
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          viewBox="0 0 260 260"
          width={svgSize}
          height={svgSize}
          className={isFullyReady ? "chakana-glow" : ""}
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* One clipPath per arm */}
            {TOOLS_ORDER.map((tool) => (
              <clipPath key={tool} id={`chakana-clip-${tool}`}>
                <polygon points={ARM_CLIPS[tool]} />
              </clipPath>
            ))}

            {/* Radial gradient for the "all done" gold center */}
            <radialGradient id="chakanaGoldGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>

            {/* Filter for active arm glow */}
            {TOOLS_ORDER.map((tool) => (
              <filter
                key={tool}
                id={`glow-${tool}`}
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* ── Base layer: inactive grey Chakana ── */}
          <path
            d={FULL_PATH}
            fill={isFullyReady ? "url(#chakanaGoldGrad)" : "#e2e8f0"}
            fillRule="evenodd"
            opacity={0.35}
          />

          {/* ── Active arm layers (one per tool) ── */}
          {TOOLS_ORDER.map((tool) => {
            const active = readiness[tool];
            const cfg = ARM_CONFIG[tool];
            if (!active) return null;

            return (
              <g key={tool} clipPath={`url(#chakana-clip-${tool})`}>
                {/* Glow behind */}
                <path
                  d={FULL_PATH}
                  fill={cfg.color}
                  fillRule="evenodd"
                  opacity={0.25}
                  filter={`url(#glow-${tool})`}
                />
                {/* Solid arm */}
                <path
                  d={FULL_PATH}
                  fill={cfg.color}
                  fillRule="evenodd"
                  opacity={0.92}
                />
              </g>
            );
          })}

          {/* ── Outline stroke ── */}
          <path
            d={CHAKANA_OUTLINE}
            fill="none"
            stroke={isFullyReady ? "#f59e0b" : "#94a3b8"}
            strokeWidth={isFullyReady ? "3" : "1.5"}
            opacity={isFullyReady ? 0.9 : 0.5}
          />

          {/* ── Center circle (always visible) ── */}
          <circle
            cx="130"
            cy="130"
            r="18"
            fill={isFullyReady ? "#fbbf24" : "#f1f5f9"}
            stroke={isFullyReady ? "#d97706" : "#cbd5e1"}
            strokeWidth="2"
          />

          {/* Center content */}
          {isFullyReady ? (
            <text
              x="130"
              y="136"
              textAnchor="middle"
              fontSize="18"
              style={{ userSelect: "none" }}
            >
              🇵🇪
            </text>
          ) : (
            <text
              x="130"
              y="136"
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#64748b"
              style={{ userSelect: "none" }}
            >
              {percentReady}%
            </text>
          )}
        </svg>

        {/* ── Pulse ring when fully ready ── */}
        {isFullyReady && (
          <div
            className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-30 pointer-events-none"
            style={{ borderRadius: "50%" }}
          />
        )}
      </div>

      {/* ── Full variant: title + tool list ── */}
      {!isCompact && (
        <>
          <div className="text-center">
            <p className="font-black text-lg text-foreground leading-tight">
              {isFullyReady
                ? "¡Listo para votar! 🇵🇪"
                : `${completedCount} de 4 herramientas`}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {isFullyReady
                ? "Eres un votante consciente"
                : "Completa las herramientas para prepararte"}
            </p>
          </div>

          {/* Tool checklist */}
          <div className="w-full max-w-xs flex flex-col gap-2">
            {TOOLS_ORDER.map((tool) => {
              const cfg = ARM_CONFIG[tool];
              const done = readiness[tool];
              return (
                <Link
                  key={tool}
                  href={cfg.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all group ${
                    done
                      ? "bg-opacity-10 border-opacity-30"
                      : "bg-muted/40 border-border hover:border-primary/30"
                  }`}
                  style={
                    done
                      ? {
                          backgroundColor: `${cfg.color}14`,
                          borderColor: `${cfg.color}40`,
                        }
                      : {}
                  }
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: done ? cfg.color : "#cbd5e1" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: done ? cfg.color : undefined }}
                    >
                      {cfg.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cfg.sublabel}
                    </p>
                  </div>
                  {done ? (
                    <CheckCircle
                      size={16}
                      style={{ color: cfg.color }}
                      className="flex-shrink-0"
                    />
                  ) : (
                    <ExternalLink
                      size={14}
                      className="text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* ── Compact variant: just the % label ── */}
      {isCompact && (
        <p className="text-xs font-bold text-muted-foreground">
          {isFullyReady ? "¡Listo! 🇵🇪" : `${completedCount}/4`}
        </p>
      )}
    </div>
  );
}
