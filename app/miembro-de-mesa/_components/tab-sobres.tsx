"use client";

import { useState } from "react";
import { useCopilotoStore } from "../_lib/store";
import { SECURITY_ENVELOPES } from "../_lib/constants";
import { EnvelopeColor } from "../_lib/types";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  PackageCheck,
  AlertOctagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ENVELOPE_STYLES: Record<
  EnvelopeColor,
  {
    plasticBg: string;
    tapeBg: string;
    accentColor: string;
    badgeBg: string;
    border: string;
    acronym: string;
  }
> = {
  plomo: {
    plasticBg: "bg-zinc-500/10 dark:bg-zinc-900/60",
    tapeBg: "bg-zinc-700 text-zinc-100",
    accentColor: "text-zinc-700 dark:text-zinc-300",
    badgeBg:
      "bg-zinc-600/15 text-zinc-800 dark:text-zinc-200 border-zinc-500/30",
    border: "border-zinc-400/40 dark:border-zinc-700/60",
    acronym: "ODPE",
  },
  rojo: {
    plasticBg: "bg-rose-500/10 dark:bg-rose-950/40",
    tapeBg: "bg-rose-700 text-white",
    accentColor: "text-rose-700 dark:text-rose-400",
    badgeBg:
      "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
    border: "border-rose-500/30 dark:border-rose-800/60",
    acronym: "ONPE",
  },
  verde: {
    plasticBg: "bg-emerald-500/10 dark:bg-emerald-950/40",
    tapeBg: "bg-emerald-700 text-white",
    accentColor: "text-emerald-700 dark:text-emerald-400",
    badgeBg:
      "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    border: "border-emerald-500/30 dark:border-emerald-800/60",
    acronym: "JNE",
  },
  celeste: {
    plasticBg: "bg-sky-500/10 dark:bg-sky-950/40",
    tapeBg: "bg-sky-700 text-white",
    accentColor: "text-sky-700 dark:text-sky-400",
    badgeBg: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30",
    border: "border-sky-500/30 dark:border-sky-800/60",
    acronym: "JEE",
  },
  anaranjado: {
    plasticBg: "bg-amber-500/10 dark:bg-amber-950/40",
    tapeBg: "bg-amber-700 text-white",
    accentColor: "text-amber-700 dark:text-amber-400",
    badgeBg:
      "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    border: "border-amber-500/30 dark:border-amber-800/60",
    acronym: "ODPE (PADRÓN)",
  },
};

export function TabSobres() {
  const sealedEnvelopes = useCopilotoStore((s) => s.sealedEnvelopes);
  const toggleEnvelopeSealed = useCopilotoStore((s) => s.toggleEnvelopeSealed);

  const [cargoChecked, setCargoChecked] = useState<Record<string, boolean>>({
    restos: false,
    anfora: false,
    cabina: false,
    cedulas: false,
    cargoFirmado: false,
  });

  const toggleCargoItem = (id: string) => {
    setCargoChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sealedCount = Object.values(sealedEnvelopes).filter(Boolean).length;
  const totalCount = SECURITY_ENVELOPES.length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── Encabezado Oficial de Sobres de Seguridad ── */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
            <Mail className="h-3.5 w-3.5 text-brand" />
            <span>Paso 24 y 34 · Manual de Instrucciones ONPE 2026</span>
          </div>

          <span
            className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded border -rotate-1 shadow-2xs ${
              sealedCount === totalCount
                ? "text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400"
                : "text-muted-foreground bg-muted/40 border-border"
            }`}
          >
            {sealedCount}/{totalCount} sobres lacrados
          </span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
            Los 5 Sobres Plásticos de Seguridad
          </h2>
          <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
            Cada ejemplar del acta electoral tiene un destino legal
            independiente. Antes de guardar cada acta,{" "}
            <strong>pegá las láminas de protección autoadhesivas</strong> sobre
            los resultados y observaciones. Luego, cerrá el sobre con su{" "}
            <strong>cinta de seguridad inviolable</strong>.
          </p>
        </div>
      </section>

      {/* ── Lista de los 5 Sobres Oficiales con Réplica Física ── */}
      <div className="space-y-4">
        {SECURITY_ENVELOPES.map((env) => {
          const isSealed = !!sealedEnvelopes[env.color];
          const style = ENVELOPE_STYLES[env.color];

          return (
            <section
              key={env.color}
              className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
                isSealed
                  ? "bg-card border-emerald-600/40"
                  : `bg-card ${style.border}`
              }`}
            >
              {/* ── Cinta de Seguridad Inviolable (Tamper-evident Tape) ── */}
              <div
                className={`px-4 py-1.5 flex items-center justify-between text-[9px] font-mono font-black uppercase tracking-widest ${style.tapeBg} select-none`}
              >
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Cinta de Seguridad Inviolable · ONPE</span>
                </span>
                <span className="opacity-90 flex items-center gap-1 font-bold">
                  {isSealed ? (
                    <>
                      <Lock className="h-2.5 w-2.5" />
                      <span>LACRADO</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-2.5 w-2.5" />
                      <span>PENDIENTE DE CIERRE</span>
                    </>
                  )}
                </span>
              </div>

              {/* ── Cuerpo del Sobre ── */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {/* Acronym Pill */}
                      <span
                        className={`text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded border -rotate-1 shadow-2xs ${style.badgeBg}`}
                      >
                        {style.acronym}
                      </span>

                      {/* Color Name */}
                      <span className="text-xs font-bold font-mono text-foreground">
                        {env.name}
                      </span>

                      {isSealed && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Cerrado</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-foreground">
                      {env.recipient}
                    </h4>

                    <span className="text-[11px] font-mono text-muted-foreground block">
                      {env.priority}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={isSealed ? "default" : "outline"}
                    onClick={() =>
                      toggleEnvelopeSealed(env.color as EnvelopeColor)
                    }
                    className={`h-9 px-3.5 text-xs font-mono font-bold rounded-xl flex items-center gap-2 self-start sm:self-center transition-all ${
                      isSealed
                        ? "bg-foreground text-background border-foreground hover:bg-foreground/90 shadow-xs"
                        : "border-border text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {isSealed ? (
                      <>
                        <Lock className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Sobre Sellado</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Marcar como Sellado</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Documentos adentro */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold block">
                    Documentos obligatorios que van adentro:
                  </span>
                  <ul className="space-y-1.5">
                    {env.contents.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-xs text-foreground/90 font-medium leading-snug"
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                            isSealed
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warning / Caution Box */}
                <div
                  className={`p-3 rounded-xl text-xs font-medium leading-relaxed flex items-start gap-2.5 ${
                    env.color === "anaranjado"
                      ? "bg-destructive/10 text-destructive border border-destructive/25"
                      : env.color === "celeste"
                        ? "bg-sky-500/10 text-sky-900 dark:text-sky-200 border border-sky-500/25"
                        : "bg-muted/30 text-muted-foreground border border-border/60"
                  }`}
                >
                  {env.color === "anaranjado" ? (
                    <AlertOctagon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block text-[10px] font-mono uppercase tracking-wider mb-0.5">
                      {env.color === "anaranjado"
                        ? "Prohibición Estricta ONPE:"
                        : "Instrucción de Seguridad:"}
                    </strong>
                    {env.warning}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Cargo de Entrega al Coordinador de la ONPE (Paso 34) ── */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
            <PackageCheck className="h-3.5 w-3.5 text-brand" />
            <span>Paso 34 y 35 · Cierre y Retiro del Local</span>
          </div>

          <span className="text-[10px] font-mono font-bold text-muted-foreground">
            Acta de Entrega
          </span>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-black tracking-tight text-foreground">
            Cargo de Entrega de Actas y Material Electoral
          </h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed pt-1">
            El Presidente de Mesa entrega todo el material al Coordinador de la
            ONPE. Al hacerlo,{" "}
            <strong>ambos firman el Cargo de Entrega por duplicado</strong> y el
            Presidente recibe una copia que acredita legalmente que cumplió con
            su deber.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {[
            {
              id: "sobres5",
              label:
                "Los 5 Sobres Plásticos de Seguridad lacrados (Plomo, Rojo, Verde, Celeste, Anaranjado)",
            },
            {
              id: "restos",
              label:
                "Caja de Restos Electorales (Cédulas no utilizadas destruidas y bolsa de reciclaje con útiles)",
            },
            {
              id: "cedulas",
              label:
                "Caja que contiene el Sobre Plástico para repliegue de cédulas de sufragio no impugnadas",
            },
            {
              id: "anfora",
              label:
                "Ánfora electoral desarmada y Cabinas de votación plegadas",
            },
            {
              id: "cargoFirmado",
              label:
                "Firma del formato 'Cargo de entrega de actas y material electoral' y recepción de la copia del Presidente",
            },
          ].map((item) => {
            const isChecked =
              item.id === "sobres5"
                ? sealedCount === totalCount
                : cargoChecked[item.id];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id !== "sobres5") toggleCargoItem(item.id);
                }}
                className={`w-full p-3 rounded-xl border flex items-start gap-2.5 text-left transition-all ${
                  isChecked
                    ? "bg-emerald-500/10 border-emerald-600/30 text-foreground"
                    : "bg-muted/20 border-border/70 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <CheckCircle2
                  className={`h-4 w-4 mt-0.5 shrink-0 transition-colors ${
                    isChecked
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground/40"
                  }`}
                />
                <span className="text-xs font-semibold leading-snug">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 text-[11px] font-mono text-muted-foreground flex items-center justify-between border-t border-border/50">
          <span>Ley Orgánica de Elecciones N° 26859</span>
          <span className="font-bold">Misión Cumplida</span>
        </div>
      </section>
    </div>
  );
}
