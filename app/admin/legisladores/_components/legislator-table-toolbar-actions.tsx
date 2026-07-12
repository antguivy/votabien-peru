"use client";

import { useState } from "react";
import { type Table } from "@tanstack/react-table";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { Upload } from "lucide-react";

import { exportTableToCSV } from "../_lib/export";
import { Button } from "@/components/ui/button";
import { AdminLegislator } from "@/interfaces/legislator";
import { LegislatorImportDialog } from "./legislator-import-dialog";

interface LegislatorTableToolbarActionsProps {
  table: Table<AdminLegislator>;
}

export function LegislatorsTableToolbarActions({
  table,
}: LegislatorTableToolbarActionsProps) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setImportOpen(true)}
        className="gap-2"
      >
        <Upload className="size-4" aria-hidden="true" />
        Importar
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "Legisladores",
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

      <LegislatorImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
