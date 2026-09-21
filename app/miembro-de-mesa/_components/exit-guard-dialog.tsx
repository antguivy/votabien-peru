"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut } from "lucide-react";

interface ExitGuardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExitGuardDialog({ open, onOpenChange }: ExitGuardDialogProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleExit = () => {
    setIsConfirming(true);
    router.push("/");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold">
              ¿Deseas salir del Copiloto de Mesa?
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-300 text-sm leading-relaxed">
            Estás en el modo protegido de miembro de mesa. Tus datos guardados
            permanecerán en este dispositivo, pero asegúrate de no cerrar la app
            durante una fase crítica (como el conteo de escrutinio).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700 hover:bg-zinc-800 text-zinc-200"
          >
            Permanecer en la Mesa
          </Button>
          <Button
            variant="destructive"
            onClick={handleExit}
            disabled={isConfirming}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isConfirming ? "Saliendo..." : "Sí, salir a VotaBien"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
