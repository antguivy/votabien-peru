"use client";

import * as React from "react";
import { type DataTableRowAction } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import { Ellipsis, SquarePen } from "lucide-react";

import { formatterDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { booleanToText } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { AdminExecutive } from "@/interfaces/executive";
import { ExecutiveRole } from "@/interfaces/politics";

const roleLabels: Record<ExecutiveRole, string> = {
  [ExecutiveRole.PRESIDENTE]: "Presidente",
  [ExecutiveRole.VICEPRESIDENTE]: "Vicepresidente",
  [ExecutiveRole.PRIMER_MINISTRO]: "Primer Ministro",
  [ExecutiveRole.MINISTRO]: "Ministro",
};

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<AdminExecutive> | null>
  >;
}

export function getColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<AdminExecutive>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "person.fullname",
      id: "fullname",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Apellidos y Nombres" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="min-w-[20rem] max-w-[31.25rem] break-words font-medium whitespace-normal">
              {row.original.person?.fullname}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cargo" />
      ),
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant="outline" className="whitespace-nowrap">
            {roleLabels[role] ?? role}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "ministry",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ministerio" />
      ),
      cell: ({ row }) => {
        return (
          <Badge
            variant="outline"
            className="max-w-[250px] min-w-[250px] w-full block whitespace-normal break-words text-xs"
          >
            {row.original.ministry || "—"}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "legislative_period",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Periodo" />
      ),
      cell: ({ row }) => {
        return (
          <Badge variant="outline" className="whitespace-nowrap">
            {row.original.legislative_period?.name || "—"}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="F. Inicio" />
      ),
      cell: ({ cell }) => formatterDate(cell.getValue() as Date),
      enableSorting: false,
    },
    {
      accessorKey: "end_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="F. Fin" />
      ),
      cell: ({ cell }) => formatterDate(cell.getValue() as Date),
      enableSorting: false,
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Activo" />
      ),
      cell: ({ row }) => (
        <Badge
          variant={row.original.active ? "success" : "destructive"}
          className="min-w-[40px] justify-center"
        >
          {booleanToText(row.original.active)}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open menu"
                variant="outline"
                className="flex text-primary font-bold size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
              <Separator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ type: "update", row })}
              >
                <SquarePen className="size-4" />
                Actualizar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
