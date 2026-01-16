"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { toSentenceCase } from "@/lib/utils";
import { getColumns } from "./party-table-columns";
import type { DataTableFilterField, DataTableRowAction } from "@/lib/types";
import { PartyFormDialog } from "./party-form-dialog";
import { ActivePartiesCounts, PaginatedPartiesResponse } from "../_lib/types";
import { AdminPoliticalParty } from "@/interfaces/party";
import { PartiesTableFloatingBar } from "./party-table-floating-bar";
import { PartiesTableToolbarActions } from "./party-table-toolbar-actions";

interface PartiesTableProps {
  promises: Promise<[PaginatedPartiesResponse, ActivePartiesCounts]>;
}

export function PartiesTable({ promises }: PartiesTableProps) {
  const [{ data, total, page_size }, activeCounts] = React.use(promises);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AdminPoliticalParty> | null>(null);
  const columns = React.useMemo(
    () => getColumns({ setRowAction }),
    [setRowAction],
  );
  const filterFields: DataTableFilterField<AdminPoliticalParty>[] = [
    {
      id: "name",
      label: "Partido",
      placeholder: "Filtrar por partido...",
    },
    {
      id: "active",
      label: "Estado",
      options: Object.keys(activeCounts).map((cam) => ({
        label: toSentenceCase(cam),
        value: cam,
        count: activeCounts[cam],
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
        floatingBar={<PartiesTableFloatingBar table={table} />}
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <PartiesTableToolbarActions table={table} />
        </DataTableToolbar>
      </DataTable>
      {rowAction?.type === "update" && (
        <PartyFormDialog
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
