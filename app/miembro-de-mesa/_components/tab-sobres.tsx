"use client";

import { SECURITY_ENVELOPES } from "../_lib/constants";
import { EnvelopeColor } from "../_lib/types";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Mail,
} from "lucide-react";

/* Guía de consulta: el miembro de mesa lee, no marca. Las tareas que se
   marcan viven en el Checklist. */

const ENVELOPE_ACCENT: Record<EnvelopeColor, { chip: string; border: string }> =
  {
    plomo: {
      chip: "bg-zinc-700 text-zinc-50 border-zinc-600",
      border: "border-zinc-400/40 dark:border-zinc-700/60",
    },
    rojo: {
      chip: "bg-rose-700 text-white border-rose-600",
      border: "border-rose-500/30 dark:border-rose-800/60",
    },
    verde: {
      chip: "bg-emerald-700 text-white border-emerald-600",
      border: "border-emerald-500/30 dark:border-emerald-800/60",
    },
    celeste: {
      chip: "bg-sky-700 text-white border-sky-600",
      border: "border-sky-500/30 dark:border-sky-800/60",
    },
    anaranjado: {
      chip: "bg-amber-700 text-white border-amber-600",
      border: "border-amber-500/30 dark:border-amber-800/60",
    },
  };

const ENTREGA_STEPS = [
  {
    n: "1",
    title: "Al cerrar el escrutinio regional",
    detail:
      "Una acta regional en cada sobre: plomo, rojo, verde y celeste. Se entregan al personal de la ONPE y se marca el cargo.",
  },
  {
    n: "2",
    title: "Al cerrar el escrutinio municipal",
    detail:
      "Los mismos cuatro colores, ahora con un acta municipal en cada uno, más el sobre anaranjado. Se entregan y se marca el cargo.",
  },
  {
    n: "3",
    title: "Al final de la jornada",
    detail:
      "Se entregan la caja de restos, el ánfora y las cabinas, y el presidente firma y recibe su copia del cargo.",
  },
];

const CARGO_ITEMS = [
  "Dos juegos de sobres de colores (regional y municipal: plomo, rojo, verde y celeste)",
  "Sobre anaranjado con la lista de electores y la hoja de control de asistencia",
  "Caja de restos electorales, con las cédulas no usadas destruidas y la bolsa de reciclaje",
  "Caja con el sobre de cédulas de sufragio no impugnadas",
  "Ánfora electoral y cabinas de votación plegadas",
  "Cargo firmado, con la copia que conserva el presidente",
];

export function TabSobres() {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── Encabezado: guía, no checklist ── */}
      <section className="p-4 rounded-2xl border border-border/80 bg-card space-y-1">
        <h2 className="text-sm sm:text-base font-black tracking-tight text-foreground flex items-center gap-1.5">
          <Mail className="h-4 w-4 text-brand" />
          <span>Guía de sobres de seguridad</span>
        </h2>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          Consulta rápida de qué va en cada sobre. No hay nada que marcar aquí:
          las tareas y el avance están en el Checklist.
        </p>
      </section>

      {/* ── Orden de entrega ── */}
      <section className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <header className="px-4 py-2.5 border-b border-border/60 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
          Orden de entrega
        </header>
        <ol className="divide-y divide-border/50">
          {ENTREGA_STEPS.map((step) => (
            <li key={step.n} className="flex gap-3 px-4 py-3">
              <span className="w-6 h-6 rounded-full bg-foreground text-background text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                {step.n}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-bold text-foreground">
                  {step.title}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Detalle por sobre ── */}
      <div className="space-y-3">
        {SECURITY_ENVELOPES.map((env) => {
          const accent = ENVELOPE_ACCENT[env.color];
          const isProhibition = env.color === "anaranjado";

          return (
            <article
              key={env.color}
              className={`rounded-2xl border bg-card overflow-hidden ${accent.border}`}
            >
              <header className="px-4 pt-3.5 pb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span
                  className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border ${accent.chip}`}
                >
                  {env.name}
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  {env.recipient}
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground basis-full">
                  {env.priority}
                </span>
              </header>

              <div className="px-4 pb-3 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                  Va adentro
                </span>
                <ul className="space-y-1">
                  {env.contents.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-2 text-xs text-foreground/90 leading-snug"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`mx-4 mb-4 p-3 rounded-xl text-[11px] leading-relaxed flex items-start gap-2.5 ${
                  isProhibition
                    ? "bg-destructive/10 text-destructive border border-destructive/25"
                    : "bg-muted/40 text-muted-foreground border border-border/60"
                }`}
              >
                {isProhibition ? (
                  <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>{env.warning}</span>
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Qué cubre el cargo de entrega ── */}
      <section className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <header className="px-4 py-2.5 border-b border-border/60 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
          <ClipboardCheck className="h-3.5 w-3.5 text-brand" />
          <span>Qué cubre el cargo de entrega</span>
        </header>
        <ul className="divide-y divide-border/50">
          {CARGO_ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 px-4 py-2.5 text-xs text-foreground/90 leading-snug"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="px-4 py-2.5 text-[10px] font-mono text-muted-foreground border-t border-border/50">
          Ley Orgánica de Elecciones N° 26859
        </p>
      </section>
    </div>
  );
}
