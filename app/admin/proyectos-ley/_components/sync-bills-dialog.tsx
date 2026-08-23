"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { RefreshCw, Terminal, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface SyncBillsDialogProps {
  availablePeriods?: string[];
}

interface DiffStats {
  total_en_reporte: number;
  nuevos: number;
  cambio_estado: number;
  pendientes_ia: number;
  sin_cambios: number;
  total_a_procesar: number;
}

export function SyncBillsDialog({
  availablePeriods = ["2026-2031", "2021-2026"],
}: SyncBillsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [period, setPeriod] = React.useState("2026-2031");
  const [mode, setMode] = React.useState<"auto" | "upload">("auto");
  const [file, setFile] = React.useState<File | null>(null);
  const [limit, setLimit] = React.useState<string>("");
  const [isRunning, setIsRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentAction, setCurrentAction] = React.useState("");
  const [diffStats, setDiffStats] = React.useState<DiffStats | null>(null);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
  };

  const getBaseYear = (p: string) => {
    const m = p.match(/(\d{4})/);
    return m ? parseInt(m[1]) : 2026;
  };

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const resetState = () => {
    setIsRunning(false);
    setProgress(0);
    setCurrentAction("");
    setDiffStats(null);
    setLogs([]);
    setIsCompleted(false);
  };

  const startSync = async () => {
    if (mode === "upload" && !file) {
      toast.error("Por favor selecciona un archivo Excel (.xlsx o .csv).");
      return;
    }

    resetState();
    setIsRunning(true);
    setCurrentAction("Iniciando conexión con el servicio de scraping...");

    try {
      const formData = new FormData();
      formData.append("mode", mode);
      formData.append("period", period);
      formData.append("base_year", String(getBaseYear(period)));
      if (limit && parseInt(limit) > 0) {
        formData.append("limit", limit);
      }
      if (mode === "upload" && file) {
        formData.append("file", file);
      }

      const response = await fetch("/api/admin/bills/sync", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error en el servidor de sincronización.");
      }

      if (!response.body) {
        throw new Error("No se pudo iniciar el stream de eventos.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === "log") {
              setLogs((prev) => [...prev, event.message]);
              setCurrentAction(event.message);
            } else if (event.type === "diff_summary") {
              setDiffStats(event.stats);
              setLogs((prev) => [...prev, event.message]);
            } else if (event.type === "item_start") {
              setCurrentAction(event.message);
              const p = Math.round((event.index / event.total) * 100);
              setProgress(p);
            } else if (event.type === "batch_uploaded") {
              setProgress(event.percent);
              setLogs((prev) => [...prev, event.message]);
            } else if (event.type === "final") {
              setProgress(100);
              setIsCompleted(true);
              setCurrentAction(event.message);
              setLogs((prev) => [...prev, event.message]);
              toast.success(event.message);
            } else if (event.type === "error") {
              setLogs((prev) => [...prev, `❌ ${event.message}`]);
              toast.error(event.message);
            }
          } catch (_jsonErr) {
            // Ignorar líneas incompletas
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
      setLogs((prev) => [...prev, `❌ Error: ${message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleFinish = () => {
    setOpen(false);
    resetState();
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (isRunning) {
          toast.warning(
            "La sincronización sigue en ejecución en segundo plano.",
          );
          return;
        }
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 font-medium shadow-sm">
          <RefreshCw className="h-4 w-4" />
          Sincronizar
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Scraping + Gemini 2.5 Flash
            </span>
          </div>
          <DialogTitle className="text-lg font-bold">
            Sincronización de Proyectos de Ley del Congreso
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Descarga o sube el reporte oficial de SPLey, detecta proyectos
            nuevos o cambios de estado, extrae sumillas con Playwright y genera
            títulos ciudadanos con IA.
          </DialogDescription>
        </DialogHeader>

        {!isRunning && !isCompleted && (
          <div className="space-y-4 py-2">
            {/* Selección de Periodo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Periodo Parlamentario
                </Label>
                <Select value={period} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeriods.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p} {p === "2026-2031" && "(Nuevo Congreso)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Límite de prueba (Opcional)
                </Label>
                <Input
                  type="number"
                  placeholder="Ej: 10 (dejar vacío para todos)"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Modo de Ingestión */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-semibold">
                Método de Obtención del Reporte
              </Label>
              <RadioGroup
                value={mode}
                onValueChange={(val: "auto" | "upload") => setMode(val)}
                className="grid grid-cols-1 gap-2.5"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem
                    value="auto"
                    id="mode-auto"
                    className="mt-1"
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="mode-auto"
                      className="text-sm font-semibold cursor-pointer"
                    >
                      🌐 Descarga Directa desde SPLey (Automático)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Playwright ingresa al buscador oficial de SPLey y exporta
                      el reporte Excel más reciente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem
                    value="upload"
                    id="mode-upload"
                    className="mt-1"
                  />
                  <div className="space-y-0.5 flex-1">
                    <Label
                      htmlFor="mode-upload"
                      className="text-sm font-semibold cursor-pointer"
                    >
                      📁 Cargar Archivo Excel / CSV Manualmente
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Sube el archivo exportado desde tu navegador si el portal
                      del Congreso presenta bloqueos.
                    </p>
                    {mode === "upload" && (
                      <div className="pt-2">
                        <Input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="text-xs"
                        />
                        {file && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {file.name} (
                            {(file.size / 1024).toFixed(1)} KB)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Durante la ejecución o al finalizar */}
        {(isRunning || isCompleted || logs.length > 0) && (
          <div className="space-y-3 py-2">
            {/* Barra de progreso */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="truncate max-w-[80%]">
                  {currentAction || "Procesando..."}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Resumen de Diffing */}
            {diffStats && (
              <div className="grid grid-cols-4 gap-2 text-center text-xs p-2.5 rounded-lg bg-muted/60 border">
                <div>
                  <p className="text-muted-foreground font-medium">
                    Total Reporte
                  </p>
                  <p className="text-base font-bold text-foreground">
                    {diffStats.total_en_reporte}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Nuevos</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    +{diffStats.nuevos}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">
                    Cambio Estado
                  </p>
                  <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                    {diffStats.cambio_estado}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">
                    Sin Cambios
                  </p>
                  <p className="text-base font-bold text-muted-foreground">
                    {diffStats.sin_cambios}
                  </p>
                </div>
              </div>
            )}

            {/* Terminal Logs */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" />
                <span>Registro de operaciones en vivo</span>
              </div>
              <div
                ref={logContainerRef}
                className="bg-zinc-950 text-zinc-200 font-mono text-xs p-3 rounded-lg h-44 overflow-y-auto space-y-1 border border-zinc-800"
              >
                {logs.map((msg, i) => (
                  <div key={i} className="leading-relaxed whitespace-pre-wrap">
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!isRunning && !isCompleted ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={startSync} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Iniciar Sincronización
              </Button>
            </>
          ) : isCompleted ? (
            <Button onClick={handleFinish} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Finalizar y Actualizar Vista
            </Button>
          ) : (
            <Button disabled variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sincronizando en tiempo real...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
