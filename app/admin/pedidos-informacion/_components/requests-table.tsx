"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { getColumns } from "./requests-table-columns";
import { RequestDetailDialog } from "./request-detail-dialog";
import { SyncRequestsDialog } from "./sync-requests-dialog";
import { DataTableSearchInput } from "@/components/data-table/data-table-search-input";
import type { DataTableFilterField } from "@/lib/types";
import { AdminInformationRequestRow } from "../_lib/types";

interface RequestsTableProps {
  promises: Promise<
    [
      { data: AdminInformationRequestRow[]; total: number; pageCount: number },
      {
        periods: string[];
      },
    ]
  >;
}

export function RequestsTable({ promises }: RequestsTableProps) {
  const [{ data, pageCount }, { periods }] = React.use(promises);
  const [selectedRequest, setSelectedRequest] =
    React.useState<AdminInformationRequestRow | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const handleSelectRequest = (req: AdminInformationRequestRow) => {
    setSelectedRequest(req);
    setDetailOpen(true);
  };

  const columns = React.useMemo(
    () => getColumns({ onSelectRequest: handleSelectRequest }),
    [],
  );

  const filterFields: DataTableFilterField<AdminInformationRequestRow>[] =
    React.useMemo(
      () => [
        {
          id: "chamber" as keyof AdminInformationRequestRow,
          label: "Cámara",
          options: [
            { label: "Cámara de Diputados", value: "DIPUTADOS" },
            { label: "Senado de la República", value: "SENADO" },
          ],
        },
        {
          id: "period" as keyof AdminInformationRequestRow,
          label: "Periodo",
          options: periods.map((p) => ({
            label: p,
            value: p,
          })),
        },
      ],
      [periods],
    );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    enableAdvancedFilter: false,
    initialState: {
      sorting: [{ id: "document_date", desc: true }],
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
            <DataTableSearchInput placeholder="Buscar por número, entidad, sumilla o congresista..." />
          }
        >
          <SyncRequestsDialog availablePeriods={periods} />
        </DataTableToolbar>
      </DataTable>

      <RequestDetailDialog
        request={selectedRequest}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
