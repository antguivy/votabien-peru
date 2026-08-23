"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { BillStatusBadge } from "./bill-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ellipsis,
  FileText,
  Sparkles,
  ExternalLink,
  Edit,
  Trash2,
  FileSearch,
} from "lucide-react";
import { toast } from "sonner";
import { regenerateBillTitleAction, deleteBillAction } from "../_lib/actions";
import { AdminBillRow } from "../_lib/validation";

interface GetColumnsProps {
  onSelectBill: (bill: AdminBillRow) => void;
}

export function getColumns({
  onSelectBill,
}: GetColumnsProps): ColumnDef<AdminBillRow, unknown>[] {
  return [
    {
      accessorKey: "number",
      id: "number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="N° Expediente" />
      ),
      cell: ({ row }) => {
        const number = row.getValue("number") as string;
        const period = row.original.period;
        const baseYear = period?.includes("2021") ? "2021" : "2026";
        const numericMatch = number?.match(/(\d+)/);
        const numericPart = numericMatch ? numericMatch[1] : "";
        const spleyUrl = `https://wb2server.congreso.gob.pe/spley-portal/#/expediente/${baseYear}/${numericPart}`;

        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="font-bold px-2 py-0.5 rounded bg-muted text-foreground whitespace-nowrap">
              {number}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Abrir en portal SPLey del Congreso"
              onClick={() => window.open(spleyUrl, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      id: "search",
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Título / Proyecto de Ley"
        />
      ),
      cell: ({ row }) => {
        const titleAi = row.original.title_ai;
        const originalTitle = row.original.title;

        return (
          <div className="min-w-[16rem] max-w-[28rem] space-y-1 py-1">
            {titleAi ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="h-2.5 w-2.5" /> IA
                  </span>
                  <span className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
                    {titleAi}
                  </span>
                </div>
                <p
                  className="text-xs text-muted-foreground line-clamp-1 mt-0.5"
                  title={originalTitle || ""}
                >
                  {originalTitle}
                </p>
              </div>
            ) : (
              <div>
                <span className="font-medium text-sm text-foreground line-clamp-2">
                  {originalTitle || "Sin título"}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Pendiente de título ciudadano con IA
                </span>
              </div>
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: "legislator",
      accessorKey: "legislator",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Autor Principal" />
      ),
      cell: ({ row }) => {
        const legislator = row.original.legislator;
        const fullname =
          legislator?.person?.fullname || row.original.sponsor || "Sin autor";
        const groupName =
          row.original.parliamentarygroup?.acronym ||
          row.original.parliamentarygroup?.name;

        return (
          <div className="min-w-[10rem] max-w-[16rem] truncate space-y-0.5">
            <p
              className="text-xs font-semibold text-foreground truncate"
              title={fullname}
            >
              {fullname}
            </p>
            {groupName && (
              <p
                className="text-[11px] text-muted-foreground truncate"
                title={groupName}
              >
                {groupName}
              </p>
            )}
          </div>
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
      id: "parliamentary_group",
      accessorKey: "parliamentary_group_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bancada" />
      ),
      cell: ({ row }) => {
        const group = row.original.parliamentarygroup;
        if (!group)
          return <span className="text-xs text-muted-foreground">-</span>;

        return (
          <Badge
            variant="outline"
            className="text-xs font-normal truncate max-w-[140px]"
            title={group.name}
          >
            {group.acronym || group.name}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      id: "status",
      accessorKey: "approval_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <BillStatusBadge status={status} />;
      },
      enableSorting: true,
    },
    {
      accessorKey: "submission_date",
      id: "submission_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fecha" />
      ),
      cell: ({ row }) => {
        const dateVal = row.getValue("submission_date") as Date | string;
        if (!dateVal)
          return <span className="text-xs text-muted-foreground">-</span>;
        const d = new Date(dateVal);
        const formatted = isNaN(d.getTime())
          ? String(dateVal)
          : d.toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

        return (
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {formatted}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "document_url",
      id: "document_url",
      header: "PDF Oficial",
      cell: ({ row }) => {
        const docUrl = row.getValue("document_url") as string | null;
        if (!docUrl)
          return <span className="text-xs text-muted-foreground/50">-</span>;

        return (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 font-medium text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            onClick={() => window.open(docUrl, "_blank")}
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </Button>
        );
      },
      enableSorting: false,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const bill = row.original;

        const handleRegenerate = async () => {
          toast.info("Generando título ciudadano con Gemini...");
          const res = await regenerateBillTitleAction(bill.id);
          if (res.success) {
            toast.success("¡Título ciudadano generado!");
          } else {
            toast.error(res.error || "Error al regenerar título.");
          }
        };

        const handleDelete = async () => {
          if (
            confirm(`¿Estás seguro de eliminar el proyecto ${bill.number}?`)
          ) {
            const res = await deleteBillAction(bill.id);
            if (res.success) {
              toast.success("Proyecto eliminado.");
            } else {
              toast.error(res.error || "Error al eliminar.");
            }
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open menu"
                variant="ghost"
                className="flex text-primary font-bold size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem
                onClick={() => onSelectBill(bill)}
                className="gap-2"
              >
                <Edit className="h-3.5 w-3.5" /> Ver Detalle / Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleRegenerate}
                className="gap-2 text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" /> Regenerar con IA
              </DropdownMenuItem>
              {bill.document_url && (
                <DropdownMenuItem
                  onClick={() => {
                    if (bill.document_url)
                      window.open(bill.document_url, "_blank");
                  }}
                  className="gap-2"
                >
                  <FileSearch className="h-3.5 w-3.5" /> Ver PDF El Peruano
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="gap-2 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar Proyecto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
