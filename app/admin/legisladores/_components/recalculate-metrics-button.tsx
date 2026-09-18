"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calculator, Loader2 } from "lucide-react";
import { recalculateAllLegislatorMetrics } from "../_lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RecalculateMetricsButton() {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const handleRecalculate = () => {
    startTransition(async () => {
      try {
        const res = await recalculateAllLegislatorMetrics();
        if (res.success) {
          toast.success(
            `Métricas actualizadas: ${res.count} legisladores procesados (${res.period}).`,
          );
          router.refresh();
        } else {
          toast.error(res.error || "Error al recalcular métricas");
        }
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Error inesperado al ejecutar el cálculo.",
        );
      }
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleRecalculate}
      disabled={isPending}
      title="Recalcular métricas de producción, fiscalización, transfuguismo y asistencia para todos los legisladores activos"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Calculator className="w-4 h-4" />
      )}
      {isPending ? "Calculando..." : "Recalcular Métricas"}
    </Button>
  );
}
