"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
// import { toSentenceCase } from "@/lib/utils";
import { getColumns } from "./person-table-columns";
import type { DataTableFilterField, DataTableRowAction } from "@/lib/types";
import { PersonFormDialog } from "./person-form-dialog";
import { PaginatedPersonResponse } from "../_lib/types";
import { PersonTableFloatingBar } from "./person-table-floating-bar";
import { PersonTableToolbarActions } from "./person-table-toolbar-actions";
import { AdminPerson } from "@/interfaces/person";
import { BiographyFormDialog } from "./biography-form-dialog";
import { BackgroundsFormDialog } from "./background-form-dialog";

interface PersonTableProps {
  promises: Promise<[PaginatedPersonResponse]>;
}

export function PersonTable({ promises }: PersonTableProps) {
  const [{ data, total, page_size }] = React.use(promises);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AdminPerson> | null>(null);
  const columns = React.useMemo(
    () => getColumns({ setRowAction }),
    [setRowAction],
  );
  const filterFields: DataTableFilterField<AdminPerson>[] = [
    {
      id: "fullname",
      label: "Nombre y Apellido",
      placeholder: "Filtrar por nombre...",
    },
    // {
    //   id: "active",
    //   label: "Estado",
    //   options: Object.keys(activeCounts).map((cam) => ({
    //     label: toSentenceCase(cam),
    //     value: cam,
    //     count: activeCounts[cam],
    //   })),
    // },
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
        floatingBar={<PersonTableFloatingBar table={table} />}
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <PersonTableToolbarActions table={table} />
        </DataTableToolbar>
      </DataTable>
      {rowAction?.type === "update" && (
        <PersonFormDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          mode="edit"
          initialData={rowAction.row.original}
        />
      )}
      {rowAction?.type === "update-biography" && (
        <BiographyFormDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          personId={rowAction.row.original.id}
          personName={rowAction.row.original.fullname}
          initialBiography={rowAction.row.original.detailed_biography ?? []}
        />
      )}
      {rowAction?.type === "update-background" && (
        <BackgroundsFormDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          personId={rowAction.row.original.id}
          personName={rowAction.row.original.fullname}
          initialData={rowAction.row.original.backgrounds ?? []}
        />
      )}
    </>
  );
}
