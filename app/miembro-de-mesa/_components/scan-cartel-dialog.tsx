"use client";

import { useState, useRef } from "react";
import { useCopilotoStore } from "../_lib/store";
import { ElectionType } from "../_lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Sparkles,
  Upload,
  Check,
  ListPlus,
  RefreshCw,
  X,
} from "lucide-react";

interface ScanCartelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSheetType: ElectionType;
}

export function ScanCartelDialog({
  open,
  onOpenChange,
  activeSheetType,
}: ScanCartelDialogProps) {
  const setSheetOptions = useCopilotoStore((s) => s.setSheetOptions);
  const loadOfficialPartiesPreset = useCopilotoStore(
    (s) => s.loadOfficialPartiesPreset,
  );
  const copyOptionsToAllSheets = useCopilotoStore(
    (s) => s.copyOptionsToAllSheets,
  );

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [partiesText, setPartiesText] = useState("");
  const [applyToAllSheets, setApplyToAllSheets] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setIsProcessing(true);
      setPartiesText("");

      try {
        // Extraer solo el base64 crudo (sin el prefijo data:image/...;base64,)
        const base64 = dataUrl.split(",")[1];
        const mimeType = file.type || "image/jpeg";

        const response = await fetch("/api/miembro-de-mesa/scan-cartel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64, mime_type: mimeType }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(
            (err as { detail?: string }).detail ||
              "Error al reconocer el cartel.",
          );
        }

        const data = (await response.json()) as { parties: string[] };
        setPartiesText(data.parties.join("\n"));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error inesperado.";
        setPartiesText(`ERROR: ${message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = () => {
    loadOfficialPartiesPreset(activeSheetType);
    if (applyToAllSheets) {
      copyOptionsToAllSheets(activeSheetType);
    }
    onOpenChange(false);
  };

  const handleApplyCustomList = () => {
    const lines = partiesText
      .split("\n")
      .map((l) => l.replace(/^\d+[\.\-\)]\s*/, "").trim())
      .filter(Boolean);

    if (lines.length > 0) {
      const options = lines.map((name, idx) => ({
        id: `opt-scan-${idx + 1}-${Date.now()}`,
        name,
        votes: 0,
      }));
      setSheetOptions(activeSheetType, options);
      if (applyToAllSheets) {
        copyOptionsToAllSheets(activeSheetType);
      }
    }
    onOpenChange(false);
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent
        noScroll
        showCloseButton={false}
        className="w-full sm:max-w-md mx-auto max-h-[90vh] bg-background border-border text-foreground p-0 overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <CredenzaHeader className="shrink-0 text-left px-5 pt-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand">
              <Camera className="h-4 w-4" />
              <CredenzaTitle className="text-base font-black tracking-tight text-foreground">
                Cargar Partidos · Hoja {activeSheetType}
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
          <CredenzaDescription className="text-xs text-muted-foreground leading-snug pt-1">
            Evita tipear uno por uno. Sacale foto al Cartel de Candidatos pegado
            en la pared del aula o cargá la lista oficial.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="flex-1 min-h-0 space-y-3 px-5 py-4 overflow-y-auto">
          {/* Toggle: Aplicar a todas las hojas de la mesa */}
          <button
            type="button"
            onClick={() => setApplyToAllSheets((v) => !v)}
            className="w-full p-3 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between text-left transition-colors select-none hover:bg-muted/50"
          >
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-foreground block">
                Aplicar a todas las hojas de la mesa
              </span>
              <span className="text-[10.5px] text-muted-foreground block leading-tight">
                Copia las mismas organizaciones a 5B, 5C y 5D con votos en 0
              </span>
            </div>
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                applyToAllSheets
                  ? "bg-foreground text-background border-foreground shadow-2xs"
                  : "border-border bg-background"
              }`}
            >
              {applyToAllSheets && <Check className="h-3.5 w-3.5" />}
            </div>
          </button>

          {/* Opción A: Lista Oficial Nacional (100% Offline) */}
          <div className="p-3.5 rounded-2xl bg-brand/10 border border-brand/25 space-y-2">
            <div className="flex items-center gap-2 text-brand">
              <Sparkles className="h-4 w-4 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Lista Oficial Nacional (Sin internet)
              </h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Carga automática de las organizaciones políticas en orden oficial
              ONPE.
            </p>
            <Button
              type="button"
              onClick={handleApplyPreset}
              className="w-full h-9 text-xs font-bold bg-brand text-brand-foreground shadow-sm rounded-xl"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Cargar Lista de Partidos
            </Button>
          </div>

          {/* Opción B: Foto al Cartel con IA */}
          <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2.5">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-brand" />
                <span>Foto al Cartel de Candidatos del Aula</span>
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                La Inteligencia Artificial lee los partidos de la foto en un
                segundo.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />

            {!imagePreview ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-16 border-dashed border-2 border-border hover:border-brand flex flex-col items-center justify-center gap-1 rounded-xl text-xs text-muted-foreground font-mono"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span>Tomar foto o subir imagen</span>
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-border h-28 bg-black/5 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Cartel Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-mono font-bold text-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin text-brand" />
                      <span>Reconociendo listas con IA...</span>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImagePreview(null);
                    setPartiesText("");
                  }}
                  className="text-[11px] text-muted-foreground h-6 px-2"
                >
                  Cambiar foto
                </Button>
              </div>
            )}

            {partiesText && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[10.5px] font-mono text-muted-foreground block">
                  Listas detectadas (puedes editar antes de aplicar):
                </label>
                <Textarea
                  value={partiesText}
                  onChange={(e) => setPartiesText(e.target.value)}
                  rows={5}
                  className="text-xs font-mono bg-background border-border rounded-xl"
                />
                <Button
                  type="button"
                  onClick={handleApplyCustomList}
                  className="w-full h-9 text-xs font-bold bg-foreground text-background hover:bg-foreground/90 rounded-xl mt-1"
                >
                  <ListPlus className="h-3.5 w-3.5 mr-1.5" />
                  Aplicar estas organizaciones
                </Button>
              </div>
            )}
          </div>
        </CredenzaBody>

        <CredenzaFooter className="shrink-0 px-5 py-3 border-t border-border/60 bg-muted/20 flex justify-end">
          <CredenzaClose asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-mono rounded-xl"
            >
              Cerrar
            </Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
