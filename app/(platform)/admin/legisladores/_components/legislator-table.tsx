"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { toSentenceCase } from "@/lib/utils";
import { getColumns } from "./legislator-table-columns";
import type { DataTableFilterField, DataTableRowAction } from "@/lib/types";
import { LegislatorsTableFloatingBar } from "./legislator-table-floating-bar";
import { LegislatorsTableToolbarActions } from "./legislator-table-toolbar-actions";
import { AdminLegislator } from "@/interfaces/legislator";

import { ChamberType, LegislatorCondition } from "@/interfaces/politics";
import {
  ChamberCounts,
  ConditionCounts,
  DistrictCounts,
  PaginatedLegislatorsResponse,
} from "../_lib/types";
import { LegislatorFormDialog } from "./legislator-form-dialog";
import { ParliamentaryMembershipDialog } from "./legislator-bancadas-dialog";

interface LegislatorsTableProps {
  promises: Promise<
    [
      PaginatedLegislatorsResponse,
      ChamberCounts,
      ConditionCounts,
      DistrictCounts,
    ]
  >;
}

export function LegislatorsTable({ promises }: LegislatorsTableProps) {
  const [
    { data, total, page_size },
    chamberCounts,
    conditionCounts,
    districtCounts,
  ] = React.use(promises);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AdminLegislator> | null>(null);
  const columns = React.useMemo(
    () => getColumns({ setRowAction }),
    [setRowAction],
  );
  const filterFields: DataTableFilterField<AdminLegislator>[] = [
    {
      id: "fullname",
      label: "Legislador",
      placeholder: "Filtrar por legislador...",
    },
    {
      id: "chamber",
      label: "Cámara",
      options: Object.values(ChamberType).map((cam) => ({
        label: toSentenceCase(cam),
        value: cam,
        count: chamberCounts[toSentenceCase(cam) as ChamberType],
      })),
    },
    {
      id: "condition",
      label: "Condición",
      options: Object.values(LegislatorCondition).map((con) => ({
        label: toSentenceCase(con),
        value: con,
        count: conditionCounts[toSentenceCase(con) as LegislatorCondition],
      })),
    },
    {
      id: "electoral_district" as keyof AdminLegislator,
      label: "Distrito",
      options: Object.entries(districtCounts).map(([, { name, count }]) => ({
        label: name,
        value: name,
        count,
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
      // Ocultar columnas al iniciar
      columnVisibility: {
        end_date: false,
      },
    },
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
    shallow: false,
    clearOnDefault: true,
  });
  return (
    <>
      <DataTable
        table={table}
        floatingBar={<LegislatorsTableFloatingBar table={table} />}
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <LegislatorsTableToolbarActions table={table} />
        </DataTableToolbar>
      </DataTable>
      {rowAction?.type === "update" && (
        <LegislatorFormDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          mode="edit"
          initialData={rowAction.row.original}
        />
      )}
      {rowAction?.type === "update-bancada" && (
        <ParliamentaryMembershipDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          legislator_id={rowAction.row.original.id}
          legislatorName={rowAction.row.original.person?.fullname ?? ""}
          memberships={rowAction.row.original.parliamentary_memberships ?? []}
        />
      )}
    </>
  );
}
