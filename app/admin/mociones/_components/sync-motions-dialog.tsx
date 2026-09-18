"use client";

import * as React from "react";
import {
  Credenza,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza";
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
import { toast } from "sonner";
import {
  RefreshCw,
  Terminal,
  FileSpreadsheet,
  Globe,
  Upload,
  CheckCircle2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SyncMotionsDialogProps {
  availablePeriods?: string[];
}

interface DiffStats {
  total_reporte: number;
  nuevos: number;
  cambio_estado: number;
  sin_cambios: number;
  total_a_procesar: number;
}

export function SyncMotionsDialog({
  availablePeriods = ["2026-2031", "2021-2026"],
}: SyncMotionsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [period, setPeriod] = React.useState("2026-2031");
  const [chamber, setChamber] = React.useState<"DIPUTADOS" | "SENADO">(
    "DIPUTADOS",
  );
  const [mode, setMode] = React.useState<"auto" | "upload">("auto");
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [limit, setLimit] = React.useState<string>("");
  const [isRunning, setIsRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentAction, setCurrentAction] = React.useState("");
  const [diffStats, setDiffStats] = React.useState<DiffStats | null>(null);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [isCompleted, setIsCompleted] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const validateAndSetFile = (f: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error(
        "Formato no compatible. Por favor sube un archivo Excel (.xlsx, .xls) o CSV.",
      );
      return;
    }
    setFile(f);
  };

  const startSync = async () => {
    if (mode === "upload" && !file) {
      toast.error(
        "Por favor selecciona o arrastra un archivo Excel (.xlsx o .csv).",
      );
      return;
    }

    resetState();
    setIsRunning(true);
    setCurrentAction("Iniciando sincronización de mociones parlamentarias...");

    try {
      const formData = new FormData();
      formData.append("mode", mode);
      formData.append("chamber", chamber);
      formData.append("chamber_code", chamber === "SENADO" ? "S" : "D");
      formData.append("period", period);
      formData.append("per_par_id", period.split("-")[0] || "2026");
      if (limit && parseInt(limit) > 0) {
        formData.append("limit", limit);
      }
      if (mode === "upload" && file) {
        formData.append("file", file);
      }

      const response = await fetch("/api/admin/motions/sync", {
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
            // Ignorar fragmentos parciales
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
    <Credenza
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
      <CredenzaTrigger asChild>
        <Button className="gap-2 font-medium shadow-sm">
          <RefreshCw className="h-4 w-4" />
          Sincronizar Mociones
        </Button>
      </CredenzaTrigger>

      <CredenzaContent className="max-w-2xl">
        <CredenzaHeader>
          <CredenzaTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sincronización de Mociones del Orden del Día
          </CredenzaTitle>
          <CredenzaDescription>
            Extrae, clasifica y vincula mociones parlamentarias del Congreso
            oficial con los legisladores correspondientes.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="space-y-4">
          {!isRunning && !isCompleted ? (
            <div className="space-y-4">
              {/* Selección de modo */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("auto")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                    mode === "auto"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border hover:bg-muted/50 text-muted-foreground",
                  )}
                >
                  <Globe className="h-5 w-5 mb-1 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Modo Automático
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Descarga oficial del portal
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("upload")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                    mode === "upload"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border hover:bg-muted/50 text-muted-foreground",
                  )}
                >
                  <Upload className="h-5 w-5 mb-1 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Cargar Archivo
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Excel (.xlsx) o CSV manual
                  </span>
                </button>
              </div>

              {/* Parámetros: Cámara y Periodo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cámara Parlamentaria</Label>
                  <Select
                    value={chamber}
                    onValueChange={(val: "DIPUTADOS" | "SENADO") =>
                      setChamber(val)
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Seleccionar cámara" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIPUTADOS">
                        Cámara de Diputados (CD)
                      </SelectItem>
                      <SelectItem value="SENADO">
                        Senado de la República (CS)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Periodo Parlamentario</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Seleccionar periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePeriods.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Zona de subida si mode == upload */}
              {mode === "upload" && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) validateAndSetFile(dropped);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) validateAndSetFile(f);
                    }}
                  />
                  {file ? (
                    <div className="flex items-center justify-between p-2 bg-background rounded-lg border">
                      <div className="flex items-center gap-2 truncate">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs font-medium truncate">
                          {file.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-xs font-semibold text-foreground">
                        Arrastra tu archivo Excel (.xlsx) o haz clic para
                        seleccionarlo
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Reporte oficial descargado del portal de mociones
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Límite para pruebas */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Límite de registros (opcional para pruebas)
                </Label>
                <Input
                  type="number"
                  placeholder="Ej: 10 (dejar vacío para procesar todo)"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {currentAction}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Tarjeta de Diff Stats */}
              {diffStats && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-lg border text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold">
                      Nuevas
                    </p>
                    <p className="text-emerald-600 font-bold text-base">
                      {diffStats.nuevos}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold">
                      Cambio Estado
                    </p>
                    <p className="text-amber-600 font-bold text-base">
                      {diffStats.cambio_estado}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold">
                      Sin Cambios
                    </p>
                    <p className="text-muted-foreground font-bold text-base">
                      {diffStats.sin_cambios}
                    </p>
                  </div>
                </div>
              )}

              {/* Terminal de Logs */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Terminal className="h-3.5 w-3.5" />
                  Registro de Ejecución
                </div>
                <div
                  ref={logContainerRef}
                  className="bg-zinc-950 text-zinc-100 font-mono text-[11px] p-3 rounded-lg h-44 overflow-y-auto space-y-1 select-text"
                >
                  {logs.map((log, i) => (
                    <div key={i} className="leading-relaxed opacity-90">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CredenzaBody>

        <CredenzaFooter className="flex justify-end gap-2">
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
              Finalizar y Ver Cambios
            </Button>
          ) : (
            <Button disabled className="gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sincronizando...
            </Button>
          )}
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
