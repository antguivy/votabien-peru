"use client";

import { useState, useSyncExternalStore } from "react";
import { useCopilotoStore } from "../_lib/store";
import { PHASES_CONFIG } from "../_lib/constants";
import { ExitGuardDialog } from "./exit-guard-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  Wifi,
  WifiOff,
  RotateCcw,
  LogOut,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export function CopilotoHeader() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  const [showExitModal, setShowExitModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const completedTasks = useCopilotoStore((s) => s.completedTasks);
  const resetAllData = useCopilotoStore((s) => s.resetAllData);
  const setActiveTab = useCopilotoStore((s) => s.setActiveTab);

  const totalTasksCount = PHASES_CONFIG.reduce(
    (acc, phase) => acc + phase.tasks.length,
    0,
  );
  const doneTasksCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = Math.round(
    (doneTasksCount / (totalTasksCount || 1)) * 100,
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-3 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          {/* Logo & Identity */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
                  Copiloto de Mesa
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    ONPE 2026
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Asistente Operativo y Validador Anti-Errores
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Offline Status */}
            <Badge
              variant="outline"
              className={`text-[11px] px-2 py-0.5 font-medium flex items-center gap-1 border ${
                isOnline
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-amber-950/40 border-amber-800 text-amber-300 animate-pulse"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span className="hidden sm:inline">Modo</span> Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>100% Offline</span>
                </>
              )}
            </Badge>

            {/* Checklist Progress Pill */}
            <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              <CheckCircle2 className="h-3 w-3 text-blue-400" />
              <span>
                {doneTasksCount}/{totalTasksCount}
              </span>
              <span className="text-zinc-500 hidden sm:inline">
                ({progressPercent}%)
              </span>
            </div>

            {/* Protocol FAQ shortcut */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              onClick={() => setActiveTab("protocolos")}
              title="Preguntas frecuentes y protocolos"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* Reset data */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              onClick={() => setShowResetModal(true)}
              title="Reiniciar mesa"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {/* Safe Exit */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center gap-1.5"
              onClick={() => setShowExitModal(true)}
            >
              <LogOut className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Exit Guard Modal */}
      <ExitGuardDialog open={showExitModal} onOpenChange={setShowExitModal} />

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-400 mb-1">
              <RotateCcw className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                ¿Reiniciar todos los datos de la mesa?
              </DialogTitle>
            </div>
            <DialogDescription className="text-zinc-300 text-sm">
              Esta acción borrará todas las tareas marcadas, los totales del
              padrón y los votos ingresados en la calculadora. Úsalo solo si
              estás practicando o configurando una nueva jornada de sufragio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowResetModal(false)}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetAllData();
                setShowResetModal(false);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Sí, reiniciar todo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
