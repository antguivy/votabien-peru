"use client";

import { useState, useMemo } from "react";
import { MotionBasic, InformationRequestBasic } from "@/interfaces/legislator";
import { formatFechaJsonable } from "@/lib/utils/date";
import { FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface FiscalizacionSectionProps {
  motions: MotionBasic[];
  requests: InformationRequestBasic[];
  totalMotions?: number;
  totalRequests?: number;
}

type MotionFilter = "all" | "oversight" | "greeting";

export function FiscalizacionSection({
  motions,
  requests,
  totalMotions = motions.length,
  totalRequests = requests.length,
}: FiscalizacionSectionProps) {
  const [filter, setFilter] = useState<MotionFilter>("all");
  const [showAllMotions, setShowAllMotions] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);

  const filteredMotions = useMemo(() => {
    if (filter === "oversight") {
      return motions.filter((m) => !m.is_greeting);
    }
    if (filter === "greeting") {
      return motions.filter((m) => m.is_greeting);
    }
    return motions;
  }, [motions, filter]);

  const displayedMotions = showAllMotions
    ? filteredMotions
    : filteredMotions.slice(0, 5);

  const displayedRequests = showAllRequests ? requests : requests.slice(0, 5);

  return (
    <section id="sec-fiscalizacion" className="py-10 scroll-mt-28">
      <header className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-mono font-bold text-brand">01</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Fiscalización y Control Político
          </h2>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
          {totalMotions} Mociones · {totalRequests} Pedidos de Información
        </span>
      </header>

      <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
        Se distingue entre mociones que ejercen control gubernamental directo
        frente a declaraciones protocolares de saludo, midiendo el ejercicio
        real de fiscalización parlamentaria.
      </p>

      {/* ── 1. Mociones de Orden del Día ── */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">
              Mociones de Orden del Día
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
              ({filteredMotions.length})
            </span>
          </div>

          {/* Filtros rápidos de moción */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/80 text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                filter === "all"
                  ? "bg-foreground text-background font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Todas ({motions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("oversight")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                filter === "oversight"
                  ? "bg-foreground text-background font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Fiscalizadoras ({motions.filter((m) => !m.is_greeting).length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("greeting")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                filter === "greeting"
                  ? "bg-foreground text-background font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Protocolares ({motions.filter((m) => m.is_greeting).length})
            </button>
          </div>
        </div>

        {motions.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border/60 bg-muted/20 text-center flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm font-bold text-foreground">
              Sin mociones de orden del día registradas
            </p>
            <p className="text-xs text-muted-foreground">
              Aún no se han indexado mociones presentadas por este legislador en
              el periodo actual.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {displayedMotions.map((motion) => {
              const isFiscal = !motion.is_greeting;
              return (
                <article
                  key={motion.id || motion.number}
                  className={cn(
                    "py-4 space-y-2 transition-opacity",
                    !isFiscal && "opacity-75",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          isFiscal
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-muted text-muted-foreground border border-border",
                        )}
                      >
                        {isFiscal ? "Fiscalización" : "Protocolar / Saludo"}
                      </span>
                      <span className="font-semibold text-foreground">
                        Moción {motion.number}
                      </span>
                      <span className="text-border">·</span>
                      <span className="text-muted-foreground">
                        {motion.submission_date
                          ? formatFechaJsonable(
                              motion.submission_date as string,
                            )
                          : "—"}
                      </span>
                    </div>

                    {motion.procedural_status && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {motion.procedural_status}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                    {motion.summary || motion.purpose || "Sin descripción"}
                  </h4>

                  {motion.purpose && motion.summary !== motion.purpose && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Propósito: {motion.purpose}
                    </p>
                  )}

                  {motion.document_url && (
                    <a
                      href={motion.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline pt-0.5"
                    >
                      <span>Ver documento oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {filteredMotions.length > 5 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowAllMotions(!showAllMotions)}
              className="px-4 py-2 rounded-xl bg-card hover:bg-muted border border-border text-xs font-mono font-bold transition-colors shadow-2xs"
            >
              {showAllMotions
                ? "Mostrar menos mociones"
                : `Ver las ${filteredMotions.length} mociones registradas`}
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Pedidos de Información (Art. 96) ── */}
      <div className="space-y-4 pt-6 border-t border-border">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Pedidos de Información formulados
            </h3>
            <p className="text-xs text-muted-foreground">
              Requerimientos cursados a ministerios y entidades públicas
              conforme al Art. 96 de la Constitución.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {requests.length} oficios registrados
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-6 rounded-xl border border-border/60 bg-muted/20 text-center">
            <p className="text-xs text-muted-foreground">
              No se han registrado pedidos de información formalizados a
              entidades públicas.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedRequests.map((req) => (
                <div
                  key={req.id || req.number}
                  className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-baseline justify-between gap-2 text-xs font-mono">
                    <span className="font-bold text-foreground break-words flex-1 min-w-0">
                      {req.target_entity}
                    </span>
                    <span className="text-muted-foreground text-[11px] shrink-0">
                      {req.document_date
                        ? formatFechaJsonable(req.document_date as string)
                        : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 line-clamp-2">
                    {req.summary}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                    <span>Oficio {req.number || req.document_code}</span>
                    {req.document_url && (
                      <a
                        href={req.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>Ver Oficio</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {requests.length > 5 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllRequests(!showAllRequests)}
                  className="px-4 py-2 rounded-xl bg-card hover:bg-muted border border-border text-xs font-mono font-bold transition-colors shadow-2xs"
                >
                  {showAllRequests
                    ? "Mostrar menos pedidos"
                    : `Ver los ${requests.length} pedidos registrados`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
