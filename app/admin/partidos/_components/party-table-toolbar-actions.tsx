"use client";

import { type Table } from "@tanstack/react-table";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";

import { exportTableToCSV } from "../_lib/export";
import { Button } from "@/components/ui/button";
import { AdminPoliticalParty } from "@/interfaces/party";

// import { DeleteTasksDialog } from "./delete-tasks-dialog"

interface PartyTableToolbarActionsProps {
  table: Table<AdminPoliticalParty>;
}

export function PartiesTableToolbarActions({
  table,
}: PartyTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteTasksDialog
          tasks={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null} */}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "Partidos",
            excludeColumns: ["select", "actions"],
          })
        }
        className="gap-2"
      >
        {/* <Download className="size-4" aria-hidden="true" /> */}
        <PiMicrosoftExcelLogoFill
          className="size-6 text-green-600"
          aria-hidden="true"
        />
        Descargar
      </Button>
    </div>
  );
}
