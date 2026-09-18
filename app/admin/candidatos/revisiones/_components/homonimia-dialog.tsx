"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  startHomonimiaAuditJob,
  getHomonimiaAuditJobStatus,
  applyHomonimiaSelectedRejections,
  revertHomonimiaExcel,
  HomonimiaItemResult,
  HomonimiaAuditResponse,
  HomonimiaJobProgress,
} from "../actions";

interface HomonimiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFindingIds?: string[];
  isAdmin?: boolean;
  onSuccess?: () => void;
}

export function HomonimiaDialog({
  open,
  onOpenChange,
  selectedFindingIds = [],
  isAdmin = false,
  onSuccess,
}: HomonimiaDialogProps) {
  const [activeTab, setActiveTab] = React.useState<"audit" | "revert">("audit");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [isReverting, setIsReverting] = React.useState(false);

  // Configuración de auditoría
  const [skipCapa3, setSkipCapa3] = React.useState(false);
  const [filterMode, setFilterMode] = React.useState<"all" | "rejected_only">(
    "rejected_only",
  );
  const [searchFilter, setSearchFilter] = React.useState("");

  // Resultados
  const [auditResponse, setAuditResponse] =
    React.useState<HomonimiaAuditResponse | null>(null);
  const [selectedForDiscard, setSelectedForDiscard] = React.useState<
    Set<string>
  >(new Set());

  // Rollback file
  const [rollbackFile, setRollbackFile] = React.useState<File | null>(null);

  // Background Job & Polling
  const [_activeJobId, setActiveJobId] = React.useState<string | null>(null);
  const [jobProgress, setJobProgress] =
    React.useState<HomonimiaJobProgress | null>(null);
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling al desmontar o cerrar
  React.useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedForDiscard(new Set());
    }
    onOpenChange(newOpen);
  };

  const handleRunSimulation = async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    setIsLoading(true);
    setJobProgress({
      current: 0,
      total: 0,
      percent: 0,
      fase: "ENCOLANDO",
      detalles: "Despachando trabajo de auditoría en background...",
    });

    try {
      const startRes = await startHomonimiaAuditJob({
        findingIds:
          selectedFindingIds.length > 0 ? selectedFindingIds : undefined,
        dryRun: true,
        skipCapa3,
      });

      if (!startRes.success || !startRes.jobId) {
        toast.error(startRes.error || "Error al iniciar trabajo de auditoría.");
        setIsLoading(false);
        setJobProgress(null);
        return;
      }

      const jobId = startRes.jobId;
      setActiveJobId(jobId);

      // Polling resiliente cada 2.5s sin bloquear el frontend
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await getHomonimiaAuditJobStatus(jobId);

          if (!statusRes.success) {
            // Error de conexión transitorio: reintentar en el siguiente ciclo sin abortar
            return;
          }

          if (statusRes.progress) {
            setJobProgress(statusRes.progress);
          }

          if (statusRes.status === "COMPLETED") {
            clearInterval(pollInterval);
            pollingRef.current = null;
            setIsLoading(false);
            setJobProgress(null);
            setActiveJobId(null);

            const res = statusRes.result;
            if (res) {
              setAuditResponse(res);

              const rejectedSet = new Set<string>();
              (res.results || []).forEach((r) => {
                if (r.decision === "REJECT") {
                  rejectedSet.add(r.proposal_id);
                }
              });
              setSelectedForDiscard(rejectedSet);

              toast.success(
                `Auditoría completada: ${res.rejected_count || 0} homónimos detectados sobre ${res.total_analyzed || 0} evaluados.`,
              );
            }
          } else if (statusRes.status === "FAILED") {
            clearInterval(pollInterval);
            pollingRef.current = null;
            setIsLoading(false);
            setJobProgress(null);
            setActiveJobId(null);
            toast.error(
              statusRes.error ||
                "El trabajo de auditoría falló en el microservicio.",
            );
          }
        } catch (pollErr: unknown) {
          console.warn("Fallo transitorio en sondeo de auditoría:", pollErr);
        }
      }, 2500);

      pollingRef.current = pollInterval;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error inesperado al despachar trabajo";
      toast.error(msg);
      setIsLoading(false);
      setJobProgress(null);
      setActiveJobId(null);
    }
  };

  const handleToggleSelectProposal = (id: string) => {
    setSelectedForDiscard((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = (items: HomonimiaItemResult[]) => {
    setSelectedForDiscard((prev) => {
      const next = new Set(prev);
      const allSelected = items.every((it) => next.has(it.proposal_id));
      if (allSelected) {
        items.forEach((it) => next.delete(it.proposal_id));
      } else {
        items.forEach((it) => next.add(it.proposal_id));
      }
      return next;
    });
  };

  const handleDownloadExcel = () => {
    if (!auditResponse?.excel_base64) {
      toast.error("No hay archivo de auditoría generado.");
      return;
    }

    try {
      const byteCharacters = atob(auditResponse.excel_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = auditResponse.excel_filename || "auditoria_homonimia.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Reporte Excel descargado correctamente.");
    } catch (_err) {
      toast.error("Error al descargar el archivo Excel.");
    }
  };

  const handleApplyDiscards = async () => {
    if (!isAdmin) {
      toast.error(
        "Solo los administradores pueden aplicar descartes definitivos.",
      );
      return;
    }

    if (selectedForDiscard.size === 0) {
      toast.error("No has seleccionado ninguna propuesta para descartar.");
      return;
    }

    const itemsToDiscard = (auditResponse?.results || [])
      .filter((r) => selectedForDiscard.has(r.proposal_id))
      .map((r) => ({
        proposalId: r.proposal_id,
        motivo: r.motivo,
        capa: r.capa,
      }));

    if (
      !confirm(
        `¿Confirmas descartar formalmente ${itemsToDiscard.length} propuestas por Homonimia en la base de datos?`,
      )
    ) {
      return;
    }

    setIsApplying(true);
    try {
      const res = await applyHomonimiaSelectedRejections(itemsToDiscard);
      if (!res.success) {
        toast.error(res.error || "Error al aplicar descartes.");
        return;
      }

      toast.success(
        `Se descartaron ${res.count} propuestas correctamente por Homonimia.`,
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
    } finally {
      setIsApplying(false);
    }
  };

  const handleExecuteRollback = async () => {
    if (!isAdmin) {
      toast.error("Solo los administradores pueden revertir auditorías.");
      return;
    }

    if (!rollbackFile) {
      toast.error(
        "Por favor selecciona un archivo Excel (.xlsx) para revertir.",
      );
      return;
    }

    setIsReverting(true);
    try {
      const formData = new FormData();
      formData.append("file", rollbackFile);

      const res = await revertHomonimiaExcel(formData);
      if (!res.success) {
        toast.error(res.error || "Error al procesar reversión.");
        return;
      }

      toast.success(
        `Rollback exitoso: ${res.reverted_count || 0} propuestas fueron devueltas a estado PENDING.`,
      );
      setRollbackFile(null);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al revertir";
      toast.error(msg);
    } finally {
      setIsReverting(false);
    }
  };

  // Filtrado de resultados en la vista previa
  const filteredResults = React.useMemo(() => {
    if (!auditResponse?.results) return [];
    return auditResponse.results.filter((r) => {
      if (filterMode === "rejected_only" && r.decision !== "REJECT") {
        return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const candMatch = r.candidato.toLowerCase().includes(q);
        const titleMatch = r.title.toLowerCase().includes(q);
        const motiveMatch = r.motivo.toLowerCase().includes(q);
        return candMatch || titleMatch || motiveMatch;
      }
      return true;
    });
  }, [auditResponse, filterMode, searchFilter]);

  const allFilteredSelected =
    filteredResults.length > 0 &&
    filteredResults.every((r) => selectedForDiscard.has(r.proposal_id));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Encabezado */}
        <DialogHeader className="p-5 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Auditoría y Descarte de Homonimia
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Pipeline en cascada (Slugs, Metadatos y Scraping) para
                  descartar homónimos con respaldo en Excel y Rollback.
                </DialogDescription>
              </div>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "audit" | "revert")}
            className="w-full mt-3"
          >
            <TabsList className="grid w-full grid-cols-2 h-9 bg-muted/60">
              <TabsTrigger
                value="audit"
                className="text-xs font-medium gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Simulación & Auditoría en Vivo (Dry-Run)
              </TabsTrigger>
              <TabsTrigger
                value="revert"
                className="text-xs font-medium gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                Reversión desde Excel (Rollback)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "audit" && (
            <>
              {/* Barra de control y configuración */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/70 bg-card/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Alcance:
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium"
                    >
                      {selectedFindingIds.length > 0
                        ? `${selectedFindingIds.length} propuestas seleccionadas`
                        : "Todas las propuestas pendientes"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      id="skip-capa3"
                      checked={skipCapa3}
                      onCheckedChange={setSkipCapa3}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="skip-capa3"
                      className="text-[11px] text-muted-foreground cursor-pointer"
                    >
                      Omitir Capa 3 (0 ms, solo Slugs y Metadatos del card)
                    </Label>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRunSimulation}
                    disabled={isLoading}
                    className="h-8 text-xs font-medium gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {auditResponse
                      ? "Re-ejecutar Dry-Run"
                      : "Iniciar Simulación (Dry-Run)"}
                  </Button>
                </div>
              </div>

              {/* Tarjeta de Progreso del Trabajo Asíncrono */}
              {isLoading && jobProgress && (
                <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      {jobProgress.detalles ||
                        "Procesando auditoría en background..."}
                    </span>
                    <span className="font-semibold text-primary">
                      {jobProgress.percent}%
                    </span>
                  </div>
                  <Progress value={jobProgress.percent} className="h-1.5" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span>
                      Progreso: <b>{jobProgress.current}</b> de{" "}
                      <b>{jobProgress.total}</b> propuestas
                    </span>
                    <span>
                      Fase: <b>{jobProgress.fase}</b> (4 workers concurrentes)
                    </span>
                  </div>
                </div>
              )}

              {/* Métricas del Benchmark en vivo */}
              {auditResponse && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Evaluadas
                    </span>
                    <p className="text-xl font-bold text-foreground mt-0.5">
                      {auditResponse.total_analyzed ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-semibold">
                      Homónimos Detectados
                    </span>
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      {auditResponse.rejected_count ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
                      Conservadas (KEEP)
                    </span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {auditResponse.kept_count ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Desglose por Capa
                    </span>
                    <div className="text-[11px] text-muted-foreground space-y-0.5 mt-0.5">
                      <span className="inline-block mr-2">
                        C1:{" "}
                        <b>
                          {auditResponse.layers_breakdown?.capa_1_slug ?? 0}
                        </b>
                      </span>
                      <span className="inline-block mr-2">
                        C2:{" "}
                        <b>
                          {auditResponse.layers_breakdown?.capa_2_metadatos ??
                            0}
                        </b>
                      </span>
                      <span className="inline-block">
                        C3:{" "}
                        <b>
                          {auditResponse.layers_breakdown?.capa_3_contenido ??
                            0}
                        </b>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtros de la lista en vivo */}
              {auditResponse && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar candidato o titular..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border/60">
                      <button
                        type="button"
                        onClick={() => setFilterMode("rejected_only")}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${
                          filterMode === "rejected_only"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Solo Homónimos ({auditResponse.rejected_count ?? 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode("all")}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${
                          filterMode === "all"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Todos ({auditResponse.total_analyzed ?? 0})
                      </button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadExcel}
                      className="h-8 text-xs gap-1.5 border-emerald-600/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Descargar Excel
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista interactiva card por card */}
              {auditResponse && (
                <div className="rounded-lg border border-border/80 overflow-hidden bg-card">
                  <div className="p-2.5 bg-muted/40 border-b border-border/60 flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={() =>
                          handleSelectAllFiltered(filteredResults)
                        }
                      />
                      <span>
                        Propuesta & Noticia ({filteredResults.length})
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {selectedForDiscard.size} marcadas para descarte
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-border/60 text-xs">
                    {filteredResults.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        No se encontraron propuestas bajo el filtro actual.
                      </div>
                    ) : (
                      filteredResults.map((item) => {
                        const isSelected = selectedForDiscard.has(
                          item.proposal_id,
                        );
                        const isReject = item.decision === "REJECT";

                        return (
                          <div
                            key={item.proposal_id}
                            className={`p-3 transition-colors flex items-start gap-3 ${
                              isReject
                                ? isSelected
                                  ? "bg-rose-500/5 hover:bg-rose-500/10"
                                  : "opacity-60 hover:opacity-100"
                                : "hover:bg-muted/30"
                            }`}
                          >
                            <div className="pt-0.5">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleToggleSelectProposal(item.proposal_id)
                                }
                              />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-foreground text-xs">
                                  {item.candidato}
                                </span>
                                <Badge
                                  variant={
                                    isReject ? "destructive" : "secondary"
                                  }
                                  className="text-[10px] px-1.5 py-0 h-4 uppercase font-bold"
                                >
                                  {item.decision}
                                </Badge>
                                {item.capa !== "NINGUNA" && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-600 dark:text-amber-400 font-mono"
                                  >
                                    {item.capa}
                                  </Badge>
                                )}
                              </div>

                              <p className="text-xs text-foreground/90 font-medium line-clamp-1">
                                {item.title || "Sin titular"}
                              </p>

                              <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/40">
                                <span className="font-semibold text-foreground/80">
                                  Motivo técnico:{" "}
                                </span>
                                {item.motivo}
                              </div>

                              {item.url && (
                                <div className="pt-0.5">
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline max-w-full truncate"
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{item.url}</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "revert" && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg border border-border bg-card/60 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    Restauración de Propuestas desde Reporte Excel
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Si durante o después de una auditoría descubres que alguna
                    propuesta descartada debe conservarse, sube aquí el archivo
                    Excel generado. El sistema leerá la columna{" "}
                    <code className="bg-muted px-1 rounded text-primary font-mono">
                      proposal_id
                    </code>{" "}
                    y devolverá los registros a estado{" "}
                    <code className="bg-muted px-1 rounded font-mono">
                      PENDING
                    </code>{" "}
                    atómicamente.
                  </p>
                </div>

                <div className="border-2 border-dashed border-border/80 rounded-lg p-6 text-center space-y-2 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">
                    <label
                      htmlFor="excel-upload"
                      className="font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Haz clic para seleccionar el archivo Excel (.xlsx)
                    </label>
                    <input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx, .xls"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setRollbackFile(file);
                      }}
                    />
                  </div>
                  {rollbackFile && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {rollbackFile.name} (
                      {(rollbackFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleExecuteRollback}
                    disabled={!rollbackFile || isReverting || !isAdmin}
                    className="h-8 text-xs font-medium gap-1.5"
                  >
                    {isReverting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Restaurar Propuestas a PENDING
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Diálogo */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-xs text-muted-foreground text-left w-full sm:w-auto">
            {activeTab === "audit" && auditResponse && (
              <span>
                {selectedForDiscard.size} marcadas para aplicar como{" "}
                <b className="text-rose-600 dark:text-rose-400">REJECTED</b>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cerrar
            </Button>

            {activeTab === "audit" && auditResponse && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleApplyDiscards}
                      disabled={
                        !isAdmin || isApplying || selectedForDiscard.size === 0
                      }
                      className="h-8 text-xs font-medium gap-1.5"
                    >
                      {isApplying ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Aplicar Descartes ({selectedForDiscard.size})
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isAdmin && (
                  <TooltipContent className="text-xs max-w-xs">
                    Solo los usuarios con rol Administrador pueden aplicar
                    descartes definitivos en la base de datos.
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
