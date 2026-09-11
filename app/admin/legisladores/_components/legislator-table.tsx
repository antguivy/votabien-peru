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
import ResearchPageDialog from "@/components/research/research-page";
import { BatchResearchDialog } from "@/components/research/batch-research-dialog";

interface LegislatorsTableProps {
  promises: Promise<
    [
      PaginatedLegislatorsResponse,
      ChamberCounts,
      ConditionCounts,
      DistrictCounts,
    ]
  >;
  legislativePeriods: { id: string; name: string }[];
  canLaunchResearch?: boolean;
}

export function LegislatorsTable({
  promises,
  legislativePeriods,
  canLaunchResearch = false,
}: LegislatorsTableProps) {
  const [
    { data, total, page_size },
    chamberCounts,
    conditionCounts,
    districtCounts,
  ] = React.use(promises);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AdminLegislator> | null>(null);
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
    {
      id: "legislative_period" as keyof AdminLegislator,
      label: "Periodo",
      options: legislativePeriods.map((p) => ({
        label: p.name,
        value: p.id,
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
        floatingBar={
          <LegislatorsTableFloatingBar
            table={table}
            canLaunchResearch={canLaunchResearch}
          />
        }
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
      {rowAction?.type === "research" && (
        <ResearchPageDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          personId={rowAction.row.original.person_id}
          personName={
            rowAction.row.original.person?.fullname ||
            rowAction.row.original.fullname ||
            "Sin nombre"
          }
        />
      )}

      <BatchResearchDialog
        persons={batchPersons}
        onClose={(failedPersonIds = []) => {
          setBatchPersons(null);
          if (!failedPersonIds || failedPersonIds.length === 0) {
            table.toggleAllRowsSelected(false);
          } else {
            const newSelection: Record<string, boolean> = {};
            table.getRowModel().rows.forEach((row) => {
              if (failedPersonIds.includes(row.original.person_id)) {
                newSelection[row.id] = true;
              }
            });
            table.setRowSelection(newSelection);
          }
        }}
      />
    </>
  );
}
