"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaFooter,
  CredenzaClose,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut, X, ShieldCheck } from "lucide-react";

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
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent
        noScroll
        className="w-full sm:max-w-md mx-auto bg-background border-border text-foreground p-0 overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <CredenzaHeader className="shrink-0 text-left px-5 pt-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <CredenzaTitle className="text-base font-black tracking-tight text-foreground">
                ¿Deseas salir del Copiloto?
              </CredenzaTitle>
            </div>
            <CredenzaClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </CredenzaClose>
          </div>
          <CredenzaDescription className="text-xs text-muted-foreground leading-relaxed pt-0.5">
            Estás en el modo protegido de miembro de mesa electoral.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="px-5 py-4 space-y-3">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-600/30 text-xs text-foreground/90 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              <span>Tus datos quedan guardados</span>
            </div>
            <p className="text-muted-foreground">
              Tus tareas marcadas, acuerdos y números de escrutinio permanecen
              en la memoria de este teléfono. Sin embargo, te recomendamos{" "}
              <strong>no salir durante una fase crítica</strong> (como el conteo
              de votos o el cuadre de actas).
            </p>
          </div>
        </CredenzaBody>

        <CredenzaFooter className="shrink-0 flex flex-col gap-2 px-5 py-3.5 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs font-mono font-bold h-10 rounded-xl border-border hover:bg-muted text-foreground"
          >
            Permanecer en la Mesa
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleExit}
            disabled={isConfirming}
            className="w-full text-xs font-mono font-bold h-10 rounded-xl bg-destructive text-white hover:bg-destructive/90 flex items-center justify-center gap-2 shadow-xs"
          >
            <LogOut className="h-4 w-4" />
            <span>{isConfirming ? "Saliendo..." : "Sí, salir a VotaBien"}</span>
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
