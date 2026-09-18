"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Eye, Download } from "lucide-react";
import { AdminInformationRequestRow } from "../_lib/types";

interface GetColumnsProps {
  onSelectRequest: (req: AdminInformationRequestRow) => void;
}

export function getColumns({
  onSelectRequest,
}: GetColumnsProps): ColumnDef<AdminInformationRequestRow>[] {
  return [
    {
      accessorKey: "number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="N° Pedido" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <button
            onClick={() => onSelectRequest(item)}
            className="font-mono text-xs font-semibold text-primary hover:underline text-left"
          >
            {item.number}
          </button>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "chamber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cámara" />
      ),
      cell: ({ row }) => {
        const chamber = row.getValue("chamber") as string;
        const isDiputados = chamber === "DIPUTADOS";
        return (
          <Badge
            variant="secondary"
            className={
              isDiputados
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200"
                : "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200"
            }
          >
            {isDiputados ? "Diputados" : "Senado"}
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      id: "period",
      accessorKey: "period",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Periodo" />
      ),
      cell: ({ row }) => {
        const periodVal = row.getValue("period") as string | null;
        if (!periodVal)
          return <span className="text-xs text-muted-foreground">-</span>;
        return (
          <Badge
            variant="outline"
            className="text-xs font-normal whitespace-nowrap"
          >
            {periodVal}
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "document_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fecha" />
      ),
      cell: ({ row }) => {
        const dateVal = row.getValue("document_date") as Date | null;
        if (!dateVal)
          return <span className="text-xs text-muted-foreground">-</span>;
        const d = new Date(dateVal);
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {d.toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "target_entity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entidad Destino" />
      ),
      cell: ({ row }) => {
        const entity = row.getValue("target_entity") as string;
        return (
          <p
            className="text-xs font-medium text-foreground line-clamp-1 max-w-[220px]"
            title={entity}
          >
            {entity}
          </p>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "summary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sumilla Requerimiento" />
      ),
      cell: ({ row }) => {
        const summary = row.getValue("summary") as string;
        return (
          <p
            className="text-xs text-muted-foreground line-clamp-2 max-w-[320px] leading-relaxed"
            title={summary}
          >
            {summary}
          </p>
        );
      },
      enableSorting: false,
    },
    {
      id: "author",
      header: "Congresista Solicitante",
      cell: ({ row }) => {
        const item = row.original;
        const author = item.legislator?.person;
        const authorName = author?.fullname;

        if (!authorName) {
          return (
            <span className="text-xs text-muted-foreground italic">
              No vinculado
            </span>
          );
        }

        const initials = authorName
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("");

        return (
          <div className="flex items-center gap-2 max-w-[200px]">
            <Avatar className="h-6 w-6 border flex-shrink-0">
              {author.image_url && (
                <AvatarImage src={author.image_url} alt={authorName} />
              )}
              <AvatarFallback className="text-[9px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <p
              className="text-xs font-medium text-foreground truncate"
              title={authorName}
            >
              {authorName}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "document_code",
      header: "N° Oficio",
      cell: ({ row }) => {
        const code = row.getValue("document_code") as string | null;
        if (!code)
          return <span className="text-xs text-muted-foreground">-</span>;
        return (
          <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
            {code}
          </span>
        );
      },
    },
    {
      id: "pdf",
      header: "PDF",
      cell: ({ row }) => {
        const url = row.original.document_url;
        if (!url) {
          return (
            <span className="text-[11px] text-muted-foreground/60">-</span>
          );
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700"
            onClick={() => window.open(url, "_blank")}
            title="Descargar Oficio PDF Oficial"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectRequest(item)}
            className="h-8 w-8 p-0"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];
}
