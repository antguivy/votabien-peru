"use client";

import * as React from "react";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import {
  queueBatchResearch,
  getBatchResearchProgress,
} from "@/lib/actions/research";
import { getActiveWorkflows } from "@/app/admin/workflows/_lib/actions";
import { Loader2, CheckCircle2, Play, Bot, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-provider";

interface BatchItem {
  id: string;
}

interface BatchResearchDialogProps {
  persons: BatchItem[] | null;
  onClose: (failedPersonIds?: string[]) => void;
}

export function BatchResearchDialog({
  persons,
  onClose,
}: BatchResearchDialogProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [batchId, setBatchId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [completedCount, setCompletedCount] = React.useState(0);
  const [failedCount, setFailedCount] = React.useState(0);
  const [failedPersonIds, setFailedPersonIds] = React.useState<string[]>([]);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [workflows, setWorkflows] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [selectedWorkflowId, setSelectedWorkflowId] =
    React.useState<string>("");
  const [isLoadingWorkflows, setIsLoadingWorkflows] = React.useState(true);
  const [status, setStatus] = React.useState<
    "idle" | "running" | "completed" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const total = persons?.length || 0;

  const handleClose = (failedIds?: string[]) => {
    setBatchId(null);
    setProgress(0);
    setCompletedCount(0);
    setFailedCount(0);
    setFailedPersonIds([]);
    setIsRetrying(false);
    setStatus("idle");
    setErrorMsg("");
    onClose(failedIds);
  };

  React.useEffect(() => {
    if (!persons || persons.length === 0) return;

    let ignore = false;
    async function loadWorkflows() {
      setIsLoadingWorkflows(true);
      try {
        const res = await getActiveWorkflows();
        if (
          !ignore &&
          res.success &&
          res.workflows &&
          res.workflows.length > 0
        ) {
          setWorkflows(res.workflows);
          setSelectedWorkflowId(res.workflows[0].id);
        }
      } catch (err) {
        console.error("Error loading workflows:", err);
      } finally {
        if (!ignore) setIsLoadingWorkflows(false);
      }
    }

    loadWorkflows();
    return () => {
      ignore = true;
    };
  }, [persons]);

  const handleStartBatch = async () => {
    if (!isAdmin) return;
    if (!persons || persons.length === 0) return;
    setStatus("running");
    setErrorMsg("");

    const res = await queueBatchResearch(
      persons.map((c) => c.id),
      selectedWorkflowId || undefined,
    );

    if (!res.success || !res.batch_run_id) {
      setStatus("error");
      setErrorMsg(res.error || "Error iniciando batch");
      return;
    }

    setBatchId(res.batch_run_id);
  };

  React.useEffect(() => {
    if (!batchId || status !== "running") return;

    const checkProgress = async () => {
      const res = await getBatchResearchProgress(batchId);
      if (res.success && res.processedCount !== undefined) {
        setProgress(res.processedCount);
        setCompletedCount(res.completedCount || 0);
        setFailedCount(res.failedCount || 0);
        setFailedPersonIds(res.failedPersonIds || []);

        if (res.processedCount >= total) {
          setStatus("completed");
          clearInterval(interval);
        }
      }
    };

    const interval = setInterval(checkProgress, 4000); // poll every 4s

    return () => clearInterval(interval);
  }, [batchId, status, total]);

  const handleRetryFailed = async () => {
    if (!isAdmin) return;
    if (failedPersonIds.length === 0) return;
    setIsRetrying(true);
    const res = await queueBatchResearch(
      failedPersonIds,
      selectedWorkflowId || undefined,
    );
    setIsRetrying(false);
    if (res.success && res.batch_run_id) {
      setBatchId(res.batch_run_id);
      setProgress(0);
      setCompletedCount(0);
      setFailedCount(0);
      setFailedPersonIds([]);
      setStatus("running");
    } else {
      setErrorMsg(res.error || "Error al reintentar candidatos fallidos");
    }
  };

  const percent = total > 0 ? (progress / total) * 100 : 0;

  return (
    <Credenza
      open={!!persons}
      onOpenChange={(open) => {
        if (!open && status !== "running") {
          handleClose(status === "completed" ? failedPersonIds : undefined);
        }
      }}
    >
      <CredenzaContent
        className="sm:max-w-[450px]"
        onInteractOutside={(e: Event) => e.preventDefault()}
        onEscapeKeyDown={(e: KeyboardEvent) => {
          if (status === "running") {
            e.preventDefault();
          }
        }}
      >
        <CredenzaHeader>
          <CredenzaTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Investigación por Lotes
          </CredenzaTitle>
          <CredenzaDescription>
            {total} candidato(s) seleccionados. Rastrea antecedentes y noticias
            públicas con scraping e IA.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="flex flex-col gap-4 py-2 px-1 sm:px-4">
          {status === "idle" && (
            <div className="space-y-4">
              <div className="space-y-2 border rounded-lg p-3.5 bg-slate-50 dark:bg-slate-900/50">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Workflow de Inteligencia Artificial
                </Label>
                {isLoadingWorkflows ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cargando configuraciones de workflow...
                  </div>
                ) : (
                  <Select
                    value={selectedWorkflowId}
                    onValueChange={setSelectedWorkflowId}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-950 text-xs">
                      <SelectValue placeholder="Seleccionar workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map((wf) => (
                        <SelectItem
                          key={wf.id}
                          value={wf.id}
                          className="text-xs"
                        >
                          {wf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Aplica los prompts de compresión, modelos de razonamiento y
                  fuentes activas configuradas para este flujo.
                </p>
              </div>

              {!isAdmin && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                      Modo informativo (Solo Administradores)
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      El motor de scraping y extracción IA se ejecuta en local
                      por el equipo técnico para optimizar recursos.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => handleClose()}>
                  Cerrar
                </Button>
                <Button
                  onClick={handleStartBatch}
                  disabled={
                    !isAdmin || isLoadingWorkflows || workflows.length === 0
                  }
                  className="gap-2"
                >
                  {!isAdmin ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Solo Administradores
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Iniciar Lote ({total})
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {status === "running" && (
            <div className="flex flex-col gap-4 py-4 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">
                Procesando: {progress} / {total} candidatos
              </p>
              <Progress value={percent} className="w-full" />
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                El lote se está ejecutando. Por favor espera a que finalice el
                proceso.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-red-500 text-center font-medium">
                {errorMsg}
              </p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setStatus("idle")}>
                  Volver a intentar
                </Button>
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="flex flex-col gap-4 py-2 items-center justify-center">
              {failedCount > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-amber-600 font-medium">
                    <span>⚠️ Lote finalizado con observaciones</span>
                  </div>
                  <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p className="text-emerald-600 font-medium">
                      ✅ {completedCount} completado(s) con éxito
                    </p>
                    <p className="text-rose-600 font-medium">
                      ❌ {failedCount} con error o incompletos
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full mt-2">
                    <Button
                      variant="default"
                      onClick={handleRetryFailed}
                      disabled={isRetrying}
                      className="w-full"
                    >
                      {isRetrying ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Reintentar {failedCount} fallido(s)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleClose(failedPersonIds)}
                      className="w-full"
                    >
                      Cerrar (mantener {failedCount} seleccionados)
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">
                    ¡Lote completado con éxito!
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Se procesaron los {completedCount} candidatos correctamente.
                  </p>
                  <Button
                    onClick={() => handleClose([])}
                    className="mt-4 w-full"
                  >
                    Cerrar y continuar
                  </Button>
                </>
              )}
            </div>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
