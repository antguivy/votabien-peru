"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";

interface FindingEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: {
    id: string;
    action: string;
    proposed_data: Record<string, unknown>;
  } | null;
  onSaveAndApprove: (data: Record<string, unknown>) => Promise<void>;
  isProcessing?: boolean;
}

interface FindingEditFormProps {
  finding: {
    id: string;
    action: string;
    proposed_data: Record<string, unknown>;
  };
  onSaveAndApprove: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isProcessing?: boolean;
}

function FindingEditForm({
  finding,
  onSaveAndApprove,
  onCancel,
  isProcessing,
}: FindingEditFormProps) {
  const initialData = finding.proposed_data || {};
  const rawType = String(
    initialData.type || initialData.tipo || initialData.tema || "",
  ).toUpperCase();
  const isBackground = ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(
    rawType,
  );

  const fallbackTitle = initialData.tema
    ? `${initialData.tema} - Declaración`
    : initialData.description
      ? String(initialData.description).substring(0, 60)
      : "";

  const [title, setTitle] = React.useState(() =>
    String(initialData.title || initialData.titulo || fallbackTitle),
  );
  const [summary, setSummary] = React.useState(() =>
    String(
      initialData.summary ||
        initialData.redaccion_final ||
        initialData.descripcion ||
        initialData.description ||
        initialData.hecho ||
        "",
    ),
  );
  const [type, setType] = React.useState(() =>
    String(
      initialData.type ||
        initialData.tipo ||
        initialData.tema ||
        (isBackground ? "PENAL" : "NOTICIA"),
    ),
  );
  const [status, setStatus] = React.useState(() =>
    String(initialData.status || initialData.estado || "EN_INVESTIGACION"),
  );
  const [sanction, setSanction] = React.useState(() =>
    String(initialData.sanction || initialData.sancion || ""),
  );
  const [publicationDate, setPublicationDate] = React.useState(() =>
    String(
      initialData.publication_date ||
        initialData.fecha ||
        initialData.date ||
        "",
    ),
  );
  const [source, setSource] = React.useState(() =>
    String(
      initialData.source ||
        initialData.fuente_normalizada ||
        initialData.fuente ||
        "",
    ),
  );
  const [sourceUrl, setSourceUrl] = React.useState(() =>
    String(initialData.source_url || initialData.fuente_url || ""),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDate = publicationDate.trim() ? publicationDate.trim() : null;
    const cleanSource = source.trim() ? source.trim() : "Web";
    const cleanUrl = sourceUrl.trim() ? sourceUrl.trim() : null;
    const cleanSanction = sanction.trim() ? sanction.trim() : null;

    const updatedPayload: Record<string, unknown> = {
      ...initialData,
      title,
      titulo: title,
      summary,
      descripcion: summary,
      description: summary,
      redaccion_final: summary,
      type,
      tipo: type,
      tema: type,
      status,
      estado: status,
      sanction: cleanSanction,
      sancion: cleanSanction,
      publication_date: cleanDate,
      fecha: cleanDate,
      date: cleanDate,
      source: cleanSource,
      fuente: cleanSource,
      fuente_normalizada: cleanSource,
      source_url: cleanUrl,
      fuente_url: cleanUrl,
    };

    await onSaveAndApprove(updatedPayload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-1">
        <Label htmlFor="title" className="text-xs font-semibold">
          Título / Encabezado
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Investigación preparatoria por colusión simple"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isBackground ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="type" className="text-xs font-semibold">
                Tipo de Proceso
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENAL">
                    PENAL (Delitos / Fiscalía)
                  </SelectItem>
                  <SelectItem value="ETICA">
                    ÉTICA (Comisión del Congreso)
                  </SelectItem>
                  <SelectItem value="ADMINISTRATIVO">
                    ADMINISTRATIVO (Sanciones)
                  </SelectItem>
                  <SelectItem value="CIVIL">
                    CIVIL (Demandas / Familia)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs font-semibold">
                Estado Procesal
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN_INVESTIGACION">
                    EN INVESTIGACIÓN
                  </SelectItem>
                  <SelectItem value="SENTENCIADO">SENTENCIADO</SelectItem>
                  <SelectItem value="SANCIONADO">SANCIONADO</SelectItem>
                  <SelectItem value="ARCHIVADO">ARCHIVADO</SelectItem>
                  <SelectItem value="ABSUELTO">ABSUELTO</SelectItem>
                  <SelectItem value="PRESCRITO">PRESCRITO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="type" className="text-xs font-semibold">
              Tema / Categoría
            </Label>
            <Input
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Ej. SEGURIDAD, ECONOMIA, TRAYECTORIA"
              required
            />
          </div>
        )}
      </div>

      {isBackground && (
        <div className="space-y-1">
          <Label htmlFor="sanction" className="text-xs font-semibold">
            Sanción o Condena (si aplica)
          </Label>
          <Input
            id="sanction"
            value={sanction}
            onChange={(e) => setSanction(e.target.value)}
            placeholder="Ej. 4 años de pena suspendida e inhabilitación"
          />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="summary" className="text-xs font-semibold">
          Resumen / Redacción Explicativa
        </Label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="Descripción del caso o de la declaración..."
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="publicationDate" className="text-xs font-semibold">
            Fecha (YYYY-MM-DD)
          </Label>
          <Input
            id="publicationDate"
            value={publicationDate}
            onChange={(e) => setPublicationDate(e.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="source" className="text-xs font-semibold">
            Fuente / Medio
          </Label>
          <Input
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Ej. El Comercio, RPP Noticias, JNE"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="sourceUrl" className="text-xs font-semibold">
          URL de la Noticia / Enlace
        </Label>
        <Input
          id="sourceUrl"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <DialogFooter className="pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isProcessing}
          className="bg-success hover:bg-success/90 text-success-foreground"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Guardar y Aprobar
        </Button>
      </DialogFooter>
    </form>
  );
}

export function FindingEditDialog({
  open,
  onOpenChange,
  finding,
  onSaveAndApprove,
  isProcessing,
}: FindingEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar y Aprobar Hallazgo</DialogTitle>
          <DialogDescription>
            Ajusta los datos del hallazgo antes de guardarlo definitivamente en
            el perfil del candidato.
          </DialogDescription>
        </DialogHeader>

        {finding && (
          <FindingEditForm
            key={finding.id}
            finding={finding}
            onSaveAndApprove={onSaveAndApprove}
            onCancel={() => onOpenChange(false)}
            isProcessing={isProcessing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
