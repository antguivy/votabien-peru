"use client";

import { useCopilotoStore } from "../_lib/store";
import { PHASES_CONFIG } from "../_lib/constants";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calculator,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TabChecklist() {
  const activePhase = useCopilotoStore((s) => s.activePhase);
  const setActivePhase = useCopilotoStore((s) => s.setActivePhase);
  const completedTasks = useCopilotoStore((s) => s.completedTasks);
  const toggleTask = useCopilotoStore((s) => s.toggleTask);
  const setActiveTab = useCopilotoStore((s) => s.setActiveTab);

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
  const phaseDoneCount = currentPhaseTasks.filter(
    (t) => completedTasks[t.id],
  ).length;
  const phaseTotalCount = currentPhaseTasks.length;
  const isPhaseComplete = phaseDoneCount === phaseTotalCount;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Horizontal Scrollable Phase Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar -mx-1 px-1">
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
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none active:scale-95 ${
                isCurrent
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : isFinished
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              <span>
                {idx + 1}. {phase.title.replace(/^\d+\.\s*/, "")}
              </span>
              {isFinished && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Phase Active Header Card */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Clock className="h-3.5 w-3.5 text-brand" />
            <span>{currentPhaseConfig.timeframe}</span>
          </div>

          <Badge
            variant="outline"
            className="text-[10px] font-mono border-border bg-muted/30"
          >
            {phaseDoneCount} de {phaseTotalCount} completadas
          </Badge>
        </div>

        <div>
          <h2 className="text-lg font-black tracking-tight text-foreground">
            {currentPhaseConfig.title}
          </h2>
          <p className="text-xs text-muted-foreground leading-snug">
            {currentPhaseConfig.subtitle}
          </p>
        </div>

        {/* Phase Blocker Alert */}
        {currentPhaseConfig.warningAlert && (
          <div className="rounded-xl bg-warning/10 border border-warning/25 p-2.5 flex items-start gap-2 text-warning text-xs">
            <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">
              {currentPhaseConfig.warningAlert}
            </p>
          </div>
        )}
      </div>

      {/* Task Checklist Items */}
      <div className="space-y-2.5">
        {currentPhaseTasks.map((task, index) => {
          const isDone = !!completedTasks[task.id];

          return (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`rounded-2xl border p-3.5 transition-all select-none cursor-pointer active:scale-[0.99] ${
                isDone
                  ? "bg-muted/20 border-border/40 opacity-70"
                  : task.isCritical
                    ? "bg-card border-border hover:border-brand/40 shadow-sm"
                    : "bg-card border-border/80"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Large Clean Checkbox Target */}
                <div className="pt-0.5">
                  <div
                    className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all ${
                      isDone
                        ? "bg-success border-success text-white shadow-sm"
                        : "border-muted-foreground/40 bg-background"
                    }`}
                  >
                    {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                </div>

                {/* Task Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-xs font-bold leading-snug ${
                        isDone
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      <span className="text-muted-foreground font-mono mr-1">
                        #{index + 1}
                      </span>
                      {task.title}
                    </h3>

                    {task.roleResponsible && (
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                        {task.roleResponsible}
                      </span>
                    )}
                  </div>

                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    {task.description}
                  </p>

                  {/* Irreversible Blocker Callout */}
                  {task.irreversibleWarning && !isDone && (
                    <div className="mt-2 rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 flex items-start gap-2 text-destructive text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block uppercase text-[10px] tracking-wider mb-0.5">
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

      {/* Phase Footer Navigation */}
      <div className="pt-2 space-y-2">
        {activePhase === "escrutinio" && (
          <Button
            onClick={() => setActiveTab("calculadora")}
            className="w-full bg-brand text-brand-foreground font-bold flex items-center justify-center gap-2 shadow-sm rounded-xl py-5"
          >
            <Calculator className="h-4 w-4" />
            <span>Abrir Calculadora de Cuadre</span>
          </Button>
        )}

        {nextPhase && (
          <Button
            onClick={() => setActivePhase(nextPhase.id)}
            variant={isPhaseComplete ? "default" : "outline"}
            className={`w-full flex items-center justify-center gap-2 font-semibold text-xs rounded-xl py-5 ${
              isPhaseComplete
                ? "bg-brand text-brand-foreground shadow-sm"
                : "border-border text-foreground"
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
