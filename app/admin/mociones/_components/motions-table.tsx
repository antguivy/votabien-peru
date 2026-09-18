"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { getColumns } from "./motions-table-columns";
import { MotionDetailDialog } from "./motion-detail-dialog";
import { SyncMotionsDialog } from "./sync-motions-dialog";
import { DataTableSearchInput } from "@/components/data-table/data-table-search-input";
import type { DataTableFilterField } from "@/lib/types";
import { AdminMotionRow } from "../_lib/types";

interface MotionsTableProps {
  promises: Promise<
    [
      { data: AdminMotionRow[]; total: number; pageCount: number },
      {
        periods: string[];
        parliamentaryGroups: {
          id: string;
          name: string;
          acronym: string | null;
        }[];
      },
    ]
  >;
}

export function MotionsTable({ promises }: MotionsTableProps) {
  const [{ data, pageCount }, { periods, parliamentaryGroups }] =
    React.use(promises);
  const [selectedMotion, setSelectedMotion] =
    React.useState<AdminMotionRow | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const handleSelectMotion = (motion: AdminMotionRow) => {
    setSelectedMotion(motion);
    setDetailOpen(true);
  };

  const columns = React.useMemo(
    () => getColumns({ onSelectMotion: handleSelectMotion }),
    [],
  );

  const filterFields: DataTableFilterField<AdminMotionRow>[] = React.useMemo(
    () => [
      {
        id: "chamber" as keyof AdminMotionRow,
        label: "Cámara",
        options: [
          { label: "Cámara de Diputados", value: "DIPUTADOS" },
          { label: "Senado de la República", value: "SENADO" },
        ],
      },
      {
        id: "is_greeting" as keyof AdminMotionRow,
        label: "Clasificación",
        options: [
          { label: "Mociones de Saludo", value: "true" },
          { label: "Mociones Ordinarias / Fiscalización", value: "false" },
        ],
      },
      {
        id: "period" as keyof AdminMotionRow,
        label: "Periodo",
        options: periods.map((p) => ({
          label: p,
          value: p,
        })),
      },
      {
        id: "parliamentary_group" as keyof AdminMotionRow,
        label: "Bancada",
        options: parliamentaryGroups.map((pg) => ({
          label: pg.acronym || pg.name,
          value: pg.id,
        })),
      },
    ],
    [periods, parliamentaryGroups],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    enableAdvancedFilter: false,
    initialState: {
      sorting: [{ id: "submission_date", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="space-y-4">
      <DataTable table={table}>
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          customFilters={
            <DataTableSearchInput placeholder="Buscar por número, sumilla o congresista..." />
          }
        >
          <SyncMotionsDialog availablePeriods={periods} />
        </DataTableToolbar>
      </DataTable>

      <MotionDetailDialog
        motion={selectedMotion}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
