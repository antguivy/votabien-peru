"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AdminPerson } from "@/interfaces/person";
import {
  queueBatchResearch,
  getBatchResearchProgress,
} from "../../_lib/actions";
import { Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

interface BatchResearchDialogProps {
  candidates: AdminPerson[] | null;
  onClose: () => void;
}

export function BatchResearchDialog({
  candidates,
  onClose,
}: BatchResearchDialogProps) {
  const [batchId, setBatchId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<
    "idle" | "running" | "completed" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const total = candidates?.length || 0;

  React.useEffect(() => {
    if (!candidates || candidates.length === 0) return;

    let isCancelled = false;

    async function startBatch() {
      setStatus("running");
      const res = await queueBatchResearch(candidates!.map((c) => c.id));
      if (isCancelled) return;

      if (!res.success || !res.batch_run_id) {
        setStatus("error");
        setErrorMsg(res.error || "Error iniciando batch");
        return;
      }

      setBatchId(res.batch_run_id);
    }

    startBatch();

    return () => {
      isCancelled = true;
    };
  }, [candidates]);

  React.useEffect(() => {
    if (!batchId || status !== "running") return;

    let interval: NodeJS.Timeout;

    const checkProgress = async () => {
      const res = await getBatchResearchProgress(batchId);
      if (res.success && res.processedCount !== undefined) {
        setProgress(res.processedCount);
        if (res.processedCount >= total) {
          setStatus("completed");
          clearInterval(interval);
        }
      }
    };

    interval = setInterval(checkProgress, 5000); // poll every 5s

    return () => clearInterval(interval);
  }, [batchId, status, total]);

  const percent = total > 0 ? (progress / total) * 100 : 0;

  return (
    <Dialog open={!!candidates} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Investigación por Lotes</DialogTitle>
          <DialogDescription>
            {total} candidatos encolados para investigación automática.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 items-center justify-center">
          {status === "running" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Procesando: {progress} / {total}
              </p>
              <Progress value={percent} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                Puedes cerrar esta ventana. El proceso continuará en segundo
                plano.
              </p>
            </>
          )}

          {status === "error" && (
            <p className="text-sm text-red-500">{errorMsg}</p>
          )}

          {status === "completed" && (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm font-medium">¡Lote completado!</p>
              <p className="text-xs text-muted-foreground text-center">
                Se han generado propuestas de actualización.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link href="/admin/personas/propuestas">
                  Ir a la bandeja de revisión
                </Link>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
