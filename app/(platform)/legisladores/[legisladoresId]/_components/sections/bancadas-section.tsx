"use client";

import { ParliamentaryMembershipWithGroup } from "@/interfaces/parliamentary-membership";
import { formatFechaJsonable } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { Users2 } from "lucide-react";

interface BancadasSectionProps {
  memberships: ParliamentaryMembershipWithGroup[];
  electedPartyName?: string;
  totalPartyChanges?: number;
}

export function BancadasSection({
  memberships = [],
  electedPartyName,
  totalPartyChanges = Math.max(0, memberships.length - 1),
}: BancadasSectionProps) {
  // Orden cronológico ascendente para el track (de origen a actual)
  const chronological = [...memberships].sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );

  return (
    <section id="sec-bancadas" className="py-10 scroll-mt-28">
      <header className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-mono font-bold text-brand">03</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Trayectoria de Bancadas y Transfuguismo
          </h2>
        </div>
        <span
          className={cn(
            "text-[11px] font-mono font-bold uppercase tracking-wider",
            totalPartyChanges > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground",
          )}
        >
          {memberships.length} {memberships.length === 1 ? "Grupo" : "Grupos"} ·{" "}
          {totalPartyChanges} {totalPartyChanges === 1 ? "Cambio" : "Cambios"}
        </span>
      </header>

      {/* ── Track Horizontal de Transfuguismo ── */}
      {chronological.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
          {chronological.map((m, idx) => {
            const isFirst = idx === 0;
            const isCurrent = !m.end_date;

            return (
              <div
                key={m.id || idx}
                className={cn(
                  "p-3.5 rounded-xl border space-y-1 transition-colors",
                  isCurrent
                    ? "bg-brand/10 border-brand/30 dark:bg-brand/15"
                    : isFirst
                      ? "bg-muted/40 border-border/80"
                      : "bg-amber-500/10 border-amber-500/30",
                )}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span
                    className={cn(
                      "uppercase tracking-wider font-bold",
                      isCurrent
                        ? "text-brand"
                        : isFirst
                          ? "text-muted-foreground"
                          : "text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {isFirst
                      ? "Origen Electoral"
                      : isCurrent
                        ? "Bancada Actual"
                        : `${idx}° Cambio`}
                  </span>
                  <span className="text-muted-foreground">
                    {isCurrent ? "Vigente" : "Concluido"}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-foreground break-words leading-snug">
                  {m.parliamentary_group?.name || "Grupo Parlamentario"}
                </h4>

                <p className="text-[11px] font-mono text-muted-foreground">
                  {formatFechaJsonable(m.start_date as string)} —{" "}
                  {m.end_date
                    ? formatFechaJsonable(m.end_date as string)
                    : "Presente"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detalle Cronológico Vertical ── */}
      <div className="space-y-3">
        {memberships.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border/60 bg-muted/20 text-center flex flex-col items-center gap-2">
            <Users2 className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm font-bold text-foreground">
              Sin historial de bancada disponible
            </p>
            <p className="text-xs text-muted-foreground">
              {electedPartyName
                ? `Electo originalmente por ${electedPartyName}.`
                : "No se registran datos de grupos parlamentarios."}
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-border/80 space-y-6 ml-3 pt-1">
            {memberships.map((m, idx) => {
              const isCurrent = !m.end_date;
              return (
                <div key={m.id || idx} className="relative">
                  {/* Dot indicador en la línea */}
                  <div
                    className={cn(
                      "absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-background ring-2",
                      isCurrent
                        ? "bg-brand ring-brand/40"
                        : "bg-muted-foreground ring-border",
                    )}
                  />

                  <div className="p-4 rounded-xl border border-border/70 bg-card space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                      <span className="font-bold text-foreground">
                        {m.parliamentary_group?.name || "Grupo Parlamentario"}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          isCurrent
                            ? "bg-brand/15 text-brand"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isCurrent ? "Vigente" : "Baja / Renuncia"}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-muted-foreground">
                      Inicio: {formatFechaJsonable(m.start_date as string)}
                      {m.end_date && (
                        <span>
                          {" "}
                          · Salida: {formatFechaJsonable(m.end_date as string)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground italic pl-3 border-l-2 border-border/80 mt-6">
        Nota Cívica: El cambio de bancada (transfuguismo) altera la
        representación ciudadana decidida en las urnas y redefine el equilibrio
        de votos en el Pleno y comisiones ordinarias.
      </p>
    </section>
  );
}
