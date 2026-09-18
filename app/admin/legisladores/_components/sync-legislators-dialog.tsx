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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  RefreshCw,
  Terminal,
  Building2,
  CheckCircle2,
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DiffStats {
  total_official: number;
  total_db: number;
  matched: number;
  new_groups_count: number;
  group_changes_count: number;
  condition_changes_count: number;
  metadata_updates_count: number;
  unmatched_official_count: number;
  unmatched_db_count: number;
}

interface GroupChange {
  legislator_id: string;
  person_name: string;
  chamber: string;
  previous_group_name: string;
  new_group_name: string;
  is_defector: boolean;
}

interface ConditionChange {
  legislator_id: string;
  person_name: string;
  chamber: string;
  old_condition: string;
  new_condition: string;
}

interface NewGroup {
  name: string;
  color_hex: string;
}

export function SyncLegislatorsDialog() {
  const [open, setOpen] = React.useState(false);
  const [autoApply, setAutoApply] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [appliedDirectly, setAppliedDirectly] = React.useState(false);
  const [currentAction, setCurrentAction] = React.useState("");
  const [diffStats, setDiffStats] = React.useState<DiffStats | null>(null);
  const [newGroups, setNewGroups] = React.useState<NewGroup[]>([]);
  const [groupChanges, setGroupChanges] = React.useState<GroupChange[]>([]);
  const [conditionChanges, setConditionChanges] = React.useState<
    ConditionChange[]
  >([]);
  const [metadataUpdates, setMetadataUpdates] = React.useState<unknown[]>([]);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [isCompleted, setIsCompleted] = React.useState(false);

  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const resetState = () => {
    setIsRunning(false);
    setIsApplying(false);
    setAppliedDirectly(false);
    setCurrentAction("");
    setDiffStats(null);
    setNewGroups([]);
    setGroupChanges([]);
    setConditionChanges([]);
    setMetadataUpdates([]);
    setLogs([]);
    setIsCompleted(false);
  };

  const startSync = async () => {
    resetState();
    setIsRunning(true);
    setCurrentAction("Conectando con el servicio oficial de auditoría...");

    try {
      const response = await fetch("/api/admin/legislators/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auto_apply: autoApply,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Error en el servicio de sincronización.",
        );
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
            } else if (event.type === "official_fetched") {
              setLogs((prev) => [...prev, event.message]);
            } else if (event.type === "diff_summary") {
              setDiffStats(event.stats);
              setLogs((prev) => [...prev, event.message]);
            } else if (event.type === "diff_details") {
              setNewGroups(event.new_parliamentary_groups || []);
              setGroupChanges(event.group_changes || []);
              setConditionChanges(event.condition_changes || []);
              setMetadataUpdates(event.metadata_updates || []);
            } else if (event.type === "applied") {
              setLogs((prev) => [...prev, event.message]);
              setAppliedDirectly(true);
            } else if (event.type === "final") {
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

  const applyDetectedChanges = async () => {
    setIsApplying(true);
    setCurrentAction("Aplicando cambios en la base de datos...");
    try {
      const response = await fetch("/api/admin/legislators/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_parliamentary_groups: newGroups,
          group_changes: groupChanges,
          condition_changes: conditionChanges,
          metadata_updates: metadataUpdates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al aplicar cambios.");
      }

      const res = await response.json();
      setAppliedDirectly(true);
      toast.success("Cambios aplicados exitosamente en la base de datos.");
      setLogs((prev) => [
        ...prev,
        `✅ Transacción completada: ${res.results?.created_groups || 0} bancadas creadas, ` +
          `${res.results?.applied_group_changes || 0} cambios de membresía, ` +
          `${res.results?.applied_condition_changes || 0} cambios de condición.`,
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error aplicando cambios";
      toast.error(msg);
      setLogs((prev) => [...prev, `❌ Error: ${msg}`]);
    } finally {
      setIsApplying(false);
    }
  };

  const handleFinish = () => {
    setOpen(false);
    resetState();
    router.refresh();
  };

  const totalChanges =
    (diffStats?.new_groups_count || 0) +
    (diffStats?.group_changes_count || 0) +
    (diffStats?.condition_changes_count || 0);

  const hasChanges = totalChanges > 0;

  return (
    <Credenza
      open={open}
      onOpenChange={(v) => {
        if (isRunning || isApplying) {
          toast.warning("La operación sigue en ejecución.");
          return;
        }
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <CredenzaTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 font-medium shadow-sm border-dashed"
        >
          <RefreshCw className="h-4 w-4 text-primary" />
          Sincronizar Oficial
        </Button>
      </CredenzaTrigger>

      <CredenzaContent className="max-w-2xl">
        <CredenzaHeader>
          <CredenzaTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Auditoría Oficial de Legisladores y Bancadas
          </CredenzaTitle>
          <CredenzaDescription>
            Compara en tiempo real la nómina de la Cámara de Diputados y el
            Senado para detectar cambios de bancada (transfuguismo), nuevas
            bancadas y actualización de estado.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="space-y-4">
          {!isRunning && !isCompleted ? (
            <div className="space-y-4">
              {/* Card informativa */}
              <div className="rounded-xl border bg-muted/40 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Info className="h-4 w-4 text-primary" />
                  Fuentes oficiales conectadas
                </div>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>
                    <strong>Cámara de Diputados:</strong> 130 congresistas
                    (diputados.congreso.gob.pe)
                  </li>
                  <li>
                    <strong>Senado de la República:</strong> 60 congresistas
                    (senado.congreso.gob.pe)
                  </li>
                </ul>
              </div>

              {/* Selector de modo: Auto-aplicar o solo previsualizar */}
              <div className="flex items-center justify-between p-3.5 border rounded-xl bg-card">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {autoApply ? (
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-primary" />
                    )}
                    {autoApply
                      ? "Modo Aplicar Directo (Mutación)"
                      : "Modo Auditoría (Solo Lectura / Reporte)"}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {autoApply
                      ? "Aplica automáticamente en la BD todas las bancadas nuevas y cambios detectados."
                      : "Genera el reporte comparativo en pantalla sin alterar la base de datos."}
                  </p>
                </div>
                <Switch checked={autoApply} onCheckedChange={setAutoApply} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Encabezado del estado de la ejecución */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  {(isRunning || isApplying) && (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                  )}
                  {currentAction}
                </span>
                {isCompleted && (
                  <Badge
                    variant="outline"
                    className={
                      appliedDirectly
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }
                  >
                    {appliedDirectly
                      ? "Mutaciones Aplicadas"
                      : "Reporte Solo Lectura"}
                  </Badge>
                )}
              </div>

              {/* Tarjetas de Estadísticas */}
              {diffStats && (
                <div className="grid grid-cols-4 gap-2 p-3 bg-muted/40 rounded-lg border text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold">
                      Auditados
                    </p>
                    <p className="text-foreground font-bold text-base">
                      {diffStats.matched}/{diffStats.total_official}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold">
                      Nuevas Bancadas
                    </p>
                    <p className="text-emerald-600 font-bold text-base">
                      {diffStats.new_groups_count}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold">
                      Transfuguismo
                    </p>
                    <p className="text-amber-600 font-bold text-base">
                      {diffStats.group_changes_count}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold">
                      Condición
                    </p>
                    <p className="text-purple-600 font-bold text-base">
                      {diffStats.condition_changes_count}
                    </p>
                  </div>
                </div>
              )}

              {/* Banner si no hubo discrepancias */}
              {isCompleted && !hasChanges && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">
                      Base de datos sincronizada:
                    </span>{" "}
                    No se detectaron cambios de bancada ni discrepancias con las
                    nóminas oficiales del Congreso.
                  </div>
                </div>
              )}

              {/* Lista de cambios detectados si los hay */}
              {hasChanges && (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {/* Nuevas Bancadas */}
                  {newGroups.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Nuevas Bancadas Detectadas ({newGroups.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {newGroups.map((g, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs gap-1.5 py-0.5"
                            style={{ borderColor: g.color_hex }}
                          >
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: g.color_hex }}
                            />
                            {g.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cambios de Bancada (Transfuguismo) */}
                  {groupChanges.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Cambios de Bancada Detectados ({groupChanges.length})
                      </p>
                      <div className="space-y-1">
                        {groupChanges.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-md border bg-card text-xs gap-2"
                          >
                            <span
                              className="font-semibold text-foreground truncate max-w-[200px]"
                              title={c.person_name}
                            >
                              {c.person_name}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                              >
                                {c.previous_group_name}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 font-semibold">
                                {c.new_group_name}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cambios de Condición */}
                  {conditionChanges.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Cambios de Condición ({conditionChanges.length})
                      </p>
                      <div className="space-y-1">
                        {conditionChanges.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-md border bg-card text-xs gap-2"
                          >
                            <span className="font-semibold text-foreground truncate max-w-[200px]">
                              {c.person_name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">
                                {c.old_condition}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                              >
                                {c.new_condition}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                  className="bg-zinc-950 text-zinc-100 font-mono text-[11px] p-3 rounded-lg h-32 overflow-y-auto space-y-1 select-text"
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

        <CredenzaFooter className="flex justify-end gap-2 flex-wrap">
          {!isRunning && !isCompleted ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={startSync} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {autoApply ? "Auditar y Aplicar" : "Ejecutar Auditoría"}
              </Button>
            </>
          ) : isCompleted ? (
            <>
              {/* Si se corrió en solo lectura y hay cambios que aún no se aplicaron */}
              {!appliedDirectly && hasChanges && (
                <Button
                  onClick={applyDetectedChanges}
                  disabled={isApplying}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isApplying ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Aplicar Cambios Detectados ({totalChanges})
                </Button>
              )}
              <Button
                onClick={handleFinish}
                variant={!appliedDirectly && hasChanges ? "outline" : "default"}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {appliedDirectly ? "Finalizar y Ver Cambios" : "Cerrar Reporte"}
              </Button>
            </>
          ) : (
            <Button disabled className="gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {isApplying ? "Aplicando en BD..." : "Auditando..."}
            </Button>
          )}
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
