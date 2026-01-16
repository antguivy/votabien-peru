"use client";

import * as React from "react";
import { type DataTableRowAction } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowRightLeft, Ellipsis, SquarePen } from "lucide-react";

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
import {
  formatConditionText,
  getChamberColor,
  getChamberIcon,
  getConditionColor,
  getConditionIcon,
} from "@/lib/utils/color-enums";
import { Separator } from "@/components/ui/separator";
import { AdminLegislator } from "@/interfaces/legislator";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<AdminLegislator> | null>
  >;
}

export function getColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<AdminLegislator>[] {
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
      accessorKey: "electoral_district",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Distrito" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <Badge variant="outline">
              {row.original.electoral_district?.name}
            </Badge>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "chamber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cámara" />
      ),
      cell: ({ row }) => {
        const chamber = row.original.chamber;
        const Icon = getChamberIcon(chamber);
        const colorClass = getChamberColor(chamber);

        return (
          <div className="flex w-[6.25rem] items-center">
            <Icon className={`mr-2 size-4 ${colorClass}`} aria-hidden="true" />
            <span className="capitalize">{chamber.toLowerCase()}</span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "elected_party",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Partido Origen" />
      ),
      cell: ({ row }) => {
        const party = row.original.elected_by_party;
        const textColor =
          party?.color_hex === "#ffffff" ? "text-black" : "text-white";

        return (
          <div className="max-w-[200px] min-w-[200px]">
            <div
              className={`px-2 py-0.5 rounded-md text-xs whitespace-normal break-words ${textColor}`}
              style={{ backgroundColor: party?.color_hex ?? "#888888" }}
              title={party?.name}
            >
              {party?.name}
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "current_parliamentary_group",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bancada" />
      ),
      cell: ({ row }) => {
        const bancada = row.original.current_parliamentary_group?.name;

        return (
          <Badge
            variant="outline"
            className="max-w-[250px] min-w-[250px] w-full block whitespace-normal break-words text-xs"
          >
            {bancada}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "condition",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Condición" />
      ),
      cell: ({ row }) => {
        const condition = row.original.condition;
        const Icon = getConditionIcon(condition);
        const colorClass = getConditionColor(condition);

        return (
          <div className="flex items-center">
            <Icon className={`mr-2 size-4 ${colorClass}`} aria-hidden="true" />
            <span className="capitalize">{formatConditionText(condition)}</span>
          </div>
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
      accessorKey: "institutional_email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email Institucional" />
      ),
      cell: ({ row }) => {
        const email = row.original.institutional_email;

        return (
          <Badge
            variant="outline"
            className="max-w-[200px] min-w-[200px] text-xs whitespace-normal break-words "
          >
            {email}
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
              <DropdownMenuItem
                onSelect={() => setRowAction({ type: "update-bancada", row })}
              >
                <ArrowRightLeft className="size-4" />
                Cambios de Bancada
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
