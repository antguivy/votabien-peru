"use client";

import React, { useState, useTransition } from "react";
import {
  KanbanColumn,
  TeamMember,
  PriorityLevel,
  SharedResource,
} from "../_lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createTask } from "../_lib/actions";
import { toast } from "sonner";
import { Calendar, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCreateDialogProps {
  boardId: string;
  columns: KanbanColumn[];
  defaultColumnId?: string;
  teamMembers: TeamMember[];
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

export function TaskCreateDialog({
  boardId,
  columns,
  defaultColumnId,
  teamMembers,
  isOpen,
  onClose,
  onTaskCreated,
}: TaskCreateDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(
    defaultColumnId || columns[0]?.id || "",
  );
  const [priority, setPriority] = useState<PriorityLevel>("MEDIA");
  const [dueDate, setDueDate] = useState("");
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [firstResourceUrl, setFirstResourceUrl] = useState("");
  const [firstResourceTitle, setFirstResourceTitle] = useState("");

  const targetColumnId = defaultColumnId || columnId || columns[0]?.id || "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Ingresa el título del paquete de trabajo o tarea");
      return;
    }

    if (!targetColumnId) {
      toast.error("Selecciona una columna");
      return;
    }

    const resources: SharedResource[] = [];
    if (firstResourceUrl.trim()) {
      resources.push({
        id: `res-${Date.now()}`,
        title: firstResourceTitle.trim() || "Enlace de trabajo",
        url: firstResourceUrl.trim(),
        type: firstResourceUrl.includes("drive.google.com")
          ? "drive"
          : firstResourceUrl.includes("docs.google.com")
            ? "doc"
            : firstResourceUrl.includes("figma.com")
              ? "figma"
              : firstResourceUrl.includes("meet.google.com")
                ? "meet"
                : "link",
      });
    }

    startTransition(async () => {
      try {
        await createTask({
          boardId,
          columnId: targetColumnId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || null,
          assignedUserIds,
          resources,
        });

        toast.success("Paquete de trabajo registrado exitosamente");
        setTitle("");
        setDescription("");
        setDueDate("");
        setAssignedUserIds([]);
        setFirstResourceUrl("");
        setFirstResourceTitle("");
        onClose();
        onTaskCreated?.();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al crear la tarea";
        toast.error(msg);
      }
    });
  };

  const toggleMember = (memberId: string) => {
    if (assignedUserIds.includes(memberId)) {
      setAssignedUserIds(assignedUserIds.filter((id) => id !== memberId));
    } else {
      setAssignedUserIds([...assignedUserIds, memberId]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Nueva Tarea</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Nombre de la tarea o tema <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Ej. Lima Metropolitana, Junín, Guion TikTok #4 o Filtro de postulantes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Fase / Columna
              </label>
              <Select value={targetColumnId} onValueChange={setColumnId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Prioridad
              </label>
              <Select
                value={priority}
                onValueChange={(val: PriorityLevel) => setPriority(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Descripción & Alcance
            </label>
            <Textarea
              placeholder="Detalla pautas, instrucciones, preguntas guía o enlaces generales..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
            />
          </div>

          {/* Asignación de múltiples voluntarios */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <Users className="h-3.5 w-3.5" /> Asignar Voluntarios (
              {assignedUserIds.length})
            </label>
            <div className="max-h-36 overflow-y-auto border rounded-xl p-2 space-y-1 bg-secondary/20">
              {teamMembers.map((member) => {
                const isSelected = assignedUserIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      "flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={member.image || ""} />
                        <AvatarFallback className="text-[8px]">
                          {member.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recurso inicial (Drive, Meet, Docs opcional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Enlace de Trabajo (Drive, Figma, Meet)
              </label>
              <Input
                placeholder="https://drive.google.com/..."
                value={firstResourceUrl}
                onChange={(e) => setFirstResourceUrl(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Etiqueta del enlace
              </label>
              <Input
                placeholder="Ej. Carpeta de Investigación"
                value={firstResourceTitle}
                onChange={(e) => setFirstResourceTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Fecha Límite */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
              <Calendar className="h-3.5 w-3.5" /> Fecha Límite
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {isPending ? "Creando..." : "Crear Tarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
