"use client";

import { CandidateDetail } from "@/interfaces/candidate";

interface CandidateVerdictProps {
  candidate: CandidateDetail;
  onJump: (sectionId: string) => void;
}

export function CandidateVerdict({ candidate, onJump }: CandidateVerdictProps) {
  const person = candidate.person;
  const backgrounds = person.backgrounds || [];

  // Conteo por tipo de antecedente
  const penalCount = backgrounds.filter(
    (b) => b.type?.toUpperCase() === "PENAL",
  ).length;
  const civilCount = backgrounds.filter(
    (b) => b.type?.toUpperCase() === "CIVIL",
  ).length;
  const adminCount = backgrounds.filter(
    (b) =>
      b.type?.toUpperCase() === "ADMINISTRATIVO" ||
      b.type?.toUpperCase() === "ETICA",
  ).length;

  const totalLegalAlerts = penalCount + civilCount + adminCount;
  const isClean = totalLegalAlerts === 0;

  // REINFO status
  const reinfoStatus = person.reinfo_status;
  const isReinfoAlert =
    reinfoStatus === "Vigente" || reinfoStatus === "Suspendido";

  // Formación académica máxima
  const hasPostgraduate = (person.postgraduate_education?.length || 0) > 0;
  const hasUniversity = (person.university_education?.length || 0) > 0;
  const hasTechnical = (person.technical_education?.length || 0) > 0;

  let educationLevel = "No declara";
  let educationStatus = "Sin registro";
  let educationIsWarn = false;

  if (hasPostgraduate) {
    educationLevel = "Posgrado";
    const p = person.postgraduate_education![0];
    educationStatus = p.concluded === "NO" ? "Inconcluso" : "Concluido";
    educationIsWarn = p.concluded === "NO";
  } else if (hasUniversity) {
    educationLevel = "Universitaria";
    const u = person.university_education![0];
    educationStatus = u.concluded === "NO" ? "Inconcluso" : "Concluido";
    educationIsWarn = u.concluded === "NO";
  } else if (hasTechnical) {
    educationLevel = "Técnica";
    const t = person.technical_education![0];
    educationStatus = t.concluded === "NO" ? "Inconcluso" : "Concluido";
    educationIsWarn = t.concluded === "NO";
  }

  // Resumen ejecutivo ajustado a la realidad de las fuentes (hoja de vida / voto informado + prensa)
  let verdictSummary = "";
  if (isClean) {
    verdictSummary =
      "No registra sentencias penales ni demandas civiles en su hoja de vida oficial.";
  } else {
    const parts: string[] = [];
    if (penalCount > 0) {
      parts.push(
        `${penalCount} proceso${penalCount > 1 ? "s" : ""} penal${penalCount > 1 ? "es" : ""}`,
      );
    }
    if (civilCount > 0) {
      parts.push(
        `${civilCount} obligación${civilCount > 1 ? "es" : ""} civil${civilCount > 1 ? "es" : ""}`,
      );
    }
    if (adminCount > 0) {
      parts.push(
        `${adminCount} sanción${adminCount > 1 ? "es" : ""} administrativa${adminCount > 1 ? "es" : ""}`,
      );
    }
    verdictSummary = `Registra ${parts.join(" y ")} en su hoja de vida oficial (Voto Informado) e investigaciones.`;
  }

  return (
    <section className="my-6 p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
      {/* ── Encabezado con Veredicto Cívico (reemplaza 'Semáforo') ── */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
            Veredicto Cívico
          </span>
        </div>

        <span
          className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded border -rotate-1 shadow-2xs ${
            isClean
              ? "text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400"
              : penalCount > 0
                ? "text-destructive bg-destructive/10 border-destructive/30"
                : "text-amber-700 bg-amber-500/10 border-amber-600/30 dark:text-amber-400"
          }`}
        >
          {isClean ? "Sin observaciones" : "Con observaciones"}
        </span>
      </div>

      {/* Resumen en texto */}
      <p className="py-3 text-sm sm:text-base text-foreground/90 font-medium leading-relaxed">
        {verdictSummary}{" "}
        {educationIsWarn && (
          <span className="text-muted-foreground">
            Su formación superior ({educationLevel.toLowerCase()}) figura como{" "}
            <strong className="text-foreground">inconclusa</strong>.
          </span>
        )}
      </p>

      {/* ── Fila de Chips de Salto Rápido ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        {/* Chip Penales */}
        <button
          type="button"
          onClick={() => onJump("sec-legal")}
          className="p-3 rounded-xl border border-border/60 bg-muted/25 hover:bg-muted/50 hover:border-border transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                penalCount > 0
                  ? "bg-destructive animate-pulse"
                  : "bg-emerald-600"
              }`}
            />
            <span>Penales</span>
          </div>
          <div className="mt-1.5 text-xl font-black tabular-nums text-foreground">
            {penalCount}
          </div>
          <div
            className={`mt-0.5 text-[10px] font-mono font-medium uppercase tracking-tight ${
              penalCount > 0
                ? "text-destructive font-bold"
                : "text-emerald-600 dark:text-emerald-500"
            }`}
          >
            {penalCount > 0 ? "Con registros" : "Sin registros"}
          </div>
        </button>

        {/* Chip Civiles */}
        <button
          type="button"
          onClick={() => onJump("sec-legal")}
          className="p-3 rounded-xl border border-border/60 bg-muted/25 hover:bg-muted/50 hover:border-border transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                civilCount > 0 ? "bg-amber-500" : "bg-emerald-600"
              }`}
            />
            <span>Civiles</span>
          </div>
          <div className="mt-1.5 text-xl font-black tabular-nums text-foreground">
            {civilCount}
          </div>
          <div
            className={`mt-0.5 text-[10px] font-mono font-medium uppercase tracking-tight ${
              civilCount > 0
                ? `${civilCount} reporte${civilCount > 1 ? "s" : ""}`
                : "Sin registros"
            }`}
          >
            {civilCount > 0
              ? `${civilCount} reporte${civilCount > 1 ? "s" : ""}`
              : "Sin registros"}
          </div>
        </button>

        {/* Chip Formación */}
        <button
          type="button"
          onClick={() => onJump("sec-formacion")}
          className="p-3 rounded-xl border border-border/60 bg-muted/25 hover:bg-muted/50 hover:border-border transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                educationIsWarn ? "bg-amber-500" : "bg-emerald-600"
              }`}
            />
            <span>Formación</span>
          </div>
          <div className="mt-1.5 text-sm sm:text-base font-bold leading-snug break-words text-foreground">
            {educationLevel}
          </div>
          <div
            className={`mt-0.5 text-[10px] font-mono font-medium uppercase tracking-tight ${
              educationIsWarn
                ? "text-amber-600 dark:text-amber-500"
                : "text-emerald-600 dark:text-emerald-500"
            }`}
          >
            {educationStatus}
          </div>
        </button>

        {/* Chip REINFO / Minería */}
        <button
          type="button"
          onClick={() => onJump("sec-legal")}
          className="p-3 rounded-xl border border-border/60 bg-muted/25 hover:bg-muted/50 hover:border-border transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isReinfoAlert ? "bg-destructive" : "bg-emerald-600"
              }`}
            />
            <span>REINFO</span>
          </div>
          <div className="mt-1.5 text-sm sm:text-base font-bold leading-snug break-words text-foreground">
            {reinfoStatus || "Sin registro"}
          </div>
          <div
            className={`mt-0.5 text-[10px] font-mono font-medium uppercase tracking-tight ${
              isReinfoAlert
                ? "text-destructive font-bold"
                : "text-emerald-600 dark:text-emerald-500"
            }`}
          >
            {isReinfoAlert ? "Alerta minera" : "Sin hallazgos"}
          </div>
        </button>
      </div>
    </section>
  );
}
