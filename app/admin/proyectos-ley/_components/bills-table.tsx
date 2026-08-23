"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { getColumns } from "./bills-table-columns";
import { BillDetailDialog } from "./bill-detail-dialog";
import { SyncBillsDialog } from "./sync-bills-dialog";
import type { DataTableFilterField } from "@/lib/types";
import { billApprovalStatuses, AdminBillRow } from "../_lib/validation";

interface BillsTableProps {
  promises: Promise<
    [
      { data: AdminBillRow[]; total: number; pageCount: number },
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

export function BillsTable({ promises }: BillsTableProps) {
  const [{ data, pageCount }, { periods, parliamentaryGroups }] =
    React.use(promises);
  const [selectedBill, setSelectedBill] = React.useState<AdminBillRow | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = React.useState(false);

  const handleSelectBill = (bill: AdminBillRow) => {
    setSelectedBill(bill);
    setDetailOpen(true);
  };

  const columns = React.useMemo(
    () => getColumns({ onSelectBill: handleSelectBill }),
    [],
  );

  const filterFields: DataTableFilterField<AdminBillRow>[] = React.useMemo(
    () => [
      {
        id: "search" as keyof AdminBillRow,
        label: "Buscar",
        placeholder: "Buscar por número, título o congresista...",
      },
      {
        id: "period" as keyof AdminBillRow,
        label: "Periodo",
        options: periods.map((p) => ({
          label: p,
          value: p,
        })),
      },
      {
        id: "status" as keyof AdminBillRow,
        label: "Estado",
        options: billApprovalStatuses.map((st) => ({
          label: st.replace(/_/g, " "),
          value: st,
        })),
      },
      {
        id: "parliamentary_group" as keyof AdminBillRow,
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
        <DataTableToolbar table={table} filterFields={filterFields}>
          <SyncBillsDialog availablePeriods={periods} />
        </DataTableToolbar>
      </DataTable>

      <BillDetailDialog
        bill={selectedBill}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
