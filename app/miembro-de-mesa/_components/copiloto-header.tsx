"use client";

import { useState } from "react";
import { useCopilotoStore } from "../_lib/store";
import { PHASES_CONFIG } from "../_lib/constants";
import { ExitGuardDialog } from "./exit-guard-dialog";
import { ProtocolsSheet } from "./protocols-sheet";
import { RoleSelectorDialog } from "./role-selector-dialog";
import { QrSyncDialog } from "./qr-sync-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  RotateCcw,
  HelpCircle,
  UserCheck,
  QrCode,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  presidente: "Presidente",
  secretario: "Secretario",
  tercer_miembro: "3er Miembro",
  todos: "Mesa Completa",
};

export function CopilotoHeader() {
  const [showExitModal, setShowExitModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showProtocolsSheet, setShowProtocolsSheet] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const selectedRole = useCopilotoStore((s) => s.selectedRole);
  const setSelectedRole = useCopilotoStore((s) => s.setSelectedRole);
  const completedTasks = useCopilotoStore((s) => s.completedTasks);
  const resetAllData = useCopilotoStore((s) => s.resetAllData);

  const isRoleModalOpen = showRoleModal || selectedRole === null;

  const totalTasksCount = PHASES_CONFIG.reduce(
    (acc, phase) => acc + phase.tasks.length,
    0,
  );
  const doneTasksCount = Object.values(completedTasks).filter(Boolean).length;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur-md px-3 sm:px-6 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Izquierda: Salir al menú (sin desbordes) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitModal(true)}
            className="text-xs font-mono text-muted-foreground hover:text-foreground h-8 px-1.5 sm:px-2 shrink-0 -ml-1 sm:-ml-2"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5 sm:mr-1" />
            <span>Salir</span>
            <span className="hidden sm:inline ml-1">al menú</span>
          </Button>

          {/* Derecha: QR Sync + Rol + Contador 0/27 + Ayuda (?) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Botón QR Sync */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQrModal(true)}
              className="h-7 sm:h-8 px-2 text-[10.5px] sm:text-xs font-mono font-bold border-border/80 text-foreground hover:bg-muted rounded-lg flex items-center gap-1 shrink-0"
              title="Sincronizar mesa con otro miembro vía QR"
            >
              <QrCode className="h-3.5 w-3.5 text-brand" />
              <span className="hidden sm:inline">QR Sync</span>
            </Button>

            {/* Rol de mesa con color sutil según cargo */}
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-mono font-semibold border transition-colors shrink-0 ${
                selectedRole === "presidente"
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                  : selectedRole === "secretario"
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                    : selectedRole === "tercer_miembro"
                      ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                      : "bg-muted/60 text-foreground border-border/80"
              }`}
              title="Cambiar tu rol en la mesa"
            >
              <UserCheck className="h-3 w-3" />
              <span>
                {selectedRole ? ROLE_LABELS[selectedRole] : "Elegir Rol"}
              </span>
            </button>

            {/* Contador de tareas */}
            <span className="text-[11px] sm:text-xs font-mono text-muted-foreground px-1.5 sm:px-2 py-1 rounded-lg bg-muted/40 border border-border/60 shrink-0">
              {doneTasksCount}/{totalTasksCount}
            </span>

            {/* Guía legal y protocolos */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setShowProtocolsSheet(true)}
              title="Guía legal y protocolos ONPE"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* QR Sync Modal */}
      <QrSyncDialog open={showQrModal} onOpenChange={setShowQrModal} />

      {/* Role Selection Modal */}
      <RoleSelectorDialog
        open={isRoleModalOpen}
        onOpenChange={(open) => {
          setShowRoleModal(open);
          if (!open && selectedRole === null) {
            setSelectedRole("todos");
          }
        }}
      />

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
              Se borrarán los checks, los votos, los acuerdos asignados y tu
              selección de rol.
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
