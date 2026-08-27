"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { toSentenceCase } from "@/lib/utils";
import { getColumns } from "./candidate-table-columns";
import type { DataTableFilterField, DataTableRowAction } from "@/lib/types";
import { CandidatesTableToolbarActions } from "./candidate-table-toolbar-actions";
import {
  PaginatedCandidatesResponse,
  PartyCounts,
  StatusCounts,
  TypeCounts,
} from "../_lib/types";
import { CandidatesTableFloatingBar } from "./candidate-table-floating-bar";
import {
  AdminCandidate,
  CandidacyStatus,
  CandidacyType,
} from "@/interfaces/candidate";
import { CandidateFormDialog } from "./candidate-form-dialog";
import { EmbeddingDialog } from "./embedding-dialog";
import ResearchPageDialog from "@/components/research/research-page";
import { BatchResearchDialog } from "@/components/research/batch-research-dialog";

interface CandidatesTableProps {
  promises: Promise<
    [PaginatedCandidatesResponse, TypeCounts, StatusCounts, PartyCounts]
  >;
  districts?: { id: string; name: string; level?: string | null }[];
  canLaunchResearch?: boolean;
}

export function CandidatesTable({
  promises,
  districts = [],
  canLaunchResearch = false,
}: CandidatesTableProps) {
  const [{ data, total, page_size }, typeCounts, statusCounts, partyCounts] =
    React.use(promises);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AdminCandidate> | null>(null);
  const [batchPersons, setBatchPersons] = React.useState<
    { id: string }[] | null
  >(null);

  React.useEffect(() => {
    const handleBatchOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      setBatchPersons(customEvent.detail.rows);
    };
    window.addEventListener("open-batch-research", handleBatchOpen);
    return () =>
      window.removeEventListener("open-batch-research", handleBatchOpen);
  }, []);
  const columns = React.useMemo(
    () => getColumns({ setRowAction, canLaunchResearch }),
    [setRowAction, canLaunchResearch],
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
    {
      id: "district" as keyof AdminCandidate,
      label: "Región",
      options: districts
        .filter((d) => d.level === "REGIONAL")
        .map((d) => ({ label: d.name, value: d.name })),
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
        floatingBar={
          <CandidatesTableFloatingBar
            table={table}
            canLaunchResearch={canLaunchResearch}
          />
        }
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
          candidateId={rowAction.row.original.id}
        />
      )}
      {rowAction?.type === "generate-embedding" && (
        <EmbeddingDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          personId={rowAction.row.original.person_id}
          fullname={rowAction.row.original.person?.fullname || "Desconocido"}
        />
      )}
      {rowAction?.type === "research" && (
        <ResearchPageDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          personId={rowAction.row.original.person_id}
          personName={rowAction.row.original.person?.fullname || "Sin nombre"}
        />
      )}

      <BatchResearchDialog
        persons={batchPersons}
        onClose={() => {
          setBatchPersons(null);
          table.toggleAllRowsSelected(false);
        }}
      />
    </>
  );
}
