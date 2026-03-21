"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Heart,
  HelpCircle,
  LucideIcon,
  Scale,
  Vote,
  ArrowRight,
} from "lucide-react";
import {
  ReadinessTool,
  THRESHOLDS,
  useReadiness,
} from "@/store/readiness-store";

/* ─── Types ───────────────────────────────────────────────────── */
interface ElectoralProcess {
  election_date?: string;
}
interface HeroDualSplitProps {
  proceso_electoral: ElectoralProcess;
}

/* ─── Config ──────────────────────────────────────────────────── */
const TOOL_CONFIG: Record<
  ReadinessTool,
  {
    label: string;
    sublabel: string;
    href: string;
    color: string; // single oklch/hex for dot + progress
    badge?: string; // etiqueta simple, sin stacking
    icon: LucideIcon;
  }
> = {
  match: {
    label: "Encuentra tu candidato",
    sublabel: "Test de afinidad política",
    href: "/match",
    color: "oklch(0.6 0.18 250)", // azul
    badge: "NUEVAS PREGUNTAS",
    icon: Heart,
  },
  comparador: {
    label: "Comparador",
    sublabel: "Fórmulas presidenciales",
    href: "/comparador",
    color: "oklch(0.62 0.18 290)", // violeta
    badge: "PRUEBA",
    icon: Scale,
  },
  trivia: {
    label: "Trivia Electoral",
    sublabel: "Pon a prueba lo que sabes",
    href: "/trivia",
    color: "oklch(0.75 0.16 75)", // ámbar
    badge: "SUBE DE NIVEL",
    icon: HelpCircle,
  },
  simulador: {
    label: "Simulador de Voto",
    sublabel: "Practica antes del día",
    href: "/simulador",
    color: "oklch(0.65 0.15 145)", // slate
    badge: "ESTÁ DISPONIBLE!",
    icon: Vote,
  },
};

const TOOLS: ReadinessTool[] = ["match", "comparador", "trivia", "simulador"];

/* ─── Helpers ────────────────────────────────────────────────── */
function calcDias(fecha: string) {
  return Math.ceil(
    (new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

function useCountdown(fechaElecciones?: string) {
  const [dias, setDias] = useState(() =>
    fechaElecciones ? calcDias(fechaElecciones) : 0,
  );
  useEffect(() => {
    if (!fechaElecciones) return;
    const t = setInterval(
      () => setDias(calcDias(fechaElecciones)),
      1000 * 60 * 60,
    );
    return () => clearInterval(t);
  }, [fechaElecciones]);
  const fechaFormateada = useMemo(
    () =>
      fechaElecciones
        ? new Date(fechaElecciones).toLocaleDateString("es-PE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "",
    [fechaElecciones],
  );
  return { dias, fechaFormateada };
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    if (value === 0) return;
    const start = prevRef.current;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / 1400, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setDisplayed(Math.round(start + (value - start) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prevRef.current = value;
  }, [value]);
  return <>{displayed}</>;
}

/* ─── Tool Card ──────────────────────────────────────────────── */
function HeroToolCard({
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
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(mounted ? pct : 0), 180);
    return () => clearTimeout(t);
  }, [pct, mounted]);

  return (
    <Link
      href={cfg.href}
      style={{ "--tool-color": cfg.color } as React.CSSProperties}
      className="group relative flex flex-col gap-4 p-4 md:p-5 rounded-2xl border border-white/[0.1] bg-[#141414] transition-all duration-200 hover:bg-[#1c1c1c] hover:-translate-y-0.5 active:scale-[0.97] overflow-hidden"
    >
      {/* Ícono + badge — solo uno a la vez */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{
            background: `color-mix(in oklch, var(--tool-color) 15%, transparent)`,
          }}
        >
          <cfg.icon className="size-[18px]" style={{ color: cfg.color }} />
        </div>

        {/* Prioridad: done > badge > progreso numérico */}
        {done ? (
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{
              color: cfg.color,
              background: `color-mix(in oklch, var(--tool-color) 12%, transparent)`,
            }}
          >
            Listo ✓
          </span>
        ) : cfg.badge ? (
          <span
            className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border leading-none"
            style={{
              color: cfg.color,
              borderColor: `color-mix(in oklch, var(--tool-color) 40%, transparent)`,
              background: `color-mix(in oklch, var(--tool-color) 8%, transparent)`,
            }}
          >
            {cfg.badge}
          </span>
        ) : raw > 0 ? (
          <span className="text-[10px] font-bold tabular-nums text-white/30">
            {raw}/{THRESHOLDS[tool]}
          </span>
        ) : null}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p
          className="font-bold leading-tight text-sm md:text-[15px]"
          style={{ color: done ? cfg.color : "rgba(255,255,255,0.92)" }}
        >
          {cfg.label}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-white/50">
          {cfg.sublabel}
        </p>
      </div>

      {/* Barra de progreso — la única señal de avance */}
      <div className="h-[2px] w-full rounded-full overflow-hidden bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${barWidth}%`,
            background: cfg.color,
          }}
        />
      </div>

      {/* Arrow en hover — reemplaza los múltiples estados visuales */}
      <ArrowRight className="absolute bottom-4 right-4 size-3.5 text-white/0 group-hover:text-white/30 transition-all duration-200 translate-x-1 group-hover:translate-x-0" />
    </Link>
  );
}

/* ─── Hero ────────────────────────────────────────────────────── */
export default function HeroDualSplit({
  proceso_electoral,
}: HeroDualSplitProps) {
  const { dias } = useCountdown(proceso_electoral.election_date);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { raw, progress, isReady, completedCount, isFullyReady } =
    useReadiness();
  const safeCount = mounted ? completedCount : 0;
  const allDone = mounted && isFullyReady;

  return (
    <section className="relative w-full overflow-hidden bg-[#060606]">
      {/* Imágenes de fondo */}
      <div className="absolute inset-0 flex">
        <div className="relative w-1/2 overflow-hidden">
          <Image
            src="/images/hero-left.jpg"
            alt=""
            fill
            className="object-cover brightness-[0.18] scale-[1.06]"
            priority
            sizes="50vw"
          />
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-r from-transparent to-[#060606]" />
        </div>
        <div className="relative w-1/2 overflow-hidden">
          <Image
            src="/images/hero-right.jpg"
            alt=""
            fill
            className="object-cover brightness-[0.18] scale-[1.06]"
            priority
            sizes="50vw"
          />
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-l from-transparent to-[#060606]" />
        </div>
      </div>

      {/* Vignette top */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#060606cc] to-transparent pointer-events-none" />

      {/* Brand glow — más sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,oklch(0.4936_0.165_28.53/0.16)_0%,transparent_65%)]" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 md:px-8 min-h-[calc(100svh-64px)] pt-14 pb-10 gap-0">
        {/* Countdown pill */}
        <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-white/5 border border-white/[0.08]">
          <span className="font-bold uppercase text-white/35 tracking-[0.22em] text-[10px] md:text-[11px]">
            12 · Abril · 2026
          </span>
          <div className="w-px h-3.5 bg-white/15 shrink-0" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-brand font-black tabular-nums text-2xl md:text-4xl leading-none [text-shadow:0_0_32px_oklch(0.4936_0.165_28.53/0.5)]">
              {mounted ? (
                <AnimatedNumber value={dias} />
              ) : (
                <span className="opacity-20">—</span>
              )}
            </span>
            <span className="font-black uppercase text-white/25 text-[9px] md:text-[10px] tracking-[0.3em]">
              días
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-black text-white leading-none tracking-tight mb-3 md:mb-4 max-w-xs md:max-w-4xl [text-shadow:0_2px_4px_rgba(0,0,0,0.95),0_8px_32px_rgba(0,0,0,0.5)] text-[2.4rem] md:text-[5rem] lg:text-[6.5rem]">
          Infórmate,{" "}
          <span className="text-brand [text-shadow:0_0_56px_oklch(0.4936_0.165_28.53/0.55),0_2px_4px_rgba(0,0,0,0.95)]">
            tu voto importa
          </span>
        </h1>

        {/* Subline */}
        <p className="font-medium text-white/40 leading-relaxed mb-8 max-w-[260px] md:max-w-md text-xs md:text-sm">
          Elecciones Generales Perú 2026 · Cuatro herramientas para votar con
          confianza.
        </p>

        {/* Tool cards */}
        <div className="w-full max-w-xl md:max-w-5xl">
          {/* Label */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <div className="flex items-center gap-2">
              <span className="font-black uppercase text-white/25 tracking-[0.28em] text-[9px] md:text-[10px]">
                {allDone ? "🇵🇪 Estás listo para votar" : "Herramientas"}
              </span>
              {safeCount > 0 && !allDone && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-brand bg-[oklch(0.4936_0.165_28.53/0.12)]">
                  {safeCount}/4
                </span>
              )}
            </div>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
            {TOOLS.map((tool) => (
              <HeroToolCard
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
      </div>
    </section>
  );
}
