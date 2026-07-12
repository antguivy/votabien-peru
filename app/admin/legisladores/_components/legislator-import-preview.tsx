"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PreviewRow {
  dni: string;
  camara: string;
  partido: string;
  bancada: string;
  distrito: string;
  periodo: string;
  email?: string;
  _status: "ok" | "error";
  _statusMessage?: string;
}

interface LegislatorImportPreviewProps {
  rows: PreviewRow[];
  onRowsChange: React.Dispatch<React.SetStateAction<PreviewRow[]>>;
}

export function LegislatorImportPreview({
  rows,
  onRowsChange,
}: LegislatorImportPreviewProps) {
  const handleRemoveRow = (index: number) => {
    onRowsChange((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <div className="p-3 flex items-center justify-between border-b">
        <span className="text-sm font-medium">
          Vista previa ({rows.length} registros)
        </span>
        <span className="text-xs text-muted-foreground">
          {rows.filter((r) => r._status === "ok").length} válidos •{" "}
          {rows.filter((r) => r._status === "error").length} con errores
        </span>
      </div>
      <div className="max-h-[300px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">DNI</TableHead>
              <TableHead className="w-[80px]">Cámara</TableHead>
              <TableHead>Partido</TableHead>
              <TableHead>Bancada</TableHead>
              <TableHead>Distrito</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[80px]">Estado</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{row.dni}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {row.camara}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs max-w-[150px] truncate">
                  {row.partido || "—"}
                </TableCell>
                <TableCell className="text-xs max-w-[150px] truncate">
                  {row.bancada || "—"}
                </TableCell>
                <TableCell className="text-xs">{row.distrito}</TableCell>
                <TableCell className="text-xs">{row.periodo || "—"}</TableCell>
                <TableCell className="text-xs max-w-[150px] truncate">
                  {row.email || "—"}
                </TableCell>
                <TableCell>
                  {row._status === "ok" ? (
                    <Badge variant="success" className="text-xs">
                      ✓
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="text-xs"
                      title={row._statusMessage}
                    >
                      ✗
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveRow(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
