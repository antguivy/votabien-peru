"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { toast } from "sonner";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { LegislatorImportPreview } from "./legislator-import-preview";
import {
  importLegislators,
  type ImportLegislatorRow,
} from "../_lib/import-actions";
import { Badge } from "@/components/ui/badge";

interface LegislatorImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreviewRow extends ImportLegislatorRow {
  _status: "ok" | "error";
  _statusMessage?: string;
}

export function LegislatorImportDialog({
  open,
  onOpenChange,
}: LegislatorImportDialogProps) {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
      });

      if (jsonData.length < 2) {
        toast.error("El archivo está vacío o solo tiene encabezados");
        return;
      }

      const headers = jsonData[0].map((h: string) =>
        h.toString().toLowerCase().trim(),
      );
      const dniIdx = headers.findIndex(
        (h: string) => h === "dni" || h === "documento",
      );
      const camaraIdx = headers.findIndex(
        (h: string) => h === "camara" || h === "cámara",
      );
      const partidoIdx = headers.findIndex(
        (h: string) => h === "partido" || h === "partido_politico",
      );
      const bancadaIdx = headers.findIndex(
        (h: string) => h === "bancada" || h === "grupo_parlamentario",
      );
      const distritoIdx = headers.findIndex(
        (h: string) => h === "distrito" || h === "distrito_electoral",
      );
      const periodoIdx = headers.findIndex(
        (h: string) => h === "periodo" || h === "periodo_legislativo",
      );
      const emailIdx = headers.findIndex(
        (h: string) =>
          h === "email" || h === "correo" || h === "email_institucional",
      );

      if (dniIdx === -1 || camaraIdx === -1 || distritoIdx === -1) {
        toast.error(
          "El archivo debe tener columnas: dni, camara, distrito (mínimo)",
        );
        return;
      }

      const rows: PreviewRow[] = [];
      const errors: string[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const dni = row[dniIdx]?.toString().trim();
        const camara = row[camaraIdx]?.toString().trim().toUpperCase();
        const partido =
          partidoIdx !== -1 ? row[partidoIdx]?.toString().trim() : "";
        const bancada =
          bancadaIdx !== -1 ? row[bancadaIdx]?.toString().trim() : "";
        const distrito = row[distritoIdx]?.toString().trim();
        const periodo =
          periodoIdx !== -1 ? row[periodoIdx]?.toString().trim() : "";
        const email = emailIdx !== -1 ? row[emailIdx]?.toString().trim() : "";

        const rowErrors: string[] = [];

        if (!dni) rowErrors.push("DNI vacío");
        if (!camara || !["SENADO", "DIPUTADOS", "CONGRESO"].includes(camara))
          rowErrors.push("Cámara inválida (debe ser SENADO o DIPUTADOS)");
        if (!distrito) rowErrors.push("Distrito vacío");

        const previewRow: PreviewRow = {
          dni,
          camara: camara as ImportLegislatorRow["camara"],
          partido,
          bancada,
          distrito,
          periodo,
          email,
          _status: rowErrors.length > 0 ? "error" : "ok",
          _statusMessage: rowErrors.join(", ") || undefined,
        };
        rows.push(previewRow);
      }

      if (errors.length > 0) {
        toast.error(errors.join("\n"));
      }

      setPreviewRows(rows);
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const okRows = previewRows.filter((r) => r._status === "ok");
    if (okRows.length === 0) {
      toast.error("No hay filas válidas para importar");
      return;
    }

    setIsSubmitting(true);

    const importRows: ImportLegislatorRow[] = okRows.map(
      ({ _status, _statusMessage, ...rest }) => rest,
    );

    const result = await importLegislators(importRows);

    if (result.success) {
      toast.success(`Importados: ${result.created} legisladores`);
    } else {
      toast.error(
        `Importados: ${result.created}. Errores: ${result.errors.length}`,
        {
          description: result.errors.join("\n"),
        },
      );
    }

    if (result.errors.length > 0) {
      console.error("Errores de importación:", result.errors);
    }

    setIsSubmitting(false);
    onOpenChange(false);
    setPreviewRows([]);
    setFileName("");
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <CredenzaHeader>
          <CredenzaTitle>Importar Legisladores</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody className="space-y-4">
          <div className="bg-muted/30 rounded-xl border-2 border-dashed p-8 text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Sube un archivo Excel (.xlsx) con los siguientes campos:
              <br />
              <span className="text-xs">
                dni | camara | partido | bancada | distrito | periodo | email
              </span>
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar archivo
            </Button>
            {fileName && (
              <Badge variant="secondary" className="mt-2">
                {fileName}
              </Badge>
            )}
          </div>

          {previewRows.length > 0 && (
            <LegislatorImportPreview
              rows={previewRows}
              onRowsChange={setPreviewRows}
            />
          )}
        </CredenzaBody>
        <CredenzaFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setPreviewRows([]);
              setFileName("");
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={isSubmitting || previewRows.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              `Importar ${previewRows.filter((r) => r._status === "ok").length} legisladores`
            )}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
