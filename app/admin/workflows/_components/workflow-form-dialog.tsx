"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createWorkflow, updateWorkflow } from "../_lib/actions";
import { extractErrorMessage } from "@/lib/error-handler";
import type { AIWorkflow } from "@/interfaces/workflow";

const workflowSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string(),
  sources: z.array(z.string()),
  compressor_prompt: z.string(),
  compressor_model: z.string().min(1),
  validator_prompt: z.string(),
  validator_model: z.string().min(1),
  status: z.string(),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

const AVAILABLE_TOOLS = [
  { id: "search_web", label: "Búsqueda Web (Noticias/DDG)" },
  { id: "search_youtube", label: "Búsqueda en YouTube (Posturas)" },
  { id: "search_jne", label: "Consulta JNE (Voto Informado)" },
  { id: "analyze_pdf", label: "Análisis de Sentencias (PDF)" },
  { id: "db_query", label: "Consulta a Base de Datos (Prisma)" },
];

const COMPRESSOR_MODELS = [
  {
    value: "gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash Lite (500 RPD - Recomendado)",
    group: "Google AI Studio",
  },
  {
    value: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite (500 RPD)",
    group: "Google AI Studio",
  },
  {
    value: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash (1M Context - Ultra Económico)",
    group: "DeepSeek API",
  },
];

const VALIDATOR_MODELS = [
  {
    value: "gemini-3.6-flash",
    label: "Gemini 3.6 Flash (20 RPD - Recomendado)",
    group: "Google AI Studio",
  },
  {
    value: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash (20 RPD)",
    group: "Google AI Studio",
  },
  {
    value: "gemini-3-flash",
    label: "Gemini 3.0 Flash (20 RPD)",
    group: "Google AI Studio",
  },
  {
    value: "gemini-3.7-flash",
    label: "Gemini 3.7 Flash (20 RPD)",
    group: "Google AI Studio",
  },
  {
    value: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash (1M Context - Thinking Mode)",
    group: "DeepSeek API",
  },
];

interface WorkflowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow?: AIWorkflow | null; // Pasa el objeto si es edición, null para crear
}

export function WorkflowFormDialog({
  open,
  onOpenChange,
  workflow,
}: WorkflowFormDialogProps) {
  const isEditing = !!workflow;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: "",
      description: "",
      sources: ["search_web"],
      compressor_prompt: "",
      compressor_model: "gemini-3.5-flash-lite",
      validator_prompt: "",
      validator_model: "gemini-3.6-flash",
      status: "ACTIVE",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (workflow) {
        reset({
          name: workflow.name,
          description: workflow.description || "",
          sources: workflow.sources || ["search_web"],
          compressor_prompt: workflow.compressor_prompt || "",
          compressor_model:
            workflow.compressor_model || "gemini-3.5-flash-lite",
          validator_prompt: workflow.validator_prompt || "",
          validator_model: workflow.validator_model || "gemini-3.6-flash",
          status: workflow.status,
        });
      } else {
        reset({
          name: "",
          description: "",
          sources: ["search_web"],
          compressor_prompt: "",
          compressor_model: "gemini-3.5-flash-lite",
          validator_prompt: "",
          validator_model: "gemini-3.6-flash",
          status: "ACTIVE",
        });
      }
    }
  }, [open, workflow, reset]);

  const onSubmit = async (data: WorkflowFormValues) => {
    try {
      if (isEditing) {
        const res = await updateWorkflow(workflow.id, data);
        if (res.success) {
          toast.success("Workflow actualizado");
          onOpenChange(false);
        } else throw new Error(res.error);
      } else {
        const res = await createWorkflow(data);
        if (res.success) {
          toast.success("Workflow creado");
          onOpenChange(false);
        } else throw new Error(res.error);
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Workflow AI" : "Nuevo Workflow AI"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del Workflow</Label>
              <Input
                {...register("name")}
                placeholder="Ej. Investigador Principal"
              />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción (Opcional)</Label>
            <Input
              {...register("description")}
              placeholder="Propósito de este workflow..."
            />
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-bold">
              Fase 1: Descubrimiento (Fuentes)
            </Label>
            <Controller
              name="sources"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 border p-4 rounded-md bg-slate-50">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <div key={tool.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${tool.id}`}
                        checked={field.value.includes(tool.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, tool.id]);
                          } else {
                            field.onChange(
                              field.value.filter((v) => v !== tool.id),
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`source-${tool.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {tool.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <Label className="text-lg font-bold">
              Fase 2: Compresión (Focus Prompt)
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <div className="flex justify-between items-baseline">
                  <Label>Prompt del Compresor (Opcional)</Label>
                  <span className="text-[10px] text-muted-foreground">
                    Opcional para acotar
                  </span>
                </div>
                <Textarea
                  {...register("compressor_prompt")}
                  rows={4}
                  placeholder="Instrucciones adicionales para filtrar noticias (ej. enfocar en lavado de activos). Déjalo vacío para análisis estándar."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo Compresor</Label>
                <Controller
                  name="compressor_model"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Seleccionar modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPRESSOR_MODELS.map((m) => (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            className="text-xs"
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <Label className="text-lg font-bold">
              Fase 3: Validación (Reglas RAG)
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <div className="flex justify-between items-baseline">
                  <Label>Prompt del Validador (Opcional)</Label>
                  <span className="text-[10px] text-muted-foreground">
                    Opcional para reglas extra
                  </span>
                </div>
                <Textarea
                  {...register("validator_prompt")}
                  rows={4}
                  placeholder="Reglas adicionales para extracción legal. Déjalo vacío para usar las reglas periodísticas estándar."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo Validador</Label>
                <Controller
                  name="validator_model"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Seleccionar modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {VALIDATOR_MODELS.map((m) => (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            className="text-xs"
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Workflow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
