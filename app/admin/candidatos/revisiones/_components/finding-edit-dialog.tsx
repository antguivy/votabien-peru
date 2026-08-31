"use client";

import * as React from "react";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza";
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
import { normalizeFindingData } from "@/interfaces/research";

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
  formId: string;
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
  formId,
  finding,
  onSaveAndApprove,
  onCancel: _onCancel,
  isProcessing: _isProcessing,
}: FindingEditFormProps) {
  const normalized = normalizeFindingData(finding.proposed_data);
  const isBackground = ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(
    normalized.type,
  );

  const [title, setTitle] = React.useState(() => normalized.title);
  const [summary, setSummary] = React.useState(() => normalized.summary);
  const [type, setType] = React.useState(() => normalized.type);
  const [status, setStatus] = React.useState(() => normalized.status);
  const [sanction, setSanction] = React.useState(
    () => normalized.sanction || "",
  );
  const [publicationDate, setPublicationDate] = React.useState(
    () => normalized.publication_date || "",
  );
  const [source, setSource] = React.useState(() => normalized.source || "");
  const [sourceUrl, setSourceUrl] = React.useState(
    () => normalized.source_url || "",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDate = publicationDate.trim() ? publicationDate.trim() : null;
    const cleanSource = source.trim() ? source.trim() : "Web";
    const cleanUrl = sourceUrl.trim() ? sourceUrl.trim() : null;
    const cleanSanction = sanction.trim() ? sanction.trim() : null;

    const updatedPayload: Record<string, unknown> = {
      ...finding.proposed_data,
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
    <form id={formId} onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-1">
        <Label htmlFor="title" className="text-xs font-semibold">
          Título / Encabezado
        </Label>
        <Textarea
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
        <Textarea
          id="sourceUrl"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
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
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="max-w-2xl">
        <CredenzaHeader>
          <CredenzaTitle>Editar y Aprobar Hallazgo</CredenzaTitle>
          <CredenzaDescription>
            Ajusta los datos del hallazgo antes de guardarlo definitivamente en
            el perfil del candidato.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="max-h-[70vh] sm:max-h-[65vh] overflow-y-auto px-1 sm:px-4">
          {finding && (
            <FindingEditForm
              key={finding.id}
              formId={`finding-edit-form-${finding.id}`}
              finding={finding}
              onSaveAndApprove={onSaveAndApprove}
              onCancel={() => onOpenChange(false)}
              isProcessing={isProcessing}
            />
          )}
        </CredenzaBody>

        <CredenzaFooter className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={finding ? `finding-edit-form-${finding.id}` : undefined}
            disabled={isProcessing}
            className="w-full sm:w-auto bg-success hover:bg-success/90 text-success-foreground"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Guardar y Aprobar
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
