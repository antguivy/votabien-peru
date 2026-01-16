import * as React from "react";
import { SelectTrigger } from "@radix-ui/react-select";
import { type Table } from "@tanstack/react-table";
import {
  CheckCircle2,
  Download,
  Loader,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { exportTableToCSV } from "../_lib/export";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/ui/portal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/kbd";
import { bulkUpdateLegislators } from "../_lib/actions";
import { toast } from "sonner";
import { AdminLegislator } from "@/interfaces/legislator";

interface LegislatorsTableFloatingBarProps {
  table: Table<AdminLegislator>;
}

export function LegislatorsTableFloatingBar({
  table,
}: LegislatorsTableFloatingBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;

  const [isPending, startTransition] = React.useTransition();
  const [action, setAction] = React.useState<
    "update-active" | "export" | "delete"
  >();

  // Clear selection on Escape key press
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        table.toggleAllRowsSelected(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [table]);

  return (
    <Portal>
      <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit px-2.5">
        <div className="w-full overflow-x-auto">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-md border bg-background p-2 text-foreground shadow">
            <div className="flex h-7 items-center rounded-md border border-dashed pl-2.5 pr-1">
              <span className="whitespace-nowrap text-xs">
                {rows.length > 1
                  ? `${rows.length} seleccionados`
                  : `${rows.length} seleccionado`}
              </span>
              <Separator orientation="vertical" className="ml-2 mr-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 hover:border"
                    onClick={() => table.toggleAllRowsSelected(false)}
                  >
                    <X className="size-3.5 shrink-0" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="flex items-center border bg-accent px-2 py-1 font-semibold text-foreground dark:bg-zinc-900">
                  <p className="mr-2">Limpiar Selección</p>
                  <Kbd abbrTitle="Escape" variant="outline">
                    Esc
                  </Kbd>
                </TooltipContent>
              </Tooltip>
            </div>
            <Separator orientation="vertical" className="hidden h-5 sm:block" />
            <div className="flex items-center gap-1.5">
              <Select
                onValueChange={(value: string) => {
                  setAction("update-active");

                  startTransition(async () => {
                    const result = await bulkUpdateLegislators({
                      ids: rows.map((row) => row.original.id),
                      active: value === "true", // Convierte string a boolean
                    });

                    if (result.error) {
                      toast.error(result.error);
                      return;
                    }

                    if ("data" in result && result.data) {
                      const status =
                        value === "true" ? "activado(s)" : "desactivado(s)";
                      toast.success(
                        `${result.data.count} legislador(es) ${status} correctamente`,
                      );
                    }

                    table.toggleAllRowsSelected(false);
                  });
                }}
              >
                <Tooltip>
                  <SelectTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7 border data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                        disabled={isPending}
                      >
                        {isPending && action === "update-active" ? (
                          <Loader
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle2
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        )}
                      </Button>
                    </TooltipTrigger>
                  </SelectTrigger>
                  <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                    <p>Actualizar Estado Activo</p>
                  </TooltipContent>
                </Tooltip>
                <SelectContent align="center">
                  <SelectGroup>
                    <SelectItem
                      value="true"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="size-4 text-green-600 inline" />
                      Sí (Activo)
                    </SelectItem>
                    <SelectItem
                      value="false"
                      className="flex items-center gap-2"
                    >
                      <XCircle className="size-4 text-red-600 inline" />
                      No (Inactivo)
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 border"
                    onClick={() => {
                      setAction("export");

                      startTransition(() => {
                        exportTableToCSV(table, {
                          excludeColumns: ["select", "actions"],
                          onlySelected: true,
                        });
                      });
                    }}
                    disabled={isPending}
                  >
                    {isPending && action === "export" ? (
                      <Loader
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Download className="size-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                  <p>Exportar Legisladores</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 border"
                    onClick={() => {
                      setAction("delete");

                      // startTransition(async () => {
                      //   const { error } = await deleteIncidents({
                      //     ids: rows.map((row) => row.original.id),
                      //   })

                      //   if (error) {
                      //     toast.error(error)
                      //     return
                      //   }

                      //   table.toggleAllRowsSelected(false)
                      // })
                    }}
                    disabled={isPending}
                  >
                    {isPending && action === "delete" ? (
                      <Loader
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                  <p>Eliminar Legisladores</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
