"use client";

import * as React from "react";
import { type Table } from "@tanstack/react-table";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";

import { exportTableToCSV } from "../_lib/export";
import { Button } from "@/components/ui/button";
import { AdminExecutive } from "@/interfaces/executive";

interface ExecutivesTableToolbarActionsProps {
  table: Table<AdminExecutive>;
}

export function ExecutivesTableToolbarActions({
  table,
}: ExecutivesTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "Ejecutivo",
            excludeColumns: ["select", "actions"],
          })
        }
        className="gap-2"
      >
        <PiMicrosoftExcelLogoFill
          className="size-6 text-green-600"
          aria-hidden="true"
        />
        Descargar
      </Button>
    </div>
  );
}
