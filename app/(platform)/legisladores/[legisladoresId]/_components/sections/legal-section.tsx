"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Gavel,
  Scale,
} from "lucide-react";
import { BackgroundBase } from "@/interfaces/background";
import { ReinfoStatus, RnasSanction } from "@/interfaces/person";
import {
  backgroundStatusConfig,
  backgroundTypeConfig,
  DEFAULT_BACKGROUND_CONFIG,
} from "@/lib/utils/background-config";
import { parseSourceUrls } from "@/lib/utils/url";
import { RegistrosOficiales } from "@/app/(platform)/candidatos/[candidatosId]/_components/oficial-register";

interface LegalSectionProps {
  backgrounds: BackgroundBase[];
  is_incumbent?: boolean;
  reinfo_status?: ReinfoStatus | null;
  rnas_sanctions?: RnasSanction[] | null;
  profession?: string | null;
  legislatorId?: string | null;
}

export function LegalSection({
  backgrounds = [],
  is_incumbent = true,
  reinfo_status,
  rnas_sanctions,
  profession,
  legislatorId,
}: LegalSectionProps) {
  const [openIndexes, setOpenIndexes] = useState<Record<number, boolean>>({
    0: true,
  });

  const toggleRecord = (index: number) => {
    setOpenIndexes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <section id="sec-legal" className="py-10 scroll-mt-28">
      <header className="flex items-baseline justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-mono font-bold text-brand">04</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Historial Legal y Registros Oficiales
          </h2>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Fuentes: Voto Informado (JNE) · REINFO · RNAS
        </span>
      </header>

      {/* ── Padrones Oficiales del Estado ── */}
      <div className="mb-6 rounded-2xl border border-border/70 overflow-hidden bg-card">
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60 flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Padrones del Estado (REINFO y RNAS)
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Verificación Oficial
          </span>
        </div>
        <RegistrosOficiales
          is_incumbent={is_incumbent}
          reinfo_status={reinfo_status}
          rnas_sanctions={rnas_sanctions}
          profession={profession ?? null}
          legislatorId={legislatorId}
        />
      </div>

      {/* ── Lista de Antecedentes y Procesos Judiciales ── */}
      <div className="space-y-3">
        {backgrounds.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border/60 bg-muted/20 text-center flex flex-col items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
            <p className="text-sm font-bold text-foreground">
              Sin historial legal judicial declarado
            </p>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              No se identificaron sentencias judiciales declaradas en su hoja de
              vida ante el JNE ni reportes de sanciones registradas.
            </p>
          </div>
        ) : (
          backgrounds
            .slice()
            .sort((a, b) => {
              if (!a.publication_date) return 1;
              if (!b.publication_date) return -1;
              return (
                new Date(b.publication_date).getTime() -
                new Date(a.publication_date).getTime()
              );
            })
            .map((bg, idx) => {
              const isOpen = !!openIndexes[idx];
              const config =
                backgroundTypeConfig[bg.type?.toUpperCase()] ??
                DEFAULT_BACKGROUND_CONFIG;
              const statusCfg = bg.status
                ? backgroundStatusConfig[bg.status.toUpperCase()]
                : null;
              const isPenal = bg.type?.toUpperCase() === "PENAL";

              return (
                <div
                  key={bg.id ?? idx}
                  className={`rounded-xl border border-border/70 bg-card overflow-hidden transition-all border-l-4 ${
                    isPenal ? "border-l-destructive" : config.border
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleRecord(idx)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isPenal
                            ? "bg-destructive/15 text-destructive font-black"
                            : config.badge
                        }`}
                      >
                        {bg.type}
                      </span>

                      {statusCfg && (
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${statusCfg.badge}`}
                        >
                          {bg.status.replace(/_/g, " ")}
                        </span>
                      )}

                      <span className="text-sm font-bold text-foreground leading-snug break-words">
                        {bg.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {bg.publication_date && (
                        <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
                          {new Intl.DateTimeFormat("es-PE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(bg.publication_date))}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3.5 bg-muted/10">
                      {bg.summary && (
                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pt-2">
                          {bg.summary}
                        </p>
                      )}

                      {bg.sanction && (
                        <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/20 flex gap-2.5 items-start">
                          <Gavel className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-destructive block mb-0.5">
                              Sanción o Fallo Registrado
                            </span>
                            <p className="text-xs sm:text-sm font-medium text-foreground">
                              {bg.sanction}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 text-xs">
                        <span className="text-muted-foreground">
                          Origen:{" "}
                          <strong className="text-foreground">
                            {bg.source || "Voto Informado (JNE)"}
                          </strong>
                        </span>

                        {bg.source_url && (
                          <div className="flex flex-wrap gap-2">
                            {parseSourceUrls(bg.source_url).map((src, sIdx) => (
                              <Link
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-brand bg-brand/10 hover:bg-brand/20 border border-brand/20 transition-all active:scale-[0.98]"
                              >
                                <span>Ver fuente en {src.domain}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </section>
  );
}
