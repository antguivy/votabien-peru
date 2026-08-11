"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Edit, Trash } from "lucide-react";
import type { DataTableRowAction } from "@/lib/types";

export function getColumns({
  setRowAction,
}: {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<any> | null>
  >;
}): ColumnDef<any>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre del Workflow",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "models",
      header: "Modelos (C/V)",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="text-[10px]">
            C: {row.original.compressor_model}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            V: {row.original.validator_model}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "sources",
      header: "Fuentes",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.sources.length === 0 && (
            <span className="text-muted-foreground text-xs">Ninguna</span>
          )}
          {row.original.sources.map((t: string) => (
            <Badge key={t} variant="secondary" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "ACTIVE" ? "default" : "destructive"}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Actualizado",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.updated_at), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRowAction({ type: "update", row })}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600"
            onClick={() => setRowAction({ type: "delete", row })}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
