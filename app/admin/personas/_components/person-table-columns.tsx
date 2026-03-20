"use client";

import * as React from "react";
import { type DataTableRowAction } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import { BookUser, Ellipsis, History, SquarePen } from "lucide-react";
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
import { AdminPerson } from "@/interfaces/person";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<AdminPerson> | null>
  >;
}

export function getColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<AdminPerson>[] {
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
      accessorKey: "fullname",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nombres y Apellidos" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="min-w-[20rem] max-w-[31.25rem] break-words font-medium whitespace-normal">
              {row.original.fullname}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "dni",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="DNI" />
      ),
      cell: ({ row }) => {
        const acronym = row.original.dni;

        return (
          <div className="flex items-center">
            <span className="capitalize">{acronym}</span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "birth_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fecha de Nac." />
      ),
      cell: ({ row }) => {
        const brith_date = row.original.birth_date;

        return (
          <div className="flex items-center">
            <span className="capitalize">{brith_date}</span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "place_of_birth",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lugar de Nac." />
      ),
      cell: ({ row }) => {
        const place_of_birth = row.original.place_of_birth;

        return (
          <div className="flex items-center">
            <span className="capitalize">{place_of_birth}</span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "profession",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Profesión" />
      ),
      cell: ({ row }) => {
        const profession = row.original.profession;

        return (
          <div className="flex items-center">
            <span className="capitalize">{profession}</span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "gender",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Género" />
      ),
      cell: ({ row }) => {
        const gender = row.original.gender;

        return (
          <div className="flex items-center">
            <span className="capitalize">{gender}</span>
          </div>
        );
      },
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
                onSelect={() => setRowAction({ type: "update-biography", row })}
              >
                <History className="size-4" />
                Noticias
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  setRowAction({ type: "update-background", row })
                }
              >
                <BookUser className="size-4" />
                Antecedentes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
