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
      sources: [],
      compressor_prompt: "",
      compressor_model: "gemini-2.5-flash",
      validator_prompt: "",
      validator_model: "gemini-2.5-flash",
      status: "ACTIVE",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (workflow) {
        reset({
          name: workflow.name,
          description: workflow.description || "",
          sources: workflow.sources || [],
          compressor_prompt: workflow.compressor_prompt || "",
          compressor_model: workflow.compressor_model || "gemini-2.5-flash",
          validator_prompt: workflow.validator_prompt || "",
          validator_model: workflow.validator_model || "gemini-2.5-flash",
          status: workflow.status,
        });
      } else {
        reset({
          name: "",
          description: "",
          sources: [],
          compressor_prompt: "",
          compressor_model: "gemini-2.5-flash",
          validator_prompt: "",
          validator_model: "gemini-2.5-flash",
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
                <Label>Prompt del Compresor</Label>
                <Textarea
                  {...register("compressor_prompt")}
                  rows={5}
                  placeholder="Extrae solo información sobre lavado de activos..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo Compresor</Label>
                <Input
                  {...register("compressor_model")}
                  placeholder="gemini-2.5-flash"
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
                <Label>Prompt del Validador</Label>
                <Textarea
                  {...register("validator_prompt")}
                  rows={5}
                  placeholder="Valida que la postura cumpla con las reglas establescidas..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo Validador</Label>
                <Input
                  {...register("validator_model")}
                  placeholder="gemini-2.5-flash"
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
