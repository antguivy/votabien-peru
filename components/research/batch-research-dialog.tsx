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
import {
  queueBatchResearch,
  getBatchResearchProgress,
} from "@/lib/actions/research";
import { Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

interface BatchItem {
  id: string;
}

interface BatchResearchDialogProps {
  persons: BatchItem[] | null;
  onClose: () => void;
}

export function BatchResearchDialog({
  persons,
  onClose,
}: BatchResearchDialogProps) {
  const [batchId, setBatchId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<
    "idle" | "running" | "completed" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const total = persons?.length || 0;

  React.useEffect(() => {
    if (!persons || persons.length === 0) return;

    let isCancelled = false;

    async function startBatch() {
      setStatus("running");
      const res = await queueBatchResearch(persons!.map((c) => c.id));
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
  }, [persons]);

  React.useEffect(() => {
    if (!batchId || status !== "running") return;

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

    const interval = setInterval(checkProgress, 5000); // poll every 5s

    return () => clearInterval(interval);
  }, [batchId, status, total]);

  const percent = total > 0 ? (progress / total) * 100 : 0;

  return (
    <Dialog open={!!persons} onOpenChange={(open) => !open && onClose()}>
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
                <Link href="/admin/candidatos/revisiones">
                  Ir a la bandeja de revisiones
                </Link>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
