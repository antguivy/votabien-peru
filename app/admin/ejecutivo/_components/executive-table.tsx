"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { toSentenceCase } from "@/lib/utils";
import { getColumns } from "./executive-table-columns";
import type { DataTableFilterField, DataTableRowAction } from "@/lib/types";
import { ExecutivesTableToolbarActions } from "./executive-table-toolbar-actions";
import {
  PaginatedExecutivesResponse,
  RoleCounts,
  PeriodCounts,
} from "../_lib/types";
import { ExecutivesTableFloatingBar } from "./executive-table-floating-bar";
import { AdminExecutive } from "@/interfaces/executive";
import { ExecutiveRole } from "@/interfaces/politics";
import { ExecutiveFormDialog } from "./executive-form-dialog";

const roleLabels: Record<ExecutiveRole, string> = {
  [ExecutiveRole.PRESIDENTE]: "Presidente",
  [ExecutiveRole.VICEPRESIDENTE]: "Vicepresidente",
  [ExecutiveRole.PRIMER_MINISTRO]: "Primer Ministro",
  [ExecutiveRole.MINISTRO]: "Ministro",
};

interface ExecutivesTableProps {
  promises: Promise<[PaginatedExecutivesResponse, RoleCounts, PeriodCounts]>;
  legislativePeriods: { id: string; name: string }[];
}

export function ExecutivesTable({
  promises,
  legislativePeriods,
}: ExecutivesTableProps) {
  const [{ data, total, page_size }, roleCounts, periodCounts] =
    React.use(promises);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AdminExecutive> | null>(null);
  const columns = React.useMemo(
    () => getColumns({ setRowAction }),
    [setRowAction],
  );

  const filterFields: DataTableFilterField<AdminExecutive>[] = [
    {
      id: "fullname",
      label: "Persona",
      placeholder: "Filtrar por nombre...",
    },
    {
      id: "role",
      label: "Cargo",
      options: Object.values(ExecutiveRole).map((role) => ({
        label: roleLabels[role],
        value: role,
        count: roleCounts[role],
      })),
    },
    {
      id: "legislative_period" as keyof AdminExecutive,
      label: "Periodo",
      options: legislativePeriods.map((p) => ({
        label: p.name,
        value: p.id,
        count: periodCounts[p.id]?.count,
      })),
    },
  ];

  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.ceil(total / page_size),
    filterFields,
    enableAdvancedFilter: false,
    initialState: {
      sorting: [{ id: "created_at", desc: true }],
      columnPinning: { right: ["actions"] },
      columnVisibility: {},
    },
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable
        table={table}
        floatingBar={<ExecutivesTableFloatingBar table={table} />}
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <ExecutivesTableToolbarActions table={table} />
        </DataTableToolbar>
      </DataTable>
      {rowAction?.type === "update" && (
        <ExecutiveFormDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          mode="edit"
          executiveId={rowAction.row.original.id}
        />
      )}
    </>
  );
}
