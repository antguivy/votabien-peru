"use client";

import { PROTOCOLS_LIST } from "../_lib/constants";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtocolsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenResetModal: () => void;
}

export function ProtocolsSheet({
  open,
  onOpenChange,
  onOpenResetModal,
}: ProtocolsSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] px-4 pb-8 outline-none bg-background border-border">
        <DrawerHeader className="text-left px-0 pb-2">
          <div className="flex items-center gap-2 text-brand mb-1">
            <BookOpen className="h-5 w-5" />
            <DrawerTitle className="text-lg font-black tracking-tight text-foreground">
              Guía Legal & Protocolos ONPE
            </DrawerTitle>
          </div>
          <DrawerDescription className="text-xs text-muted-foreground">
            Respuestas rápidas para contingencias durante la jornada electoral.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto space-y-4 py-3 pr-1">
          {/* Ley 32231 Highlight */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Award className="h-4 w-4 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Beneficio Laboral: Ley Nº 32231
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Todos los miembros de mesa que cumplan su función tienen derecho a
              un <strong>día de descanso remunerado no compensable</strong> el
              día lunes posterior a las elecciones, tanto en sector público como
              privado.
            </p>
          </div>

          {/* Protocols List */}
          {PROTOCOLS_LIST.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-2xl bg-card border border-border space-y-2.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-foreground leading-snug">
                  {p.title}
                </h4>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-border shrink-0"
                >
                  {p.legalReference.split(" - ")[0]}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {p.summary}
              </p>

              <div className="space-y-1.5 pt-1">
                {p.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-[11.5px] text-foreground/90 bg-muted/30 p-2 rounded-xl border border-border/50"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand font-mono text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-tight">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Action to reset */}
          <div className="pt-2 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenResetModal();
              }}
              className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10 flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar datos de práctica de la mesa
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
