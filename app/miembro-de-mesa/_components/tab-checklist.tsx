"use client";

import { useState } from "react";
import { useCopilotoStore } from "../_lib/store";
import { PHASES_CONFIG } from "../_lib/constants";
import { ChecklistTask, MemberRole } from "../_lib/types";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calculator,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function isTaskForRole(task: ChecklistTask, role: MemberRole | null): boolean {
  if (!role || role === "todos") return true;
  if (task.roleResponsible === "Todos") return true;
  if (task.roleResponsible === "Coordinación Interna") return true;
  if (role === "presidente" && task.roleResponsible === "Presidente")
    return true;
  if (role === "secretario" && task.roleResponsible === "Secretario")
    return true;
  if (role === "tercer_miembro" && task.roleResponsible === "Tercer Miembro")
    return true;
  return false;
}

export function TabChecklist() {
  const activePhase = useCopilotoStore((s) => s.activePhase);
  const setActivePhase = useCopilotoStore((s) => s.setActivePhase);
  const selectedRole = useCopilotoStore((s) => s.selectedRole);
  const completedTasks = useCopilotoStore((s) => s.completedTasks);
  const toggleTask = useCopilotoStore((s) => s.toggleTask);
  const setActiveTab = useCopilotoStore((s) => s.setActiveTab);

  const [onlyMyTasks, setOnlyMyTasks] = useState(true);

  const currentPhaseConfig =
    PHASES_CONFIG.find((p) => p.id === activePhase) || PHASES_CONFIG[0];

  const currentPhaseIndex = PHASES_CONFIG.findIndex(
    (p) => p.id === activePhase,
  );
  const nextPhase =
    currentPhaseIndex < PHASES_CONFIG.length - 1
      ? PHASES_CONFIG[currentPhaseIndex + 1]
      : null;

  const currentPhaseTasks = currentPhaseConfig.tasks;
  const filteredTasks = currentPhaseTasks.filter((task) => {
    if (!onlyMyTasks) return true;
    return isTaskForRole(task, selectedRole);
  });

  const phaseDoneCount = currentPhaseTasks.filter(
    (t) => completedTasks[t.id],
  ).length;
  const phaseTotalCount = currentPhaseTasks.length;
  const isPhaseComplete = phaseDoneCount === phaseTotalCount;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── Sub-índice de Fases (Chips de desplazamiento horizontal estilo VotaBien) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {PHASES_CONFIG.map((phase, idx) => {
          const isCurrent = phase.id === activePhase;
          const doneInPhase = phase.tasks.filter(
            (t) => completedTasks[t.id],
          ).length;
          const isFinished = doneInPhase === phase.tasks.length;

          return (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`shrink-0 inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border select-none active:scale-95 ${
                isCurrent
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : isFinished
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/30"
                    : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <span
                className={`text-[10px] font-bold ${
                  isCurrent ? "text-background/70" : "text-brand"
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

      {/* ── Encabezado Editorial de la Fase ── */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-brand" />
            <span>{currentPhaseConfig.timeframe}</span>
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
            {currentPhaseConfig.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
            {currentPhaseConfig.subtitle}
          </p>
        </div>

        {/* Phase Blocker Alert */}
        {currentPhaseConfig.warningAlert && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-600/30 p-3 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
            <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">
              {currentPhaseConfig.warningAlert}
            </p>
          </div>
        )}
      </section>

      {/* ── Barra de Filtro de Rol ── */}
      {selectedRole && selectedRole !== "todos" && (
        <div className="flex items-center justify-between gap-2 px-1 text-xs">
          <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-brand" />
            <span>
              Mostrando tareas de:{" "}
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

      {/* ── Lista de Tareas Editoriales ── */}
      <div className="space-y-2.5">
        {filteredTasks.map((task, index) => {
          const isDone = !!completedTasks[task.id];
          const isSharedAgreement =
            task.roleResponsible === "Coordinación Interna";

          return (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`rounded-2xl border p-4 transition-all select-none cursor-pointer active:scale-[0.99] ${
                isDone
                  ? "bg-muted/15 border-border/40 opacity-60"
                  : isSharedAgreement
                    ? "bg-card border-brand/40 shadow-xs"
                    : task.isCritical
                      ? "bg-card border-border/90 hover:border-brand/40 shadow-xs"
                      : "bg-card border-border/70"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Large Clean Checkbox Target */}
                <div className="pt-0.5">
                  <div
                    className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all ${
                      isDone
                        ? "bg-foreground border-foreground text-background shadow-xs"
                        : "border-border bg-background"
                    }`}
                  >
                    {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                </div>

                {/* Task Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-xs sm:text-sm font-bold leading-snug ${
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

                    {/* Role Tag */}
                    {task.roleResponsible && (
                      <span
                        className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded shrink-0 border ${
                          isSharedAgreement
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-600/30"
                            : task.roleResponsible === "Todos"
                              ? "bg-muted text-muted-foreground border-border/60"
                              : "bg-brand/10 text-brand border-brand/20"
                        }`}
                      >
                        {isSharedAgreement
                          ? "🤝 Acuerdo Interno"
                          : task.roleResponsible}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {task.description}
                  </p>

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

      {/* ── Pie de Fase con Navegación ── */}
      <div className="pt-2 space-y-2">
        {activePhase === "escrutinio" && (
          <Button
            onClick={() => setActiveTab("calculadora")}
            className="w-full bg-brand text-brand-foreground font-bold flex items-center justify-center gap-2 shadow-xs rounded-xl py-5 text-xs font-mono"
          >
            <Calculator className="h-4 w-4" />
            <span>Abrir Calculadora de Cuadre de Actas</span>
          </Button>
        )}

        {nextPhase && (
          <Button
            onClick={() => setActivePhase(nextPhase.id)}
            variant={isPhaseComplete ? "default" : "outline"}
            className={`w-full flex items-center justify-center gap-2 font-semibold text-xs font-mono rounded-xl py-5 ${
              isPhaseComplete
                ? "bg-foreground text-background border-foreground shadow-xs"
                : "border-border text-foreground hover:bg-muted/40"
            }`}
          >
            <span>Continuar a {nextPhase.title}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
