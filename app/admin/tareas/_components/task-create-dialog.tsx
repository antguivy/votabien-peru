"use client";

import React, { useState, useTransition } from "react";
import {
  KanbanColumn,
  TeamMember,
  PriorityLevel,
  SharedResource,
} from "../_lib/types";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza";
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
import {
  Plus,
  Users,
  FolderArchive,
  FileText,
  Figma,
  Video,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDatePicker } from "./task-date-picker";

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
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [firstResourceUrl, setFirstResourceUrl] = useState("");
  const [firstResourceTitle, setFirstResourceTitle] = useState("");
  const [firstResourceType, setFirstResourceType] =
    useState<SharedResource["type"]>("drive");

  const targetColumnId = defaultColumnId || columnId || columns[0]?.id || "";

  const handleResourceUrlChange = (url: string) => {
    setFirstResourceUrl(url);
    const lower = url.toLowerCase();
    if (lower.includes("drive.google.com")) {
      setFirstResourceType("drive");
    } else if (
      lower.includes("docs.google.com") ||
      lower.includes("sheets.google.com")
    ) {
      setFirstResourceType("doc");
    } else if (lower.includes("figma.com") || lower.includes("canva.com")) {
      setFirstResourceType("figma");
    } else if (lower.includes("meet.google.com") || lower.includes("zoom.us")) {
      setFirstResourceType("meet");
    }
  };

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
        type: firstResourceType,
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

        toast.success("Tarea registrada exitosamente");
        setTitle("");
        setDescription("");
        setDueDate(null);
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
    <Credenza open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CredenzaContent
        noScroll
        className="sm:max-w-xl p-0 overflow-hidden flex flex-col h-[88dvh] max-h-[88dvh] sm:h-auto rounded-2xl border bg-background shadow-2xl"
      >
        <CredenzaHeader className="px-6 py-4 border-b bg-muted/30 shrink-0">
          <CredenzaTitle className="text-base sm:text-lg font-bold">
            Nueva Tarea
          </CredenzaTitle>
        </CredenzaHeader>

        <CredenzaBody className="overflow-y-auto px-6 py-4 flex-1">
          <form
            id="create-task-form"
            onSubmit={handleSubmit}
            className="space-y-4 py-1"
          >
            {/* Nombre de la tarea */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Nombre de la tarea o tema{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Ej. Lima Metropolitana, Guion TikTok #4 o Filtro de postulantes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm font-medium h-9 rounded-lg"
                required
              />
            </div>

            {/* Fase y Prioridad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Fase / Columna
                </label>
                <Select value={targetColumnId} onValueChange={setColumnId}>
                  <SelectTrigger className="h-9 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem
                        key={col.id}
                        value={col.id}
                        className="text-xs"
                      >
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
                  <SelectTrigger className="h-9 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAJA" className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        <span>Baja</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIA" className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Media</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ALTA" className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Alta</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="URGENTE" className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        <span>Urgente</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Descripción & Alcance
              </label>
              <Textarea
                placeholder="Detalla pautas, instrucciones, preguntas guía o entregables esperados..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs min-h-[70px] resize-none rounded-lg"
              />
            </div>

            {/* Asignación de múltiples voluntarios */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Asignar Voluntarios
                </span>
                <span className="text-[11px] font-bold text-foreground">
                  ({assignedUserIds.length})
                </span>
              </label>
              <div className="max-h-36 overflow-y-auto border rounded-xl p-1.5 space-y-1 bg-secondary/20">
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
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage src={member.image || ""} />
                          <AvatarFallback className="text-[8px]">
                            {member.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{member.name}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-1.5">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recurso inicial opcional */}
            <div className="p-3 rounded-xl border bg-secondary/20 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-primary" />
                Enlace de Trabajo (Opcional)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-4">
                  <Select
                    value={firstResourceType}
                    onValueChange={(val: SharedResource["type"]) =>
                      setFirstResourceType(val)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drive">
                        <div className="flex items-center gap-1.5">
                          <FolderArchive className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Google Drive</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="doc">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                          <span>Google Docs</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="figma">
                        <div className="flex items-center gap-1.5">
                          <Figma className="h-3.5 w-3.5 text-purple-500" />
                          <span>Figma / Canva</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="meet">
                        <div className="flex items-center gap-1.5">
                          <Video className="h-3.5 w-3.5 text-rose-500" />
                          <span>Google Meet</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="link">
                        <div className="flex items-center gap-1.5">
                          <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Otro enlace</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-8">
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={firstResourceUrl}
                    onChange={(e) => handleResourceUrlChange(e.target.value)}
                    className="h-8 text-xs rounded-md"
                  />
                </div>
              </div>

              {firstResourceUrl.trim() && (
                <Input
                  placeholder="Etiqueta del enlace (ej. Carpeta de Insumos)"
                  value={firstResourceTitle}
                  onChange={(e) => setFirstResourceTitle(e.target.value)}
                  className="h-8 text-xs rounded-md"
                />
              )}
            </div>

            {/* Fecha Límite con TaskDatePicker */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Fecha Límite
              </label>
              <TaskDatePicker
                date={dueDate}
                onSelect={(d) => setDueDate(d)}
                placeholder="Sin fecha límite asignada"
              />
            </div>
          </form>
        </CredenzaBody>

        <CredenzaFooter className="px-6 py-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto text-xs cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-task-form"
            disabled={isPending}
            className="w-full sm:w-auto text-xs gap-1.5 cursor-pointer font-semibold"
          >
            <Plus className="h-4 w-4" />
            {isPending ? "Creando..." : "Crear Tarea"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
