"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { getExistingBackgroundForDiff } from "../actions";
import { BackgroundBase } from "@/interfaces/background";

interface FindingDiffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string | null;
  proposedData: Record<string, unknown>;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function FindingDiffDialog({
  open,
  onOpenChange,
  targetId,
  proposedData,
  onApprove,
  onReject,
  isProcessing,
}: FindingDiffDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [existing, setExisting] = React.useState<BackgroundBase | null>(null);

  React.useEffect(() => {
    if (!open || !targetId) {
      return;
    }

    let active = true;
    getExistingBackgroundForDiff(targetId).then((res) => {
      if (active) {
        if (res.success && res.data) {
          setExisting(res.data as unknown as BackgroundBase);
        }
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [open, targetId]);

  const proposedTitle = String(
    proposedData.title || proposedData.titulo || "Sin título",
  );
  const proposedSummary = String(
    proposedData.summary ||
      proposedData.redaccion_final ||
      proposedData.descripcion ||
      "Sin resumen",
  );
  const proposedStatus = String(
    proposedData.status || proposedData.estado || "EN_INVESTIGACION",
  );
  const proposedType = String(
    proposedData.type || proposedData.tipo || "PENAL",
  );
  const proposedSanction = String(
    proposedData.sanction || proposedData.sancion || "Ninguna",
  );
  const proposedDate = String(
    proposedData.publication_date || proposedData.fecha || "No especificada",
  );
  const proposedSource = String(
    proposedData.source ||
      proposedData.fuente_normalizada ||
      proposedData.fuente ||
      "Web",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">ACTUALIZACIÓN (UPDATE)</Badge>
            <DialogTitle>Comparación de Cambios</DialogTitle>
          </div>
          <DialogDescription>
            Revisa las diferencias entre el registro actual en base de datos y
            la propuesta extraída por la IA.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Versión Actual */}
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Versión Actual en Base de Datos
                  </span>
                  {existing && <Badge variant="outline">{existing.type}</Badge>}
                </div>

                {existing ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Título:</p>
                      <p className="text-sm font-semibold">{existing.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Estado Procesal:
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {existing.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Sanción Registrada:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {existing.sanction || "Ninguna"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Resumen / Detalle:
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {existing.summary || "Sin resumen"}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t flex items-center justify-between">
                      <span>
                        Fecha: {existing.publication_date || "No registrada"}
                      </span>
                      <span>Fuente: {existing.source || "Web"}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-8 text-center">
                    No se encontró el registro previo (ID:{" "}
                    {targetId?.substring(0, 8)})
                  </p>
                )}
              </div>

              {/* Propuesta de IA */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Propuesta de Actualización IA
                  </span>
                  <Badge variant="default">{proposedType}</Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Título Propuesto:
                  </p>
                  <p className="text-sm font-semibold text-foreground break-words">
                    {proposedTitle}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Estado Procesal:
                  </p>
                  <Badge
                    variant={
                      proposedStatus !== existing?.status
                        ? "warning"
                        : "default"
                    }
                  >
                    {proposedStatus}
                  </Badge>
                  {existing && proposedStatus !== existing.status && (
                    <span className="text-xs text-warning-foreground font-medium ml-2">
                      (Cambio detectado)
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Sanción Propuesta:
                  </p>
                  <p className="text-sm font-medium break-words">
                    {proposedSanction}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Nuevo Resumen / Redacción:
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {proposedSummary}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-primary/20 flex items-center justify-between">
                  <span>Fecha: {proposedDate}</span>
                  <span
                    className="truncate max-w-[200px]"
                    title={proposedSource}
                  >
                    Fuente: {proposedSource}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={onReject}
                disabled={isProcessing}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
              >
                <X className="h-4 w-4 mr-1" /> Rechazar Propuesta
              </Button>
              <Button
                variant="default"
                onClick={onApprove}
                disabled={isProcessing}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Aprobar y Reemplazar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
