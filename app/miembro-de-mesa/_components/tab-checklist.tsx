"use client";

import { useEffect, useRef, useState } from "react";
import { useCopilotoStore } from "../_lib/store";
import { PHASES_CONFIG } from "../_lib/constants";
import { ChecklistTask, MemberRole, AgreementAssignee } from "../_lib/types";
import { useScrollSpy } from "../_lib/use-scroll-spy";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calculator,
  Filter,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function isTaskForRole(
  task: ChecklistTask,
  role: MemberRole | null,
  agreements: Record<string, AgreementAssignee>,
): boolean {
  if (!role || role === "todos") return true;
  if (task.roleResponsible === "Todos") return true;

  // If it's internal coordination, check who was assigned
  if (task.roleResponsible === "Coordinación Interna") {
    const assigned = agreements[task.id];
    if (!assigned) return true; // Show unassigned to everyone
    if (role === "presidente" && assigned === "Presidente") return true;
    if (role === "secretario" && assigned === "Secretario") return true;
    if (role === "tercer_miembro" && assigned === "Tercer Miembro") return true;
    return false;
  }

  if (role === "presidente" && task.roleResponsible === "Presidente")
    return true;
  if (role === "secretario" && task.roleResponsible === "Secretario")
    return true;
  if (role === "tercer_miembro" && task.roleResponsible === "Tercer Miembro")
    return true;
  return false;
}

const SECTION_IDS = PHASES_CONFIG.map((p) => `sec-${p.id}`);

export function TabChecklist() {
  const selectedRole = useCopilotoStore((s) => s.selectedRole);
  const completedTasks = useCopilotoStore((s) => s.completedTasks);
  const toggleTask = useCopilotoStore((s) => s.toggleTask);
  const internalAgreements = useCopilotoStore((s) => s.internalAgreements);
  const assignAgreement = useCopilotoStore((s) => s.assignAgreement);
  const setActiveTab = useCopilotoStore((s) => s.setActiveTab);

  const [onlyMyTasks, setOnlyMyTasks] = useState(true);
  const chipsContainerRef = useRef<HTMLDivElement>(null);

  // ScrollSpy to track active phase during continuous scroll
  const { activeId, scrollToSection } = useScrollSpy({
    sectionIds: SECTION_IDS,
    offsetPx: 110,
  });

  // Auto-scroll active chip into horizontal view when activeId changes
  useEffect(() => {
    if (!chipsContainerRef.current) return;
    const activeChip = chipsContainerRef.current.querySelector(
      `[data-chip-id="${activeId}"]`,
    ) as HTMLElement | null;

    if (activeChip) {
      activeChip.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── STICKY TOP CHIPS: Fases electorales con ScrollSpy ── */}
      <nav
        className="sticky top-[53px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-background/90 backdrop-blur-md border-b border-border/70 shadow-xs"
        aria-label="Índice de fases de la jornada"
      >
        <div
          ref={chipsContainerRef}
          className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5"
          style={{ scrollbarWidth: "none" }}
        >
          {PHASES_CONFIG.map((phase, idx) => {
            const sectionId = `sec-${phase.id}`;
            const isActive = activeId === sectionId;
            const doneInPhase = phase.tasks.filter(
              (t) => completedTasks[t.id],
            ).length;
            const isFinished = doneInPhase === phase.tasks.length;

            return (
              <button
                key={phase.id}
                type="button"
                data-chip-id={sectionId}
                onClick={() => scrollToSection(sectionId)}
                className={`shrink-0 inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border select-none active:scale-95 ${
                  isActive
                    ? "bg-foreground text-background border-foreground shadow-xs"
                    : isFinished
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/30"
                      : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground"
                }`}
                aria-current={isActive ? "true" : "false"}
              >
                <span
                  className={`text-[10px] font-bold ${
                    isActive ? "text-background/70" : "text-brand"
                  }`}
                >
                  0{idx + 1}
                </span>
                <span>{phase.title.replace(/^\d+\.\s*/, "")}</span>
                {isFinished && (
                  <CheckCircle2 className="h-3 w-3 shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Barra de Filtro de Rol ── */}
      {selectedRole && selectedRole !== "todos" && (
        <div className="flex items-center justify-between gap-2 px-1 text-xs">
          <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-brand" />
            <span>
              Filtrado por:{" "}
              <strong className="text-foreground capitalize font-sans">
                {selectedRole.replace("_", " ")}
              </strong>
            </span>
          </span>

          <button
            type="button"
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className="text-[10.5px] font-mono font-bold text-brand hover:underline"
          >
            {onlyMyTasks ? "[ Ver toda la mesa ]" : "[ Ver solo mi cargo ]"}
          </button>
        </div>
      )}

      {/* ── Secciones Continuas de Lectura y Checklist ── */}
      <div className="space-y-8 divide-y divide-border/60">
        {PHASES_CONFIG.map((phase, phaseIdx) => {
          const sectionId = `sec-${phase.id}`;
          const currentPhaseTasks = phase.tasks;
          const filteredTasks = currentPhaseTasks.filter((task) => {
            if (!onlyMyTasks) return true;
            return isTaskForRole(task, selectedRole, internalAgreements);
          });

          const phaseDoneCount = currentPhaseTasks.filter(
            (t) => completedTasks[t.id],
          ).length;
          const phaseTotalCount = currentPhaseTasks.length;
          const isPhaseComplete = phaseDoneCount === phaseTotalCount;

          return (
            <section
              key={phase.id}
              id={sectionId}
              className={`space-y-4 ${phaseIdx > 0 ? "pt-8" : ""}`}
            >
              {/* Encabezado Editorial de la Fase */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-brand" />
                    <span>{phase.timeframe}</span>
                  </div>

                  <span
                    className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded border -rotate-1 shadow-2xs ${
                      isPhaseComplete
                        ? "text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400"
                        : "text-muted-foreground bg-muted/40 border-border"
                    }`}
                  >
                    {phaseDoneCount}/{phaseTotalCount} tareas
                  </span>
                </div>

                <div>
                  <h2 className="text-base sm:text-xl font-black tracking-tight text-foreground">
                    {phase.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                    {phase.subtitle}
                  </p>
                </div>

                {/* Blocker Alert */}
                {phase.warningAlert && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-600/30 p-3 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <p className="font-medium leading-relaxed">
                      {phase.warningAlert}
                    </p>
                  </div>
                )}
              </div>

              {/* Tareas de la Fase */}
              <div className="space-y-2.5">
                {filteredTasks.map((task, index) => {
                  const isDone = !!completedTasks[task.id];
                  const isSharedAgreement =
                    task.roleResponsible === "Coordinación Interna";
                  const assignedTo = internalAgreements[task.id];

                  // Subtle role colors
                  const roleBadgeClass = isSharedAgreement
                    ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                    : task.roleResponsible === "Presidente"
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                      : task.roleResponsible === "Secretario"
                        ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                        : task.roleResponsible === "Tercer Miembro"
                          ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30";

                  return (
                    <div
                      key={task.id}
                      className={`rounded-2xl border p-4 transition-all select-none ${
                        isDone
                          ? "bg-muted/15 border-border/40 opacity-60"
                          : isSharedAgreement
                            ? "bg-card border-amber-500/30 shadow-xs"
                            : task.isCritical
                              ? "bg-card border-border/90 hover:border-brand/40 shadow-xs"
                              : "bg-card border-border/70"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Large Clean Checkbox Target */}
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className="pt-0.5 focus:outline-none"
                          aria-label={`Marcar tarea ${task.title}`}
                        >
                          <div
                            className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all ${
                              isDone
                                ? "bg-foreground border-foreground text-background shadow-xs"
                                : "border-border bg-background hover:border-brand"
                            }`}
                          >
                            {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </div>
                        </button>

                        {/* Task Details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-start justify-between gap-1.5">
                            <h3
                              onClick={() => toggleTask(task.id)}
                              className={`text-xs sm:text-sm font-bold leading-snug cursor-pointer ${
                                isDone
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              <span className="text-muted-foreground font-mono text-[11px] mr-1.5">
                                #{index + 1}
                              </span>
                              {task.title}
                            </h3>

                            {/* Role Badge with Subtle Color */}
                            <span
                              className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded shrink-0 border ${roleBadgeClass}`}
                            >
                              {isSharedAgreement
                                ? assignedTo
                                  ? `👤 ${assignedTo}`
                                  : "🤝 Acuerdo Interno"
                                : task.roleResponsible}
                            </span>
                          </div>

                          <p
                            onClick={() => toggleTask(task.id)}
                            className="text-xs text-muted-foreground leading-relaxed font-medium cursor-pointer"
                          >
                            {task.description}
                          </p>

                          {/* Interactive Role Assignment for Internal Coordination Tasks */}
                          {isSharedAgreement && !isDone && (
                            <div className="mt-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                              <div className="flex items-center justify-between text-[10.5px] font-mono">
                                <span className="text-muted-foreground font-bold flex items-center gap-1">
                                  <UserCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                  <span>¿Quién asume esta tarea?</span>
                                </span>
                                {assignedTo && (
                                  <span className="text-amber-700 dark:text-amber-400 font-bold">
                                    Asignado: {assignedTo}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-1">
                                {(
                                  [
                                    "Presidente",
                                    "Secretario",
                                    "Tercer Miembro",
                                  ] as AgreementAssignee[]
                                ).map((roleOption) => {
                                  const isAssigned = assignedTo === roleOption;
                                  return (
                                    <button
                                      key={roleOption}
                                      type="button"
                                      onClick={() =>
                                        assignAgreement(task.id, roleOption)
                                      }
                                      className={`py-1 px-1 rounded-lg text-[10px] font-mono font-bold border transition-all text-center truncate ${
                                        isAssigned
                                          ? "bg-amber-500/20 border-amber-500/50 text-amber-900 dark:text-amber-200 shadow-2xs"
                                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      {roleOption === "Tercer Miembro"
                                        ? "3er Miembro"
                                        : roleOption}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Irreversible Blocker Callout */}
                          {task.irreversibleWarning && !isDone && (
                            <div className="mt-2.5 rounded-xl bg-destructive/10 border border-destructive/30 p-2.5 flex items-start gap-2 text-destructive text-xs">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <div>
                                <strong className="block uppercase text-[10px] font-mono tracking-wider mb-0.5">
                                  ¡Punto de no retorno!
                                </strong>
                                <span className="leading-snug">
                                  {task.irreversibleWarning}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* At the end of Escrutinio phase: quick jump to Cuadre */}
              {phase.id === "escrutinio" && (
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("calculadora")}
                    className="w-full bg-brand text-brand-foreground font-bold flex items-center justify-center gap-2 shadow-xs rounded-xl py-5 text-xs font-mono"
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Abrir Calculadora de Cuadre de Actas</span>
                  </Button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
