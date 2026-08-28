"use client";

import * as React from "react";
import { parseAsString, useQueryState } from "nuqs";
import { Vote } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ElectoralProcess } from "@/interfaces/politics";

interface ElectoralProcessFilterProps {
  processes?: ElectoralProcess[];
}

export function ElectoralProcessFilter({
  processes = [],
}: ElectoralProcessFilterProps) {
  const [processParam, setProcessParam] = useQueryState(
    "process",
    parseAsString.withOptions({ shallow: false }).withDefault(""),
  );
  const [, setPage] = useQueryState(
    "page",
    parseAsString.withOptions({ shallow: false }),
  );

  const handleValueChange = (val: string) => {
    void setPage("1");
    if (val === "ALL") {
      void setProcessParam(null);
    } else {
      void setProcessParam(val);
    }
  };

  const selectedValue = processParam || "ALL";

  return (
    <div className="inline-flex items-center gap-1.5">
      <Select value={selectedValue} onValueChange={handleValueChange}>
        <SelectTrigger className="h-8 text-xs font-medium gap-1.5 w-auto min-w-[150px] max-w-[240px] border-dashed">
          <Vote className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="Proceso electoral" />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="ALL" className="text-xs">
            Todos los procesos activos
          </SelectItem>
          {processes.map((proc) => (
            <SelectItem key={proc.id} value={proc.id} className="text-xs">
              {proc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
