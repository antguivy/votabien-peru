"use client";

import { LegislatorDetailWithPerson } from "@/interfaces/legislator";
import { cn } from "@/lib/utils";

interface LegislatorScorecardProps {
  legislador: LegislatorDetailWithPerson;
  onJump?: (sectionId: string) => void;
}

export function LegislatorScorecard({
  legislador,
  onJump,
}: LegislatorScorecardProps) {
  const metrics = legislador.legislatormetrics;
  const motions = legislador.motions || [];
  const bills = legislador.bill_authorships || [];
  const attendances = legislador.attendances || [];

  // 1. Fiscalización (Mociones)
  const totalMotions = metrics?.total_motions ?? motions.length;
  const greetingMotions =
    metrics?.motions_greeting ?? motions.filter((m) => m.is_greeting).length;
  const oversightMotions = Math.max(0, totalMotions - greetingMotions);
  const oversightPct =
    totalMotions > 0 ? Math.round((oversightMotions / totalMotions) * 100) : 0;

  // 2. Producción (Proyectos de Ley)
  const totalBills = metrics?.total_bills ?? bills.length;
  const approvedBillsCount =
    metrics?.bills_aprobado ??
    bills.filter(
      (b) =>
        b.approval_status === "APROBADO" || b.approval_status === "PUBLICADO",
    ).length;
  const approvalRate =
    metrics?.approval_rate ??
    (totalBills > 0
      ? Number(((approvedBillsCount / totalBills) * 100).toFixed(1))
      : 0);

  // 3. Asistencia
  const totalSessions = metrics?.total_sessions ?? attendances.length;
  const attendanceRate =
    totalSessions > 0
      ? (metrics?.attendance_rate ??
        (attendances.length > 0
          ? Number(
              (
                (attendances.filter((a) => a.attendance_status === "ASISTENCIA")
                  .length /
                  attendances.length) *
                100
              ).toFixed(1),
            )
          : null))
      : null;
  const ethicalRecords = metrics?.ethical_records ?? 0;

  // 4. Transfuguismo
  const totalPartyChanges = metrics?.total_party_changes ?? 0;
  const isDefector = metrics?.is_defector ?? totalPartyChanges > 0;

  // Resumen ejecutivo institucional
  let verdictSummary = "";
  if (isDefector) {
    verdictSummary = `Registra ${totalPartyChanges} ${
      totalPartyChanges === 1 ? "cambio" : "cambios"
    } de grupo parlamentario en el periodo bicameral. En labor de control, el ${oversightPct}% de sus mociones ejercen fiscalización política directa.`;
  } else {
    verdictSummary = `Mantiene lealtad a su bancada de origen con ${
      attendanceRate !== null
        ? `${attendanceRate}% de asistencia a Pleno`
        : "asistencia en curso (sin sesiones registradas)"
    } y ${oversightPct}% de mociones con vocación fiscalizadora.`;
  }

  return (
    <section className="my-6 p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
      {/* ── Encabezado Veredicto / Scorecard ── */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
        <span className="text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
          Rendimiento Parlamentario
        </span>

        {isDefector ? (
          <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-2xs">
            Alerta: Tránsfuga
          </span>
        ) : ethicalRecords > 0 ? (
          <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded border border-destructive/30 bg-destructive/10 text-destructive shadow-2xs">
            Con sanciones éticas
          </span>
        ) : null}
      </div>

      {/* Resumen Ejecutivo */}
      <p className="py-3 text-sm sm:text-base text-foreground/90 font-medium leading-relaxed">
        {verdictSummary}
      </p>

      {/* ── Grid de 4 KPIs Interactivos con Tipografía Geist Sans ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
        {/* KPI 1: Fiscalización */}
        <button
          type="button"
          onClick={() => onJump?.("sec-fiscalizacion")}
          className="p-3.5 rounded-xl border border-border/70 bg-muted/25 hover:bg-muted/50 hover:border-border transition-all text-left group flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
              <span>01 · Fiscalización</span>
            </div>
            <div className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
              {oversightMotions}{" "}
              <span className="text-xs font-mono font-normal text-muted-foreground">
                / {totalMotions}
              </span>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-[11px] text-muted-foreground leading-tight">
              {oversightPct}% fiscalizadoras
            </p>
            <div className="flex gap-1 pt-1.5">
              <span
                className="h-1 bg-brand rounded-full transition-all"
                style={{ width: `${oversightPct}%` }}
              />
              <span
                className="h-1 bg-muted-foreground/30 rounded-full transition-all"
                style={{ width: `${100 - oversightPct}%` }}
              />
            </div>
          </div>
        </button>

        {/* KPI 2: Producción Legislativa */}
        <button
          type="button"
          onClick={() => onJump?.("sec-proyectos")}
          className="p-3.5 rounded-xl border border-border/70 bg-muted/25 hover:bg-muted/50 hover:border-border transition-all text-left group flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>02 · Producción</span>
            </div>
            <div className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
              {totalBills}{" "}
              <span className="text-xs font-mono font-normal text-muted-foreground">
                PL
              </span>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-[11px] text-muted-foreground leading-tight">
              {approvedBillsCount} {approvedBillsCount === 1 ? "ley" : "leyes"}{" "}
              · {approvalRate}% tasa
            </p>
            <div className="flex gap-1 pt-1.5">
              <span
                className="h-1 bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(10, approvalRate * 5))}%`,
                }}
              />
              <span className="h-1 flex-1 bg-muted-foreground/20 rounded-full" />
            </div>
          </div>
        </button>

        {/* KPI 3: Asistencia a Pleno */}
        <button
          type="button"
          onClick={() => onJump?.("sec-perfil")}
          className="p-3.5 rounded-xl border border-border/70 bg-muted/25 hover:bg-muted/50 hover:border-border transition-all text-left group flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  attendanceRate === null
                    ? "bg-muted-foreground/40"
                    : attendanceRate >= 80
                      ? "bg-emerald-600"
                      : "bg-amber-500",
                )}
              />
              <span>03 · Asistencia</span>
            </div>
            <div
              className={cn(
                "mt-1 text-2xl sm:text-3xl font-black tracking-tight tabular-nums",
                attendanceRate === null
                  ? "text-muted-foreground"
                  : attendanceRate >= 80
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
              )}
            >
              {attendanceRate !== null ? `${attendanceRate}%` : "—"}
            </div>
          </div>
          <div className="pt-2">
            <p className="text-[11px] text-muted-foreground leading-tight">
              {attendanceRate === null
                ? "Sin sesiones registradas"
                : ethicalRecords === 0
                  ? "Sin sanciones éticas"
                  : `${ethicalRecords} sanciones`}
            </p>
            <div className="flex gap-1 pt-1.5">
              <span
                className={cn(
                  "h-1 rounded-full transition-all",
                  attendanceRate === null
                    ? "bg-muted-foreground/20"
                    : attendanceRate >= 80
                      ? "bg-emerald-600"
                      : "bg-amber-500",
                )}
                style={{ width: `${attendanceRate ?? 0}%` }}
              />
              <span className="h-1 flex-1 bg-muted-foreground/20 rounded-full" />
            </div>
          </div>
        </button>

        {/* KPI 4: Transfuguismo */}
        <button
          type="button"
          onClick={() => onJump?.("sec-bancadas")}
          className={cn(
            "p-3.5 rounded-xl border transition-all text-left group flex flex-col justify-between",
            isDefector
              ? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-950/20"
              : "border-border/70 bg-muted/25 hover:bg-muted/50 hover:border-border",
          )}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isDefector ? "bg-amber-500" : "bg-emerald-600",
                )}
              />
              <span
                className={
                  isDefector
                    ? "text-amber-700 dark:text-amber-400 font-bold"
                    : "text-muted-foreground"
                }
              >
                04 · Transfuguismo
              </span>
            </div>
            <div
              className={cn(
                "mt-1 text-2xl sm:text-3xl font-black tracking-tight tabular-nums",
                isDefector
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-foreground",
              )}
            >
              {totalPartyChanges}{" "}
              <span className="text-xs font-mono font-normal">
                {totalPartyChanges === 1 ? "cambio" : "cambios"}
              </span>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-[11px] text-muted-foreground leading-tight">
              {isDefector ? "Alerta de transfuguismo" : "Leal a bancada origen"}
            </p>
            <div className="flex gap-1 pt-1.5">
              <span
                className={cn(
                  "h-1 rounded-full",
                  isDefector ? "bg-amber-500 w-full" : "bg-emerald-600 w-full",
                )}
              />
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}
