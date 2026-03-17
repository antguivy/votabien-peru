"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { Heart, HelpCircle, LucideIcon, Scale, Vote, Zap } from "lucide-react";
import {
  ReadinessTool,
  THRESHOLDS,
  useReadiness,
} from "@/store/readiness-store";

/* ─── Types ─────────────────────────────────────────────────── */
interface ElectoralProcess {
  election_date?: string;
}
interface HeroDualSplitProps {
  proceso_electoral: ElectoralProcess;
}

/* ─── Config ─────────────────────────────────────────────────── */
const TOOL_CONFIG: Record<
  ReadinessTool,
  {
    label: string;
    sublabel: string;
    detail: string;
    href: string;
    colorClass: string; // Tailwind arbitrary color for text/icon
    borderDone: string; // border color when done
    bgDone: string; // bg when done
    bgIcon: string; // icon bg
    glowClass: string; // progress bar color
    badge?: {
      text: string;
      colorClass: string;
      borderClass: string;
      bgClass: string;
      pulse?: boolean;
    };
    icon: LucideIcon;
  }
> = {
  match: {
    label: "Descubre tu candidato",
    sublabel: "Encuentra tu afinidad política",
    detail: "Test completado",
    href: "/match",
    colorClass: "text-blue-500",
    borderDone: "border-blue-500/40",
    bgDone: "bg-blue-500/10",
    bgIcon: "bg-blue-500/10 border border-blue-500/20",
    glowClass: "bg-blue-500",
    badge: {
      text: "ACTUALIZADO",
      colorClass: "text-blue-400",
      borderClass: "border-blue-500/50",
      bgClass: "bg-blue-500/10",
      pulse: true,
    },
    icon: Heart,
  },
  comparador: {
    label: "Comparador",
    sublabel: "Fórmulas presidenciales lado a lado",
    detail: "Comparación lista",
    href: "/comparador",
    colorClass: "text-violet-400",
    borderDone: "border-violet-500/40",
    bgDone: "bg-violet-500/10",
    bgIcon: "bg-violet-500/10 border border-violet-500/20",
    glowClass: "bg-violet-500",
    icon: Scale,
  },
  trivia: {
    label: "Trivia Electoral",
    sublabel: "Pon a prueba lo que sabes",
    detail: "Niveles superados",
    href: "/trivia",
    colorClass: "text-amber-400",
    borderDone: "border-amber-500/40",
    bgDone: "bg-amber-500/10",
    bgIcon: "bg-amber-500/10 border border-amber-500/20",
    glowClass: "bg-amber-500",
    badge: {
      text: "NUEVOS NIVELES",
      colorClass: "text-amber-400",
      borderClass: "border-amber-500/50",
      bgClass: "bg-amber-500/10",
      pulse: true,
    },
    icon: HelpCircle,
  },
  simulador: {
    label: "Simulador de Voto",
    sublabel: "Practica antes del día",
    detail: "Como en la cabina real",
    href: "/simulador",
    colorClass: "text-slate-400",
    borderDone: "border-slate-500/40",
    bgDone: "bg-slate-500/10",
    bgIcon: "bg-slate-500/10 border border-slate-500/20",
    glowClass: "bg-slate-500",
    badge: {
      text: "PRONTO",
      colorClass: "text-slate-400",
      borderClass: "border-slate-500/50",
      bgClass: "bg-slate-500/10",
    },
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
      className={[
        "group relative flex flex-col gap-3 p-4 md:p-5 rounded-2xl border transition-all duration-200",
        "hover:-translate-y-0.5 hover:scale-[1.015] active:scale-[0.97] overflow-hidden",
        "backdrop-blur-xl",
        done
          ? `${cfg.bgDone} ${cfg.borderDone}`
          : "bg-white/[0.07] border-white/[0.11]",
      ].join(" ")}
    >
      {/* Pulse border for active badges */}
      {cfg.badge?.pulse && !done && (
        <div
          className={[
            "absolute inset-0 rounded-2xl pointer-events-none animate-pulse",
            `shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,currentColor_60%,transparent),inset_0_0_14px_color-mix(in_srgb,currentColor_18%,transparent)]`,
            cfg.colorClass,
          ].join(" ")}
        />
      )}

      {/* Top accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-[3px] rounded-t-2xl ${cfg.glowClass}`}
      />

      {/* Icon + badge row */}
      <div className="flex items-center justify-between gap-2">
        <div
          className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${cfg.bgIcon}`}
        >
          <cfg.icon className={`size-4 md:size-[18px] ${cfg.colorClass}`} />
        </div>

        {done ? (
          <span
            className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.colorClass} ${cfg.bgDone}`}
          >
            <Zap size={8} fill="currentColor" />
            Listo
          </span>
        ) : cfg.badge ? (
          <span
            className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 leading-none ${cfg.badge.colorClass} ${cfg.badge.borderClass} ${cfg.badge.bgClass}`}
          >
            {cfg.badge.text}
          </span>
        ) : raw > 0 ? (
          <span className="text-[10px] font-bold tabular-nums flex-shrink-0 text-white/35">
            {raw}/{THRESHOLDS[tool]}
          </span>
        ) : null}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-black leading-tight tracking-tight text-sm md:text-[15px] ${done ? cfg.colorClass : "text-white/92"}`}
        >
          {cfg.label}
        </p>
        <p className="mt-1 text-xs md:text-[13px] leading-snug font-medium text-white/40">
          {done ? cfg.detail : cfg.sublabel}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] w-full rounded-full overflow-hidden bg-white/[0.07]">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.glowClass}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </Link>
  );
}

/* ─── Hero ───────────────────────────────────────────────────── */
export default function HeroDualSplit({
  proceso_electoral,
}: HeroDualSplitProps) {
  const { dias, fechaFormateada } = useCountdown(
    proceso_electoral.election_date,
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { raw, progress, isReady, completedCount, isFullyReady } =
    useReadiness();
  const safeCount = mounted ? completedCount : 0;
  const allDone = mounted && isFullyReady;

  return (
    <section className="relative w-full overflow-hidden bg-[#060606]">
      {/* Background split images */}
      <div className="absolute inset-0 flex">
        <div className="relative w-1/2 overflow-hidden">
          <Image
            src="/images/hero-left.jpg"
            alt=""
            fill
            className="object-cover object-center brightness-[0.18] scale-[1.06]"
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
            className="object-cover object-center brightness-[0.18] scale-[1.06]"
            priority
            sizes="50vw"
          />
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-l from-transparent to-[#060606]" />
        </div>
      </div>

      {/* Top vignette */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#060606cc] to-transparent pointer-events-none" />

      {/* Brand glow arc */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,oklch(0.4936_0.165_28.53/0.22)_0%,transparent_60%)]" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 md:px-8 min-h-[calc(100svh-64px)] pt-14 pb-10 gap-0">
        {/* Date + countdown pill */}
        <div className="inline-flex items-center gap-3 mb-5 md:mb-6 px-4 py-2 rounded-full bg-white/5 border border-white/[0.09]">
          {fechaFormateada && (
            <span className="font-bold uppercase text-white/40 tracking-[0.22em] text-[10px] md:text-[11px]">
              12 · Abril · 2026
            </span>
          )}
          <div className="w-px h-3.5 bg-white/20 flex-shrink-0" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-brand font-black tabular-nums text-2xl md:text-4xl leading-none tracking-tight [text-shadow:0_0_32px_oklch(0.4936_0.165_28.53/0.6)]">
              {mounted ? (
                <AnimatedNumber value={dias} />
              ) : (
                <span className="opacity-20">—</span>
              )}
            </span>
            <span className="font-black uppercase text-white/30 text-[9px] md:text-[10px] tracking-[0.3em]">
              días
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-black text-white leading-none tracking-tight mb-3 md:mb-4 max-w-xs md:max-w-4xl [text-shadow:0_2px_4px_rgba(0,0,0,0.95),0_8px_32px_rgba(0,0,0,0.5)] text-[2.4rem] md:text-[5rem] lg:text-[6.5rem]">
          Infórmate,{" "}
          <span className="text-brand [text-shadow:0_0_56px_oklch(0.4936_0.165_28.53/0.65),0_2px_4px_rgba(0,0,0,0.95)]">
            tu voto importa
          </span>
        </h1>

        {/* Subline */}
        <p className="font-medium text-white/45 leading-relaxed mb-7 md:mb-9 max-w-[260px] md:max-w-md text-xs md:text-sm lg:text-base">
          Elecciones Generales Perú 2026 · Usa las 4 herramientas y vota con
          confianza.
        </p>

        {/* ── Tool cards ── */}
        <div className="w-full max-w-xl md:max-w-5xl">
          {/* Label row */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <div className="flex items-center gap-2.5">
              <span className="font-black uppercase text-white/28 tracking-[0.28em] text-[9px] md:text-[10px]">
                {allDone
                  ? "🇵🇪 ¡Estás listo para votar!"
                  : "Herramientas interactivas"}
              </span>
              {safeCount > 0 && !allDone && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-brand bg-[oklch(0.4936_0.165_28.53/0.15)]">
                  {safeCount}/4
                </span>
              )}
            </div>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* 2×2 on mobile → 4 cols on md+ */}
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
