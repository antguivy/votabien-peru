"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { BrainCircuit, ExternalLink, Save, User, Users } from "lucide-react";
import { BillStatusBadge } from "./bill-status-badge";
import {
  billApprovalStatuses,
  AdminBillRow,
  BillApprovalStatusType,
} from "../_lib/validation";
import { updateBillAction, regenerateBillTitleAction } from "../_lib/actions";

interface BillDetailDialogProps {
  bill: AdminBillRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function BillDetailContent({
  bill,
  onClose,
}: {
  bill: AdminBillRow;
  onClose: () => void;
}) {
  const [titleAi, setTitleAi] = React.useState(bill.title_ai || "");
  const [summary, setSummary] = React.useState(bill.summary || "");
  const [status, setStatus] = React.useState<BillApprovalStatusType>(
    bill.approval_status || "PRESENTADO",
  );
  const [documentUrl, setDocumentUrl] = React.useState(bill.document_url || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await updateBillAction(bill.id, {
        title_ai: titleAi.trim() || null,
        summary: summary.trim() || null,
        approval_status: status,
        document_url: documentUrl.trim() || null,
      });

      if (res.success) {
        toast.success("Proyecto de ley actualizado correctamente.");
        onClose();
      } else {
        toast.error(res.error || "Error al actualizar.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al guardar cambios.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateAi = async () => {
    try {
      setIsRegenerating(true);
      toast.info("Generando título ciudadano con Gemini 2.5 Flash...");
      const res = await regenerateBillTitleAction(bill.id);

      if (res.success && res.data) {
        setTitleAi(res.data.title_ai || "");
        setSummary(res.data.summary || "");
        toast.success("¡Título ciudadano generado con IA exitosamente!");
      } else {
        toast.error(res.error || "No se pudo generar el título con IA.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error conectando con el servicio de IA.";
      toast.error(message);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm px-2 py-0.5 rounded bg-muted font-bold text-foreground">
            {bill.number}
          </span>
          <BillStatusBadge status={status} />
          {bill.period && (
            <span className="text-xs text-muted-foreground font-medium border border-border rounded px-1.5 py-0.5">
              {bill.period}
            </span>
          )}
        </div>
        <DialogTitle className="text-lg font-bold leading-snug pt-2">
          Detalle del Proyecto de Ley
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Revisa la información oficial del Congreso y gestiona el título
          ciudadano generado con IA.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Título Oficial */}
        <div className="space-y-1.5 bg-muted/40 p-3 rounded-lg border border-border/60">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Título Oficial (Congreso)
          </Label>
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {bill.title || "Sin título oficial"}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 p-2.5 rounded-md border bg-card">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="truncate">
              <p className="text-xs text-muted-foreground">Autor Principal</p>
              <p className="font-medium truncate">
                {bill.legislator?.person?.fullname ||
                  bill.sponsor ||
                  "No asignado"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-md border bg-card">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="truncate">
              <p className="text-xs text-muted-foreground">Bancada / Grupo</p>
              <p className="font-medium truncate">
                {bill.parliamentarygroup?.name || "Sin bancada registrada"}
              </p>
            </div>
          </div>
        </div>

        {/* Título Ciudadano con IA */}
        <div className="space-y-2 border border-primary/20 bg-primary/5 p-3.5 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BrainCircuit className="h-4 w-4 text-primary" />
              <Label
                htmlFor="titleAi"
                className="text-xs font-bold text-primary uppercase tracking-wider"
              >
                Título Ciudadano (Generado con IA)
              </Label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 border-primary/30 hover:bg-primary/10"
              onClick={handleRegenerateAi}
              disabled={isRegenerating}
            >
              <BrainCircuit className="h-3.5 w-3.5 text-primary" />
              {isRegenerating ? "Generando..." : "Regenerar IA"}
            </Button>
          </div>
          <Input
            id="titleAi"
            value={titleAi}
            onChange={(e) => setTitleAi(e.target.value)}
            placeholder="Ej: Permite ir a juicio laboral sin agotar la vía administrativa previa"
            className="bg-background text-sm font-medium"
          />
        </div>

        {/* Resumen / Sumilla */}
        <div className="space-y-1.5">
          <Label
            htmlFor="summary"
            className="text-xs font-semibold text-muted-foreground"
          >
            Resumen Ejecutivo / Sumilla
          </Label>
          <Textarea
            id="summary"
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Resumen del alcance y beneficiarios..."
            className="text-sm"
          />
        </div>

        {/* Estado de Aprobación y URL de El Peruano */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Estado de Aprobación
            </Label>
            <Select
              value={status}
              onValueChange={(val: BillApprovalStatusType) => setStatus(val)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {billApprovalStatuses.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="docUrl"
              className="text-xs font-semibold text-muted-foreground"
            >
              URL del Documento PDF (El Peruano / Congreso)
            </Label>
            <div className="flex gap-2">
              <Input
                id="docUrl"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://.../archivo.pdf"
                className="text-sm font-mono text-xs truncate"
              />
              {documentUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => window.open(documentUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Comisiones y Coautores */}
        {(bill.committees || bill.coauthors) && (
          <div className="space-y-2 pt-2 border-t text-xs text-muted-foreground">
            {bill.committees && (
              <div>
                <span className="font-semibold text-foreground">
                  Comisiones:{" "}
                </span>
                {bill.committees}
              </div>
            )}
            {bill.coauthors && (
              <div>
                <span className="font-semibold text-foreground">
                  Coautores:{" "}
                </span>
                {bill.coauthors}
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function BillDetailDialog({
  bill,
  open,
  onOpenChange,
}: BillDetailDialogProps) {
  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <BillDetailContent
          key={bill.id}
          bill={bill}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
