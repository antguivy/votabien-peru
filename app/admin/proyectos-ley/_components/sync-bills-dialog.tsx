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
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  UploadCloud,
  X,
  Globe,
  Upload,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SyncBillsDialogProps {
  availablePeriods?: string[];
}

interface DiffStats {
  total_en_reporte: number;
  nuevos: number;
  cambio_estado: number;
  pendientes_ia: number;
  metadatos_faltantes?: number;
  sin_cambios: number;
  total_a_procesar: number;
}

export function SyncBillsDialog({
  availablePeriods = ["2026-2031", "2021-2026"],
}: SyncBillsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [period, setPeriod] = React.useState("2026-2031");
  const [mode, setMode] = React.useState<"auto" | "upload">("upload");
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

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
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
    setCurrentAction(
      "Iniciando conexión con el servicio de scraping y análisis...",
    );

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
          Sincronizar
        </Button>
      </CredenzaTrigger>

      <CredenzaContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        {/* Header Fijo Estático */}
        <CredenzaHeader className="p-5 sm:p-6 pb-4 border-b border-border/70 bg-card/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase">
              <Cpu className="h-3.5 w-3.5" />
              DeepSeek Flash + SPLey Scraper
            </span>
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Congreso del Perú
            </span>
          </div>
          <CredenzaTitle className="text-xl font-bold tracking-tight text-foreground">
            Sincronización de Proyectos de Ley
          </CredenzaTitle>
          <CredenzaDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
            Detecta proyectos nuevos, actualiza cambios de estado, completa
            metadatos faltantes (bancada, legislatura, comisiones) y genera
            títulos ciudadanos con IA.
          </CredenzaDescription>
        </CredenzaHeader>

        {/* Body Scrollable */}
        <CredenzaBody className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {!isRunning && !isCompleted && (
            <div className="space-y-5">
              {/* Selección de Periodo y Límite */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">
                    Periodo Parlamentario
                  </Label>
                  <Select value={period} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="text-sm h-9 bg-background">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePeriods.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}{" "}
                          {p === "2026-2031"
                            ? "(Bicameral 2026-2031)"
                            : "(Unicameral)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">
                    Límite de prueba (Opcional)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ej: 10 (vacío para todos)"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="text-sm h-9 bg-background"
                  />
                </div>
              </div>

              {period === "2026-2031" && (
                <div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
                  <span className="text-base leading-none mt-0.5">🏛️</span>
                  <div className="space-y-0.5 leading-relaxed">
                    <p className="font-semibold text-foreground">
                      Modo Bicameral Activo (Cámara de Diputados y Senado)
                    </p>
                    <p>
                      Mapea automáticamente proposiciones de{" "}
                      <strong>Diputados (-CD)</strong> y del{" "}
                      <strong>Senado (-S)</strong>. Extrae bancadas, legislatura
                      y comisiones oficiales desde SPLey.
                    </p>
                  </div>
                </div>
              )}

              {/* Selector de Modo de Ingestión */}
              <div className="space-y-2.5 pt-1">
                <Label className="text-xs font-semibold text-foreground/90">
                  Método de Ingestión del Reporte
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opción Manual (Recomendada) */}
                  <div
                    onClick={() => setMode("upload")}
                    className={cn(
                      "flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all text-left",
                      mode === "upload"
                        ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/20"
                        : "border-border bg-card/60 hover:bg-muted/40 hover:border-border/80",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                        <Upload className="h-4 w-4 text-primary" />
                        Subir Reporte Excel
                      </span>
                      {mode === "upload" && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sube el archivo <code>.xlsx</code> descargado de SPLey.
                      Proceso rápido, sin depender de la navegación inicial.
                    </p>
                  </div>

                  {/* Opción Automática */}
                  <div
                    onClick={() => setMode("auto")}
                    className={cn(
                      "flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all text-left",
                      mode === "auto"
                        ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/20"
                        : "border-border bg-card/60 hover:bg-muted/40 hover:border-border/80",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                        <Globe className="h-4 w-4 text-primary" />
                        Descarga Automática
                      </span>
                      {mode === "auto" && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Playwright navega a la web de SPLey y descarga el reporte
                      en tiempo real.
                    </p>
                  </div>
                </div>
              </div>

              {/* Zona Drag & Drop para Excel */}
              {mode === "upload" && (
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-semibold text-foreground/90">
                    Archivo de Proyectos de Ley (.xlsx, .xls, .csv)
                  </Label>

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

                  {!file ? (
                    <div
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "group border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200",
                        isDragging
                          ? "border-primary bg-primary/5 scale-[0.99]"
                          : "border-border/80 hover:border-primary/50 hover:bg-primary/[0.02]",
                      )}
                    >
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-primary/10 transition-transform">
                        <UploadCloud className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        Arrastra el reporte Excel aquí o{" "}
                        <span className="text-primary underline underline-offset-4">
                          explora tus archivos
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Archivos compatibles:{" "}
                        <code>reporte-proyecto-ley-*.xlsx</code> o{" "}
                        <code>.csv</code>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Listo para
                              procesar
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs h-8 text-muted-foreground hover:text-foreground"
                        >
                          Cambiar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Estado de Ejecución o Finalizado */}
          {(isRunning || isCompleted || logs.length > 0) && (
            <div className="space-y-4">
              {/* Barra de progreso y estado activo */}
              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    {isRunning ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : null}
                    <span className="truncate text-foreground">
                      {currentAction || "Sincronizando..."}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2 rounded-full" />
              </div>

              {/* Bento Cards con el Diffing */}
              {diffStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/70">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Total Reporte
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {diffStats.total_en_reporte}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Nuevos
                    </p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      +{diffStats.nuevos}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/20">
                    <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Actualizados
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {(diffStats.cambio_estado || 0) +
                        (diffStats.metadatos_faltantes || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/70">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Sin Cambios
                    </p>
                    <p className="text-lg font-bold text-muted-foreground mt-0.5">
                      {diffStats.sin_cambios}
                    </p>
                  </div>
                </div>
              )}

              {/* Consola Terminal Dark en Tiempo Real */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground/80">
                      Registro de Eventos y LLM en Tiempo Real
                    </span>
                  </div>
                  <span className="font-mono text-[11px]">
                    {logs.length} líneas
                  </span>
                </div>
                <div
                  ref={logContainerRef}
                  className="bg-zinc-950 text-zinc-300 font-mono text-[11px] p-3.5 rounded-xl h-48 overflow-y-auto space-y-1 border border-zinc-800/90 shadow-inner"
                >
                  {logs.length === 0 ? (
                    <div className="text-zinc-500 italic">
                      Esperando inicio del stream...
                    </div>
                  ) : (
                    logs.map((msg, i) => (
                      <div
                        key={i}
                        className="leading-relaxed whitespace-pre-wrap flex items-start gap-2"
                      >
                        <span className="text-zinc-600 select-none">
                          {String(i + 1).padStart(3, "0")}
                        </span>
                        <span
                          className={cn(
                            msg.includes("❌")
                              ? "text-rose-400"
                              : msg.includes("🎉") || msg.includes("✅")
                                ? "text-emerald-400 font-medium"
                                : msg.includes("💾")
                                  ? "text-cyan-400"
                                  : msg.includes("Procesando")
                                    ? "text-amber-300"
                                    : "text-zinc-300",
                          )}
                        >
                          {msg}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CredenzaBody>

        {/* Footer Fijo Estático */}
        <CredenzaFooter className="p-4 sm:p-5 border-t border-border/70 bg-card/60 backdrop-blur-sm shrink-0 flex items-center justify-between">
          {!isRunning && !isCompleted ? (
            <div className="flex items-center justify-between w-full gap-2">
              <p className="text-xs text-muted-foreground hidden sm:block">
                Los proyectos existentes completarán metadatos sin regenerar IA.
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={startSync}
                  size="sm"
                  disabled={mode === "upload" && !file}
                  className="gap-2 font-medium shadow"
                >
                  <RefreshCw className="h-4 w-4" />
                  Iniciar Sincronización
                </Button>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Sincronización finalizada con éxito
              </span>
              <Button onClick={handleFinish} size="sm" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Finalizar y Actualizar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                Procesando reporte en vivo...
              </span>
              <Button
                disabled
                variant="outline"
                size="sm"
                className="gap-2 font-mono text-xs"
              >
                {progress}% completado
              </Button>
            </div>
          )}
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
