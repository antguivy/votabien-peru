"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Cpu, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getActiveWorkflows } from "@/app/admin/workflows/_lib/actions";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";

interface InvestigacionFormProps {
  onSubmit: (nombre: string, workflowId: string) => void;
  disabled?: boolean;
  defaultName?: string;
}

export function InvestigacionForm({
  onSubmit,
  disabled,
  defaultName,
}: InvestigacionFormProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [nombreInvestigado, setNombreInvestigado] = useState(defaultName ?? "");
  const [workflowId, setWorkflowId] = useState("");
  const [workflows, setWorkflows] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        const res = await getActiveWorkflows();
        if (res.success && res.workflows) {
          setWorkflows(res.workflows);
          if (res.workflows.length > 0) {
            setWorkflowId(res.workflows[0].id);
          }
        }
      } catch {
        toast.error("Error cargando workflows");
      } finally {
        setIsLoadingWorkflows(false);
      }
    }
    fetchWorkflows();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!nombreInvestigado || !workflowId) return;

    onSubmit(nombreInvestigado, workflowId);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row border rounded-xl overflow-hidden border-border/60 bg-card shadow-xs">
        {/* Lado Izquierdo: Objetivo y Workflow */}
        <div className="flex-1 flex flex-col gap-4 p-5">
          <div className="space-y-3 flex-1 flex flex-col justify-start">
            <Label className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider">
              Nombres y Apellidos del Objetivo
            </Label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={nombreInvestigado}
                onChange={(e) => setNombreInvestigado(e.target.value)}
                disabled={disabled || !!defaultName}
                readOnly={!!defaultName}
                placeholder="Ej. Rafael López Aliaga"
                className="pl-10 h-11 text-base bg-muted/20"
              />
            </div>

            <div className="pt-2 space-y-2">
              <Label className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider mb-2 block">
                Elegir Workflow
              </Label>
              <Select
                value={workflowId}
                onValueChange={setWorkflowId}
                disabled={disabled || isLoadingWorkflows}
              >
                <SelectTrigger className="h-11">
                  <SelectValue
                    placeholder={
                      isLoadingWorkflows
                        ? "Cargando workflows..."
                        : "Selecciona un workflow"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((wf) => (
                    <SelectItem key={wf.id} value={wf.id}>
                      {wf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Configuración */}
        <div className="w-full md:w-[300px] bg-muted/30 border-t md:border-t-0 md:border-l border-border p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Ejecución</h3>
            </div>
            <div className="pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Estado</span>
                <Badge
                  variant={
                    nombreInvestigado && workflowId ? "default" : "outline"
                  }
                  className="h-5 text-[10px]"
                >
                  {nombreInvestigado && workflowId
                    ? "Listo para iniciar"
                    : "Faltan datos"}
                </Badge>
              </div>
            </div>

            {!isAdmin && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground text-xs">
                    Solo Administradores
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    La extracción y scraping en tiempo real se ejecuta en local
                    por el equipo técnico.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-border/50">
            <Button
              onClick={handleSubmit}
              disabled={
                !isAdmin ||
                disabled ||
                !nombreInvestigado ||
                !workflowId ||
                isLoadingWorkflows
              }
              className="w-full h-11 text-sm font-semibold shadow-md gap-2"
            >
              {!isAdmin ? (
                <>
                  <Lock className="h-4 w-4" />
                  Solo Administradores
                </>
              ) : disabled ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando
                </>
              ) : (
                "Iniciar Investigación"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
