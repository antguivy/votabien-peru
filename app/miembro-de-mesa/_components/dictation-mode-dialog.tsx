"use client";

import { useState } from "react";
import { ElectionSheetState } from "../_lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Copy, Check, Share2, X } from "lucide-react";

interface DictationModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheet: ElectionSheetState;
  votersTarget: number;
}

export function DictationModeDialog({
  open,
  onOpenChange,
  sheet,
  votersTarget,
}: DictationModeDialogProps) {
  const [copied, setCopied] = useState(false);

  const validVotes = sheet.options.reduce(
    (acc, opt) => acc + (Number(opt.votes) || 0),
    0,
  );
  const totalVotes =
    validVotes +
    (Number(sheet.whiteVotes) || 0) +
    (Number(sheet.nullVotes) || 0) +
    (Number(sheet.impugnedVotes) || 0);

  const generateSummaryText = () => {
    let text = `🗳️ RESUMEN DE MESA — ONPE ERM 2026\n`;
    text += `Elección: ${sheet.title} (${sheet.type})\n`;
    text += `Total Votantes del Padrón: ${votersTarget}\n`;
    text += `Total Votos Emitidos: ${totalVotes}\n`;
    text += `Estado: ${totalVotes === votersTarget ? "✓ CUADRADO EXACTO" : "⚠️ DESCUADRADO"}\n\n`;
    text += `--- VOTOS POR ORGANIZACIÓN ---\n`;
    sheet.options.forEach((opt, idx) => {
      text += `${idx + 1}. ${opt.name}: ${opt.votes}\n`;
    });
    text += `\n--- VOTOS NO VÁLIDOS ---\n`;
    text += `Blancos: ${sheet.whiteVotes}\n`;
    text += `Nulos: ${sheet.nullVotes}\n`;
    text += `Impugnados: ${sheet.impugnedVotes}\n`;
    text += `\nGenerado con Copiloto de Mesa VotaBien`;
    return text;
  };

  const handleCopy = () => {
    const text = generateSummaryText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateSummaryText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[95vh] overflow-y-auto bg-background border-border p-4 text-foreground">
        <DialogHeader className="text-left pb-2 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand">
              <Lock className="h-4 w-4" />
              <DialogTitle className="text-base font-black tracking-tight text-foreground">
                Modo Dictado al Acta Oficial
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Pantalla protegida contra toques accidentales. Dictale al Secretario
            mientras llena la Sección C del Acta Oficial con lapicero negro.
          </p>
        </DialogHeader>

        {/* Big Numbers Dictation List */}
        <div className="space-y-2 py-2">
          {/* Header Metric */}
          <div className="p-3 rounded-2xl bg-success/15 border border-success/30 text-success flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono font-bold">
                Total a Consignar en Acta
              </span>
              <div className="text-xl font-black font-mono">
                {totalVotes} VOTOS
              </div>
            </div>
            <div className="text-right text-[10px] font-mono">
              <div>Padrón: {votersTarget}</div>
              <div className="font-bold">✓ CUADRADO</div>
            </div>
          </div>

          {/* Parties List */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider block">
              Resultados por Partido (Copiar en este orden):
            </span>

            {sheet.options.map((opt, idx) => (
              <div
                key={opt.id}
                className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-muted-foreground mr-1">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-foreground truncate">
                    {opt.name}
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-brand px-2 py-0.5 rounded-lg bg-brand/10 shrink-0">
                  {opt.votes}
                </div>
              </div>
            ))}
          </div>

          {/* Special Non-valid votes */}
          <div className="pt-2 space-y-1.5 border-t border-border/60">
            <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider block">
              Votos en Blanco, Nulos e Impugnados:
            </span>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="p-2 rounded-xl bg-muted/40 border border-border text-center space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">
                  Blancos
                </span>
                <span className="text-base font-black font-mono text-foreground">
                  {sheet.whiteVotes}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-muted/40 border border-border text-center space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">
                  Nulos
                </span>
                <span className="text-base font-black font-mono text-foreground">
                  {sheet.nullVotes}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-muted/40 border border-border text-center space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">
                  Impugnados
                </span>
                <span className="text-base font-black font-mono text-foreground">
                  {sheet.impugnedVotes}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Share & Copy Actions */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            onClick={handleCopy}
            className="w-full text-xs font-bold h-9 bg-brand text-brand-foreground rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>¡Copiado al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar Resumen para Guardar</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleShareWhatsApp}
            className="w-full text-xs font-semibold h-9 border-border text-foreground hover:bg-muted rounded-xl flex items-center justify-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5 text-success" />
            <span>Compartir Acta por WhatsApp</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
