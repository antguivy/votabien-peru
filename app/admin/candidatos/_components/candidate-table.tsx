"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { toSentenceCase } from "@/lib/utils";
import { getColumns } from "./candidate-table-columns";
import type { DataTableFilterField, DataTableRowAction } from "@/lib/types";
import { CandidatesTableToolbarActions } from "./candidate-table-toolbar-actions";
import { CandidacyStatus, CandidacyType } from "@/interfaces/politics";
import {
  PaginatedCandidatesResponse,
  PartyCounts,
  StatusCounts,
  TypeCounts,
} from "../_lib/types";
import { CandidatesTableFloatingBar } from "./candidate-table-floating-bar";
import { AdminCandidate } from "@/interfaces/candidate";
import { CandidateFormDialog } from "./candidate-form-dialog";

interface CandidatesTableProps {
  promises: Promise<
    [PaginatedCandidatesResponse, TypeCounts, StatusCounts, PartyCounts]
  >;
}

export function CandidatesTable({ promises }: CandidatesTableProps) {
  const [{ data, total, page_size }, typeCounts, statusCounts, partyCounts] =
    React.use(promises);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AdminCandidate> | null>(null);
  const columns = React.useMemo(
    () => getColumns({ setRowAction }),
    [setRowAction],
  );
  const filterFields: DataTableFilterField<AdminCandidate>[] = [
    {
      id: "fullname",
      label: "Candidato",
      placeholder: "Filtrar por nombre...",
    },
    {
      id: "type",
      label: "Tipo",
      options: Object.values(CandidacyType).map((cam) => ({
        label: toSentenceCase(cam),
        value: cam,
        count: typeCounts[toSentenceCase(cam) as CandidacyType],
      })),
    },
    {
      id: "status",
      label: "Estado",
      options: Object.values(CandidacyStatus).map((con) => ({
        label: toSentenceCase(con),
        value: con,
        count: statusCounts[toSentenceCase(con) as CandidacyStatus],
      })),
    },
    {
      id: "parties" as keyof AdminCandidate,
      label: "Org. Política",
      options: Object.entries(partyCounts).map(([, { name, count }]) => ({
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
        floatingBar={<CandidatesTableFloatingBar table={table} />}
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <CandidatesTableToolbarActions table={table} />
        </DataTableToolbar>
      </DataTable>
      {rowAction?.type === "update" && (
        <CandidateFormDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          mode="edit"
          initialData={rowAction.row.original}
        />
      )}
      {/* {rowAction?.type === "update-bancada" && (
        <ParliamentaryMembershipDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          legislator_id={rowAction.row.original.id}
          legislatorName={rowAction.row.original.person?.fullname ?? ""}
          memberships={rowAction.row.original.parliamentary_memberships ?? []}
        />
      )} */}
    </>
  );
}
