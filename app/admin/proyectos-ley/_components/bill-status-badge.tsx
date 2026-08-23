import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BillStatusBadgeProps {
  status: string;
  className?: string;
}

export function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  const formatStatus = (st: string) => {
    return st
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getVariantStyles = (st: string) => {
    switch (st) {
      case "PUBLICADO":
      case "APROBADO":
      case "AUTOGRAFA":
      case "APROBADO_PRIMERA_VOTACION":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium";

      case "DICTAMEN":
      case "EN_AGENDA_PLENO":
      case "ORDEN_DEL_DIA":
      case "PENDIENTE_SEGUNDA_VOTACION":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 font-medium";

      case "EN_COMISION":
      case "PRESENTADO":
      case "EN_CUARTO_INTERMEDIO":
      case "RETORNA_A_COMISION":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium";

      case "AL_ARCHIVO":
      case "DECRETO_ARCHIVO":
      case "RETIRADO_POR_AUTOR":
        return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 font-medium";

      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-0.5 text-xs font-medium whitespace-nowrap shadow-none",
        getVariantStyles(status),
        className,
      )}
    >
      {formatStatus(status)}
    </Badge>
  );
}
