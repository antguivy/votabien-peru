"use client";

import { useState, useSyncExternalStore } from "react";
import { useCopilotoStore } from "../_lib/store";
import { PHASES_CONFIG } from "../_lib/constants";
import { ExitGuardDialog } from "./exit-guard-dialog";
import { ProtocolsSheet } from "./protocols-sheet";
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
  const [showProtocolsSheet, setShowProtocolsSheet] = useState(false);

  const completedTasks = useCopilotoStore((s) => s.completedTasks);
  const resetAllData = useCopilotoStore((s) => s.resetAllData);

  const totalTasksCount = PHASES_CONFIG.reduce(
    (acc, phase) => acc + phase.tasks.length,
    0,
  );
  const doneTasksCount = Object.values(completedTasks).filter(Boolean).length;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Identity */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-foreground truncate">
                  Mesa ONPE
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-brand/15 text-brand uppercase">
                  2026
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                Copiloto de Sufragio
              </p>
            </div>
          </div>

          {/* Quick Status & Actions */}
          <div className="flex items-center gap-1.5">
            {/* Minimal Offline / Online Indicator */}
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 font-medium border ${
                isOnline
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-warning/10 border-warning/30 text-warning animate-pulse"
              }`}
            >
              {isOnline ? (
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  <span className="hidden xs:inline">Online</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </span>
              )}
            </Badge>

            {/* Progress Count */}
            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border">
              {doneTasksCount}/{totalTasksCount}
            </span>

            {/* Help / Protocols Drawer Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowProtocolsSheet(true)}
              title="Preguntas frecuentes y leyes"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* Safe Exit Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => setShowExitModal(true)}
              title="Salir a VotaBien"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Protocols & Help Drawer */}
      <ProtocolsSheet
        open={showProtocolsSheet}
        onOpenChange={setShowProtocolsSheet}
        onOpenResetModal={() => setShowResetModal(true)}
      />

      {/* Exit Guard Modal */}
      <ExitGuardDialog open={showExitModal} onOpenChange={setShowExitModal} />

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="max-w-xs bg-background border-border text-foreground">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <RotateCcw className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                ¿Reiniciar datos?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Se borrarán los checks y los votos ingresados en la calculadora.
              Útil si estás practicando antes de la jornada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetModal(false)}
              className="text-xs border-border"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                resetAllData();
                setShowResetModal(false);
              }}
              className="text-xs font-semibold"
            >
              Reiniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
