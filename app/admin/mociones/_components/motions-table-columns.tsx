"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Eye, HeartHandshake, FileCheck, Building2 } from "lucide-react";
import { AdminMotionRow } from "../_lib/types";

interface GetColumnsProps {
  onSelectMotion: (motion: AdminMotionRow) => void;
}

export function getColumns({
  onSelectMotion,
}: GetColumnsProps): ColumnDef<AdminMotionRow>[] {
  return [
    {
      accessorKey: "number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="N° Moción" />
      ),
      cell: ({ row }) => {
        const motion = row.original;
        return (
          <button
            onClick={() => onSelectMotion(motion)}
            className="font-mono text-xs font-semibold text-primary hover:underline text-left"
          >
            {motion.number}
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
      accessorKey: "submission_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Presentación" />
      ),
      cell: ({ row }) => {
        const dateVal = row.getValue("submission_date") as Date | null;
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
      id: "motion_type",
      accessorKey: "motion_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      cell: ({ row }) => {
        const typeStr = row.getValue("motion_type") as string;
        return (
          <span
            className="text-xs font-medium text-foreground truncate max-w-[160px] block"
            title={typeStr}
          >
            {typeStr}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      id: "is_greeting",
      accessorKey: "is_greeting",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clasificación" />
      ),
      cell: ({ row }) => {
        const isGreeting = row.getValue("is_greeting") as boolean;
        return isGreeting ? (
          <Badge className="w-fit text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 gap-1 px-1.5 py-0 whitespace-nowrap">
            <HeartHandshake className="h-2.5 w-2.5" />
            Saludo
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="w-fit text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 gap-1 px-1.5 py-0 whitespace-nowrap"
          >
            <FileCheck className="h-2.5 w-2.5" />
            Fiscalización
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      id: "summary",
      accessorKey: "summary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sumilla" />
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
      header: "Autor Principal",
      cell: ({ row }) => {
        const motion = row.original;
        const author = motion.legislator?.person;
        const authorName = author?.fullname;
        const group = motion.parliamentarygroup;

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
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-medium text-foreground truncate"
                title={authorName}
              >
                {authorName}
              </p>
              {group && (
                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                  <Building2 className="h-2.5 w-2.5" />
                  {group.acronym || group.name}
                </p>
              )}
            </div>
          </div>
        );
      },
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
            className="text-xs font-normal truncate max-w-[120px]"
            title={group.name}
          >
            {group.acronym || group.name}
          </Badge>
        );
      },
      enableSorting: false,
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
      accessorKey: "procedural_status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("procedural_status") as string | null;
        if (!status) return null;
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-normal max-w-[140px] truncate"
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const motion = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectMotion(motion)}
            className="h-8 w-8 p-0"
            title="Ver detalle de moción"
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];
}
