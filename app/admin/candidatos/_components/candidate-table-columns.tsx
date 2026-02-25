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
import { booleanToText } from "@/lib/utils";
import {
  getCandidateTypeColor,
  getCandidateTypeIcon,
} from "@/lib/utils/color-enums";
import { Separator } from "@/components/ui/separator";
import { AdminCandidate } from "@/interfaces/candidate";
import {
  getTextColor,
  getTextShadowStyle,
  needsOverlay,
} from "@/lib/utils/color-utils";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<AdminCandidate> | null>
  >;
}

export function getColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<AdminCandidate>[] {
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
      id: "parties",
      accessorKey: "political_party",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Org. Política" />
      ),
      cell: ({ row }) => {
        const party = row.original.political_party;
        const colorHex = party?.color_hex ?? "#888888";
        const textColorClass = getTextColor(colorHex);
        const hasOverlay = needsOverlay(colorHex);
        const textShadow = getTextShadowStyle(colorHex);

        return (
          <div className="w-auto">
            <div
              className={`relative px-2 py-0.5 rounded-md text-xs text-center whitespace-normal break-words ${textColorClass}`}
              style={{ backgroundColor: colorHex, ...textShadow }}
              title={party?.name}
            >
              {/* Overlay sutil para colores muy claros o fosforescentes */}
              {hasOverlay && (
                <span
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">{party?.name}</span>
            </div>
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
        const type = row.original.type;
        const Icon = getCandidateTypeIcon(type);
        const colorClass = getCandidateTypeColor(type);

        return (
          <div className="flex w-[6.25rem] items-center">
            <Icon className={`mr-2 size-4 ${colorClass}`} aria-hidden="true" />
            <span className="capitalize">{type.toLowerCase()}</span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "list_number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="N°" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <Badge variant="outline">{row.original.list_number}</Badge>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "electoral_district",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Distrito Elect." />
      ),
      cell: ({ row }) => {
        const district = row.original.electoral_district;

        return (
          <Badge
            variant="outline"
            className=" block whitespace-normal break-words text-xs"
          >
            {district?.name}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
      ),
      cell: ({ row }) => {
        const status = row.original.status;

        return (
          <Badge
            variant="outline"
            className=" block whitespace-normal break-words text-xs"
          >
            {status}
          </Badge>
        );
      },
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
              {/* <DropdownMenuItem
                onSelect={() => setRowAction({ type: "update-bancada", row })}
              >
                <ArrowRightLeft className="size-4" />
                Cambios de Bancada
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
