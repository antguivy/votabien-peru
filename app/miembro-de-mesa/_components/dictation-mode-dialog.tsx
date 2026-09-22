"use client";

import { useState } from "react";
import { ElectionSheetState } from "../_lib/types";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaFooter,
  CredenzaClose,
} from "@/components/ui/credenza";
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
    let text = `RESUMEN DE MESA — ONPE 2026\n`;
    text += `Acta de Escrutinio: Hoja ${sheet.type} — ${sheet.title}\n`;
    text += `Total Ciudadanos que Votaron: ${votersTarget}\n`;
    text += `Total Votos Emitidos: ${totalVotes}\n`;
    text += `Estado: CUADRADO EXACTO\n\n`;
    text += `--- VOTOS POR ORGANIZACIÓN ---\n`;
    sheet.options.forEach((opt, idx) => {
      text += `${idx + 1}. ${opt.name}: ${opt.votes}\n`;
    });
    text += `\n--- VOTOS EN BLANCO, NULOS E IMPUGNADOS ---\n`;
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
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent
        noScroll
        className="w-full sm:max-w-md mx-auto h-[95dvh] max-h-[95dvh] bg-background border-border text-foreground p-0 flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Pinned Header: Title, Election Name and Status Badge */}
        <CredenzaHeader className="shrink-0 text-left px-5 pt-3.5 pb-2.5 border-b border-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand">
              <Lock className="h-4 w-4" />
              <CredenzaTitle className="text-base font-black tracking-tight text-foreground">
                Dictado al Acta Oficial
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

          {/* Prominent Election Name and Status Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-foreground text-background shrink-0">
                HOJA {sheet.type}
              </span>
              <span className="text-xs sm:text-sm font-black text-foreground uppercase tracking-tight truncate">
                {sheet.title}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/30 shrink-0">
              {totalVotes} votos · Cuadrado
            </span>
          </div>
        </CredenzaHeader>

        {/* Scrollable Body: Directly parties and non-valid votes without redundant banners */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-3">
          {/* Parties List */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono text-muted-foreground font-bold tracking-wider block">
              Resultados por Partido (Copiar en este orden):
            </span>

            <div className="space-y-1.5">
              {sheet.options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/80 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <span className="text-xs font-mono font-bold text-brand shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-foreground leading-snug break-words">
                      {opt.name}
                    </span>
                  </div>
                  <div className="w-12 h-8 rounded-lg bg-muted/40 border border-border/70 flex items-center justify-center shrink-0">
                    <span className="text-base font-mono font-black text-foreground">
                      {opt.votes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Votos no válidos */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground font-bold tracking-wider block">
              Votos en Blanco, Nulos e Impugnados:
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-card border border-border/80 text-center space-y-0.5">
                <span className="text-[9.5px] font-mono text-muted-foreground block">
                  Blancos
                </span>
                <span className="text-base font-mono font-black text-foreground">
                  {sheet.whiteVotes}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-card border border-border/80 text-center space-y-0.5">
                <span className="text-[9.5px] font-mono text-muted-foreground block">
                  Nulos
                </span>
                <span className="text-base font-mono font-black text-destructive">
                  {sheet.nullVotes}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-card border border-border/80 text-center space-y-0.5">
                <span className="text-[9.5px] font-mono text-muted-foreground block">
                  Impugnados
                </span>
                <span className="text-base font-mono font-black text-amber-600 dark:text-amber-400">
                  {sheet.impugnedVotes}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Single row with 2 columns */}
        <CredenzaFooter className="shrink-0 grid grid-cols-2 gap-2 px-5 py-3 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full text-xs font-mono font-bold rounded-xl h-10 border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar Resumen</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full text-xs font-mono font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl h-10 shadow-xs flex items-center justify-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
