"use client";

import { useState } from "react";
import { useCopilotoStore } from "../_lib/store";
import { PHASES_CONFIG } from "../_lib/constants";
import { ExitGuardDialog } from "./exit-guard-dialog";
import { ProtocolsSheet } from "./protocols-sheet";
import { RoleSelectorDialog } from "./role-selector-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RotateCcw, HelpCircle, UserCheck } from "lucide-react";

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
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur-md px-4 sm:px-6 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Izquierda: Salir al menú (estilo Simulador) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitModal(true)}
            className="text-xs font-mono text-muted-foreground hover:text-foreground h-8 px-2 -ml-2"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Salir al menú
          </Button>

          {/* Derecha: Rol + Contador 0/27 + Ayuda (?) */}
          <div className="flex items-center gap-2">
            {/* Rol de mesa */}
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-muted/60 text-foreground border border-border/80 hover:bg-muted transition-colors"
              title="Cambiar tu rol en la mesa"
            >
              <UserCheck className="h-3 w-3 text-brand" />
              <span>
                {selectedRole ? ROLE_LABELS[selectedRole] : "Elegir Rol"}
              </span>
            </button>

            {/* Contador de tareas */}
            <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded-lg bg-muted/40 border border-border/60">
              {doneTasksCount}/{totalTasksCount}
            </span>

            {/* Guía legal y protocolos */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setShowProtocolsSheet(true)}
              title="Guía legal y protocolos ONPE"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

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
              Se borrarán los checks, los votos y tu selección de rol.
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
