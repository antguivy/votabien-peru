"use client";

import { useCopilotoStore } from "../_lib/store";
import { PHASES_CONFIG } from "../_lib/constants";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  UserCheck,
  Shield,
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Phase Stepper Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
              className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                isCurrent
                  ? "bg-zinc-900 border-blue-500 shadow-md shadow-blue-950/50"
                  : isFinished
                    ? "bg-emerald-950/20 border-emerald-800/50 hover:bg-emerald-950/30"
                    : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Paso {idx + 1}
                </span>
                {isFinished ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[10px] font-mono text-zinc-500">
                    {doneInPhase}/{phase.tasks.length}
                  </span>
                )}
              </div>
              <p
                className={`text-xs sm:text-sm font-semibold truncate ${
                  isCurrent
                    ? "text-blue-400"
                    : isFinished
                      ? "text-emerald-300"
                      : "text-zinc-200"
                }`}
              >
                {phase.title.replace(/^\d+\.\s*/, "")}
              </p>
              {isCurrent && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Phase Header Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {currentPhaseConfig.title}
              </h2>
              <Badge
                variant="outline"
                className="bg-zinc-800 text-zinc-300 border-zinc-700 text-xs font-mono"
              >
                <Clock className="h-3 w-3 mr-1 text-blue-400" />
                {currentPhaseConfig.timeframe}
              </Badge>
            </div>
            <p className="text-sm text-zinc-400">
              {currentPhaseConfig.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono text-zinc-400">Progreso:</span>
            <div className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-950/60 border border-blue-800/80 text-blue-300">
              {phaseDoneCount} de {phaseTotalCount} completadas
            </div>
          </div>
        </div>

        {/* Critical Blocker Banner for this Phase */}
        {currentPhaseConfig.warningAlert && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-amber-200">
            <AlertOctagon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm leading-relaxed font-medium">
              {currentPhaseConfig.warningAlert}
            </p>
          </div>
        )}
      </div>

      {/* Task Checklist Items */}
      <div className="space-y-3">
        {currentPhaseTasks.map((task, index) => {
          const isDone = !!completedTasks[task.id];

          return (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer select-none ${
                isDone
                  ? "bg-zinc-950/60 border-zinc-800/80 opacity-70 hover:opacity-100"
                  : task.isCritical
                    ? "bg-zinc-900 border-zinc-750 hover:border-blue-500/50 shadow-sm"
                    : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Custom Tap Checkbox */}
                <div className="pt-0.5">
                  <div
                    className={`h-6 w-6 rounded-lg flex items-center justify-center border transition-all ${
                      isDone
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-600/30"
                        : task.isCritical
                          ? "border-amber-500/60 bg-amber-500/10 hover:border-amber-400"
                          : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                    }`}
                  >
                    {isDone && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">
                        #{index + 1}
                      </span>
                      <h3
                        className={`text-sm sm:text-base font-bold leading-snug ${
                          isDone
                            ? "line-through text-zinc-400"
                            : "text-zinc-100"
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {task.roleResponsible && (
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-medium bg-zinc-800 text-zinc-300 border-zinc-700"
                        >
                          <UserCheck className="h-3 w-3 mr-1 text-zinc-400" />
                          {task.roleResponsible}
                        </Badge>
                      )}
                      {task.isCritical && (
                        <Badge className="text-[10px] uppercase font-bold tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Crítico
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Irreversible Blocker Warning Box */}
                  {task.irreversibleWarning && !isDone && (
                    <div className="mt-2.5 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 flex items-start gap-2.5 text-rose-200 text-xs sm:text-sm">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-300 uppercase tracking-wide mr-1.5">
                          ¡Punto de no retorno!
                        </span>
                        {task.irreversibleWarning}
                      </div>
                    </div>
                  )}

                  {task.legalNote && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-400 font-mono">
                      <Shield className="h-3 w-3 text-blue-400" />
                      <span>{task.legalNote}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer for this Phase */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        {activePhase === "escrutinio" && (
          <Button
            onClick={() => setActiveTab("calculadora")}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30"
          >
            <Calculator className="h-4 w-4" />
            Abrir Calculadora de Cuadre de Actas
          </Button>
        )}

        {nextPhase && (
          <Button
            onClick={() => setActivePhase(nextPhase.id)}
            variant={isPhaseComplete ? "default" : "outline"}
            className={`w-full sm:w-auto ml-auto flex items-center justify-center gap-2 font-semibold ${
              isPhaseComplete
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/40"
                : "border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <span>Pasar a {nextPhase.title}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
