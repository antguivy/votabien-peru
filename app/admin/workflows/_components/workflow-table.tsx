"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { getColumns } from "./workflow-table-columns";
import type { DataTableRowAction } from "@/lib/types";
import { WorkflowFormDialog } from "./workflow-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { deleteWorkflow } from "../_lib/actions";
import { toast } from "sonner";

interface WorkflowTableProps {
  data: any[];
}

export function WorkflowTable({ data }: WorkflowTableProps) {
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<any> | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const columns = React.useMemo(
    () => getColumns({ setRowAction }),
    [setRowAction],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount: 1,
    filterFields: [],
    enableAdvancedFilter: false,
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
    shallow: false,
    clearOnDefault: true,
  });

  React.useEffect(() => {
    if (rowAction?.type === "delete") {
      const confirmDelete = async () => {
        if (
          confirm(
            `¿Estás seguro de eliminar el workflow ${rowAction.row.original.name}?`,
          )
        ) {
          const res = await deleteWorkflow(rowAction.row.original.id);
          if (res.success) toast.success("Workflow eliminado");
          else toast.error("Error eliminando workflow");
        }
        setRowAction(null);
      };
      confirmDelete();
    }
  }, [rowAction]);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Workflow
        </Button>
      </div>
      <DataTable table={table}>
        <div />
      </DataTable>

      <WorkflowFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        workflow={null}
      />

      <WorkflowFormDialog
        open={rowAction?.type === "update"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        workflow={rowAction?.type === "update" ? rowAction.row.original : null}
      />
    </>
  );
}
