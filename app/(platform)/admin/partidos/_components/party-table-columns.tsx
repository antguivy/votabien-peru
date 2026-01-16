"use client";

import * as React from "react";
import { type DataTableRowAction } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import { Ellipsis, SquarePen } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { AdminPoliticalParty } from "@/interfaces/party";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<AdminPoliticalParty> | null>
  >;
}

export function getColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<AdminPoliticalParty>[] {
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nombre" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="min-w-[20rem] max-w-[31.25rem] break-words font-medium whitespace-normal">
              {row.original.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <Badge variant="outline">
              {row.original.active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "acronym",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Acrónimo" />
      ),
      cell: ({ row }) => {
        const acronym = row.original.acronym;

        return (
          <div className="flex items-center">
            <span className="capitalize">{acronym}</span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      cell: ({ row }) => {
        const condition = row.original.type;

        return (
          <div className="flex items-center">
            <span className="capitalize">{condition}</span>
          </div>
        );
      },
      enableSorting: false,
    },
    // {
    //   accessorKey: "created_at",
    //   header: ({ column }) => (
    //     <DataTableColumnHeader column={column} title="F. Creación" />
    //   ),
    //   cell: ({ cell }) => formatterDateWithTime(cell.getValue() as Date),
    // },
    // enableSorting: false,
    {
      id: "actions",
      cell: function Cell({ row }) {
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
