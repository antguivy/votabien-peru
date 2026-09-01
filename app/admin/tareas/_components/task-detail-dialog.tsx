"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  KanbanTask,
  KanbanColumn,
  TeamMember,
  PriorityLevel,
  SharedResource,
  ChecklistItem,
  AssignmentStatus,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateTask,
  updateAssignmentStatus,
  addComment,
  deleteTask,
  moveTask,
} from "../_lib/actions";
import { toast } from "sonner";
import {
  AlignLeft,
  CheckCircle2,
  CheckSquare,
  Copy,
  ExternalLink,
  FileText,
  Figma,
  FolderArchive,
  Link as LinkIcon,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDatePicker } from "./task-date-picker";

interface TaskDetailDialogProps {
  task: KanbanTask | null;
  columns?: KanbanColumn[];
  teamMembers: TeamMember[];
  currentUserId?: string;
  userRole?: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

const PRIORITY_STYLES: Record<
  PriorityLevel,
  { label: string; badge: string; dot: string }
> = {
  BAJA: {
    label: "Baja",
    badge:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  MEDIA: {
    label: "Media",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900",
    dot: "bg-blue-500",
  },
  ALTA: {
    label: "Alta",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
    dot: "bg-amber-500",
  },
  URGENTE: {
    label: "Urgente",
    badge:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900",
    dot: "bg-rose-500",
  },
};

export function TaskDetailDialog({
  task,
  columns = [],
  teamMembers,
  currentUserId,
  userRole,
  isOpen,
  onClose,
  onTaskUpdated,
}: TaskDetailDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Estados de edición del formulario principal
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<PriorityLevel>(
    task?.priority || "MEDIA",
  );
  const [dueDate, setDueDate] = useState<string | null>(
    task?.due_date ? task.due_date.split("T")[0] : null,
  );
  const [columnId, setColumnId] = useState<string>(task?.column_id || "");
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(
    task?.assignments?.map((a) => a.user_id) || [],
  );

  // Estados de colecciones (recursos y checklist)
  const [resources, setResources] = useState<SharedResource[]>(
    task?.resources || [],
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task?.checklist || [],
  );

  // Estados locales para nuevas entradas
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceType, setNewResourceType] =
    useState<SharedResource["type"]>("drive");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [commentText, setCommentText] = useState("");

  // Cálculo de estado "sucio" (dirty) para el formulario principal
  const isDirty = useMemo(() => {
    if (!task) return false;
    const initialTitle = task.title || "";
    const initialDesc = task.description || "";
    const initialPriority = task.priority || "MEDIA";
    const initialDueDate = task.due_date ? task.due_date.split("T")[0] : "";
    const initialColId = task.column_id || "";
    const initialAssignees = (task.assignments?.map((a) => a.user_id) || [])
      .slice()
      .sort()
      .join(",");
    const currentAssignees = assignedUserIds.slice().sort().join(",");

    return (
      title.trim() !== initialTitle.trim() ||
      description.trim() !== initialDesc.trim() ||
      priority !== initialPriority ||
      (dueDate || "") !== initialDueDate ||
      (columnId && columnId !== initialColId) ||
      currentAssignees !== initialAssignees
    );
  }, [task, title, description, priority, dueDate, columnId, assignedUserIds]);

  if (!task) return null;

  const isLeaderOrAdmin = ["admin", "super_admin", "lead", "editor"].includes(
    userRole || "",
  );

  const currentAssignment = task.assignments?.find(
    (a) => a.user_id === currentUserId,
  );

  // Cálculos de checklist
  const totalChecklist = checklist.length;
  const completedChecklist = checklist.filter((item) => item.completed).length;
  const checklistPercent =
    totalChecklist > 0
      ? Math.round((completedChecklist / totalChecklist) * 100)
      : 0;

  // Manejar guardado de cambios principales (Título, Descripción, Prioridad, Fecha, Columna, Asignados)
  const handleSaveMain = () => {
    if (!title.trim()) {
      toast.error("El título no puede estar vacío");
      return;
    }

    startTransition(async () => {
      try {
        // Si cambió de columna, mover la tarea de columna
        if (columnId && columnId !== task.column_id) {
          await moveTask(task.id, columnId, 0);
        }

        await updateTask({
          taskId: task.id,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: dueDate || null,
          assignedUserIds,
          resources,
          checklist,
        });

        toast.success("Tarea guardada con éxito");
        onClose(); // Cierra el modal automáticamente
        onTaskUpdated?.();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al actualizar la tarea";
        toast.error(msg);
      }
    });
  };

  // Manejar cambio de estado del propio voluntario asignado
  const handleToggleMyStatus = (newStatus: AssignmentStatus) => {
    startTransition(async () => {
      try {
        await updateAssignmentStatus(task.id, newStatus);
        toast.success(
          newStatus === "COMPLETED"
            ? "¡Marcaste tu parte como completada!"
            : "Tu estado ha sido reactivado a 'En progreso'",
        );
        onTaskUpdated?.();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al actualizar asignación";
        toast.error(msg);
      }
    });
  };

  // Auto-detección inteligente del tipo de recurso al escribir/pegar URL
  const handleUrlChange = (url: string) => {
    setNewResourceUrl(url);
    const lower = url.toLowerCase();
    if (lower.includes("drive.google.com")) {
      setNewResourceType("drive");
    } else if (
      lower.includes("docs.google.com") ||
      lower.includes("sheets.google.com")
    ) {
      setNewResourceType("doc");
    } else if (lower.includes("figma.com") || lower.includes("canva.com")) {
      setNewResourceType("figma");
    } else if (
      lower.includes("meet.google.com") ||
      lower.includes("zoom.us") ||
      lower.includes("teams.microsoft.com")
    ) {
      setNewResourceType("meet");
    }
  };

  // Agregar recurso compartido (in-situ)
  const handleAddResource = () => {
    if (!newResourceUrl.trim()) {
      toast.error("Ingresa una URL válida");
      return;
    }
    const updated = [
      ...resources,
      {
        id: `res-${Date.now()}`,
        title: newResourceTitle.trim() || "Recurso",
        url: newResourceUrl.trim(),
        type: newResourceType,
      },
    ];
    setResources(updated);
    setNewResourceTitle("");
    setNewResourceUrl("");

    startTransition(async () => {
      try {
        await updateTask({
          taskId: task.id,
          title,
          description,
          priority,
          dueDate: dueDate || null,
          assignedUserIds,
          resources: updated,
          checklist,
        });
        toast.success("Recurso añadido");
        onTaskUpdated?.();
      } catch {
        toast.error("Error al guardar el recurso");
      }
    });
  };

  const handleRemoveResource = (id: string) => {
    const updated = resources.filter((r) => r.id !== id);
    setResources(updated);
    startTransition(async () => {
      try {
        await updateTask({
          taskId: task.id,
          title,
          description,
          priority,
          dueDate: dueDate || null,
          assignedUserIds,
          resources: updated,
          checklist,
        });
        toast.success("Recurso eliminado");
        onTaskUpdated?.();
      } catch {
        toast.error("Error al eliminar el recurso");
      }
    });
  };

  const handleCopyUrl = (url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  // Agregar y tildar Checklist (in-situ)
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const updated = [
      ...checklist,
      {
        id: `chk-${Date.now()}`,
        text: newChecklistText.trim(),
        completed: false,
      },
    ];
    setChecklist(updated);
    setNewChecklistText("");

    startTransition(async () => {
      try {
        await updateTask({
          taskId: task.id,
          title,
          description,
          priority,
          dueDate: dueDate || null,
          assignedUserIds,
          resources,
          checklist: updated,
        });
        onTaskUpdated?.();
      } catch {
        toast.error("Error al guardar checklist");
      }
    });
  };

  const handleToggleCheckItem = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    setChecklist(updated);

    startTransition(async () => {
      try {
        await updateTask({
          taskId: task.id,
          title,
          description,
          priority,
          dueDate: dueDate || null,
          assignedUserIds,
          resources,
          checklist: updated,
        });
        onTaskUpdated?.();
      } catch {
        toast.error("Error al actualizar checklist");
      }
    });
  };

  const handleRemoveCheckItem = (id: string) => {
    const updated = checklist.filter((item) => item.id !== id);
    setChecklist(updated);

    startTransition(async () => {
      try {
        await updateTask({
          taskId: task.id,
          title,
          description,
          priority,
          dueDate: dueDate || null,
          assignedUserIds,
          resources,
          checklist: updated,
        });
        onTaskUpdated?.();
      } catch {
        toast.error("Error al eliminar ítem");
      }
    });
  };

  // Comentarios (in-situ)
  const handleSendComment = () => {
    if (!commentText.trim()) return;

    startTransition(async () => {
      try {
        await addComment(task.id, commentText.trim());
        setCommentText("");
        toast.success("Comentario publicado");
        onTaskUpdated?.();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al comentar";
        toast.error(msg);
      }
    });
  };

  // Eliminar Tarea
  const handleDelete = () => {
    if (!confirm("¿Estás seguro de eliminar permanentemente esta tarea?"))
      return;

    startTransition(async () => {
      try {
        await deleteTask(task.id);
        toast.success("Tarea eliminada");
        onClose();
        onTaskUpdated?.();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al eliminar";
        toast.error(msg);
      }
    });
  };

  const currentColumn = columns.find(
    (c) => c.id === (columnId || task.column_id),
  );

  return (
    <Credenza open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CredenzaContent
        noScroll
        className="sm:max-w-4xl p-0 overflow-hidden flex flex-col h-[94vh] sm:h-[88vh] rounded-2xl border bg-background shadow-2xl"
      >
        {/* Cabecera del diálogo */}
        <CredenzaHeader className="px-4 sm:px-6 py-3.5 border-b bg-muted/30 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-3 pr-6 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Badge de Prioridad */}
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-2xs gap-1.5",
                  PRIORITY_STYLES[priority]?.badge,
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    PRIORITY_STYLES[priority]?.dot,
                  )}
                />
                {PRIORITY_STYLES[priority]?.label}
              </Badge>

              {/* Badge de Columna / Fase Actual */}
              {currentColumn && (
                <Badge
                  variant="secondary"
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-background/80"
                >
                  Fase: {currentColumn.title}
                </Badge>
              )}
            </div>

            {/* Acciones de Cabecera */}
            <div className="flex items-center gap-2">
              {isLeaderOrAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 px-2 cursor-pointer"
                  title="Eliminar tarea permanentemente"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Eliminar</span>
                </Button>
              )}
            </div>
          </div>

          <CredenzaTitle className="sr-only">
            Detalles de la tarea
          </CredenzaTitle>

          {/* Campo de Título Principal */}
          <div className="pt-0.5">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isLeaderOrAdmin}
              className="text-base sm:text-lg font-bold border-none px-1.5 py-1 h-auto focus-visible:ring-1 focus-visible:ring-primary shadow-none disabled:opacity-90 placeholder:text-muted-foreground/60 rounded-md"
              placeholder="Nombre de la tarea o paquete de trabajo..."
            />
          </div>
        </CredenzaHeader>

        {/* Cuerpo con 2 columnas (Contenido a la izquierda, Metadatos a la derecha) */}
        <CredenzaBody className="overflow-y-auto px-4 sm:px-6 py-4 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda (7/12 en escritorio): Descripción, Recursos, Checklist y Comentarios */}
            <div className="lg:col-span-7 space-y-6">
              {/* Sección 1: Descripción */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlignLeft className="h-3.5 w-3.5 text-primary" />
                  Descripción & Alcance
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalla pautas, instrucciones, objetivos específicos o entregables esperados..."
                  className="text-xs sm:text-sm min-h-[95px] resize-none leading-relaxed rounded-xl focus-visible:ring-primary"
                  disabled={!isLeaderOrAdmin}
                />
              </div>

              {/* Sección 2: Enlaces y Recursos Compartidos */}
              <div className="p-3.5 sm:p-4 rounded-2xl border bg-secondary/30 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Enlaces y Recursos ({resources.length})
                    </h4>
                  </div>
                </div>

                {/* Lista de recursos actuales */}
                <div className="space-y-2">
                  {resources.map((res) => (
                    <div
                      key={res.id}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-card border text-xs gap-2 transition-all hover:border-primary/40 shadow-2xs"
                    >
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-foreground hover:text-primary font-medium truncate flex-1 min-w-0"
                      >
                        <div className="p-1 rounded-md bg-secondary shrink-0">
                          {res.type === "drive" && (
                            <FolderArchive className="h-4 w-4 text-emerald-500" />
                          )}
                          {res.type === "doc" && (
                            <FileText className="h-4 w-4 text-blue-500" />
                          )}
                          {res.type === "figma" && (
                            <Figma className="h-4 w-4 text-purple-500" />
                          )}
                          {res.type === "meet" && (
                            <Video className="h-4 w-4 text-rose-500" />
                          )}
                          {res.type === "link" && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="truncate flex flex-col">
                          <span className="truncate font-semibold text-xs">
                            {res.title}
                          </span>
                          <span className="truncate text-[10px] text-muted-foreground">
                            {res.url}
                          </span>
                        </div>
                      </a>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer"
                          onClick={() => handleCopyUrl(res.url)}
                          title="Copiar URL"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-rose-500 cursor-pointer"
                          onClick={() => handleRemoveResource(res.id)}
                          title="Eliminar recurso"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {resources.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-1">
                      Sin enlaces aún. Añade Google Drive, Docs, Figma, Canva o
                      Meet.
                    </p>
                  )}
                </div>

                {/* Formulario para agregar nuevo recurso */}
                <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row gap-2">
                  <Select
                    value={newResourceType}
                    onValueChange={(val: SharedResource["type"]) =>
                      setNewResourceType(val)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs sm:w-32 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drive">Google Drive</SelectItem>
                      <SelectItem value="doc">Google Docs</SelectItem>
                      <SelectItem value="figma">Figma / Canva</SelectItem>
                      <SelectItem value="meet">Google Meet</SelectItem>
                      <SelectItem value="link">Otro Enlace</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Nombre (ej. Guion v2)"
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                    className="h-8 text-xs sm:w-36 shrink-0"
                  />

                  <Input
                    placeholder="https://drive.google.com/..."
                    value={newResourceUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="h-8 text-xs flex-1 min-w-0"
                  />

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddResource}
                    className="h-8 text-xs gap-1 shrink-0 cursor-pointer"
                    disabled={!newResourceUrl.trim() || isPending}
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir
                  </Button>
                </div>
              </div>

              {/* Sección 3: Checklist de Verificación */}
              <div className="p-3.5 sm:p-4 rounded-2xl border bg-secondary/30 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Checklist de Verificación ({completedChecklist}/
                      {totalChecklist})
                    </h4>
                  </div>
                  {totalChecklist > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {checklistPercent}%
                    </span>
                  )}
                </div>

                {/* Barra de progreso de Checklist */}
                {totalChecklist > 0 && (
                  <Progress value={checklistPercent} className="h-1.5" />
                )}

                {/* Lista de ítems */}
                <div className="space-y-1.5">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start justify-between gap-2.5 p-2 rounded-xl bg-card border text-xs shadow-2xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0 pt-0.5">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleCheckItem(item.id)}
                          className="h-4 w-4 rounded border-border text-primary cursor-pointer accent-primary mt-0.5 shrink-0"
                        />
                        <span
                          className={cn(
                            "text-xs leading-relaxed break-words flex-1 min-w-0",
                            item.completed &&
                              "line-through text-muted-foreground opacity-80",
                          )}
                        >
                          {item.text}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCheckItem(item.id)}
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-opacity shrink-0 cursor-pointer"
                        title="Eliminar ítem"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {checklist.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-1">
                      Sin ítems aún. Agrega pasos o criterios de aceptación para
                      el equipo.
                    </p>
                  )}
                </div>

                {/* Agregar nuevo ítem */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Input
                    placeholder="Añadir ítem al checklist (presiona Enter)..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddChecklistItem()
                    }
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddChecklistItem}
                    className="h-8 text-xs shrink-0 cursor-pointer"
                    disabled={!newChecklistText.trim() || isPending}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Sección 4: Comentarios & Bitácora */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Comentarios & Feedback ({task.comments?.length || 0})
                  </h4>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {task.comments?.map((cm) => (
                    <div
                      key={cm.id}
                      className="p-3 rounded-xl bg-card border text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 font-semibold">
                        <div className="flex items-center gap-2 truncate">
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage src={cm.user.image || ""} />
                            <AvatarFallback className="text-[8px]">
                              {cm.user.name?.slice(0, 2) || "US"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground truncate">
                            {cm.user.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-[10px] shrink-0">
                          {new Date(cm.created_at).toLocaleTimeString("es-PE", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words pl-7">
                        {cm.content}
                      </p>
                    </div>
                  ))}

                  {(!task.comments || task.comments.length === 0) && (
                    <p className="text-xs text-muted-foreground italic py-1">
                      Aún no hay comentarios. Deja notas, dudas o avances para
                      el equipo.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Escribe un comentario o actualización..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                    className="h-9 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSendComment}
                    className="h-9 text-xs gap-1.5 shrink-0 cursor-pointer"
                    disabled={!commentText.trim() || isPending}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </Button>
                </div>
              </div>
            </div>

            {/* Columna Derecha (5/12 en escritorio): Asignaciones, Columna, Prioridad y Fechas */}
            <div className="lg:col-span-5 space-y-5 bg-card/60 p-4 rounded-2xl border shadow-2xs h-fit">
              {/* Acción rápida para el voluntario actual si está asignado */}
              {currentAssignment && (
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Tu participación
                    </p>
                    <Badge
                      variant={
                        currentAssignment.status === "COMPLETED"
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        "text-[10px] px-2 py-0",
                        currentAssignment.status === "COMPLETED"
                          ? "bg-emerald-600 text-white"
                          : "",
                      )}
                    >
                      {currentAssignment.status === "COMPLETED"
                        ? "Completada"
                        : "En curso"}
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={
                      currentAssignment.status === "COMPLETED"
                        ? "outline"
                        : "default"
                    }
                    className={cn(
                      "w-full h-8 text-xs font-semibold cursor-pointer transition-colors",
                      currentAssignment.status === "COMPLETED"
                        ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white",
                    )}
                    onClick={() =>
                      handleToggleMyStatus(
                        currentAssignment.status === "COMPLETED"
                          ? "IN_PROGRESS"
                          : "COMPLETED",
                      )
                    }
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    {currentAssignment.status === "COMPLETED"
                      ? "Reabrir mi asignación"
                      : "Marcar mi parte lista"}
                  </Button>
                </div>
              )}

              {/* Selector de Columna / Fase del Tablero */}
              {columns.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Fase / Columna
                  </label>
                  <Select
                    value={columnId || task.column_id}
                    onValueChange={setColumnId}
                    disabled={!isLeaderOrAdmin}
                  >
                    <SelectTrigger className="h-9 text-xs">
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
              )}

              {/* Selector de Prioridad */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Prioridad
                </label>
                <Select
                  value={priority}
                  onValueChange={(val: PriorityLevel) => setPriority(val)}
                  disabled={!isLeaderOrAdmin}
                >
                  <SelectTrigger className="h-9 text-xs">
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

              {/* Selector de Fecha Límite con TaskDatePicker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Fecha Límite
                </label>
                <TaskDatePicker
                  date={dueDate}
                  onSelect={(d) => setDueDate(d)}
                  disabled={!isLeaderOrAdmin}
                  isCompleted={task.completed_at != null}
                />
              </div>

              {/* Asignación de Voluntarios */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Voluntarios Asignados
                  </span>
                  <span className="text-[11px] font-bold text-foreground">
                    ({assignedUserIds.length})
                  </span>
                </label>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1 border rounded-xl p-1.5 bg-background/50">
                  {teamMembers.map((member) => {
                    const isAssigned = assignedUserIds.includes(member.id);
                    const asg = task.assignments?.find(
                      (a) => a.user_id === member.id,
                    );

                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          if (!isLeaderOrAdmin) return;
                          if (isAssigned) {
                            setAssignedUserIds(
                              assignedUserIds.filter((id) => id !== member.id),
                            );
                          } else {
                            setAssignedUserIds([...assignedUserIds, member.id]);
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg border text-xs transition-colors",
                          isLeaderOrAdmin ? "cursor-pointer" : "cursor-default",
                          isAssigned
                            ? "bg-primary/10 border-primary/30 font-medium"
                            : "hover:bg-muted/50 border-transparent",
                        )}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={member.image || ""} />
                            <AvatarFallback className="text-[9px]">
                              {member.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{member.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAssigned && (
                            <>
                              <Badge
                                variant={
                                  asg?.status === "COMPLETED"
                                    ? "default"
                                    : "secondary"
                                }
                                className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  asg?.status === "COMPLETED"
                                    ? "bg-emerald-500 text-white"
                                    : "",
                                )}
                              >
                                {asg?.status === "COMPLETED"
                                  ? "Listo"
                                  : "En curso"}
                              </Badge>

                              {/* Coordinador/Admin puede marcar completada la parte de otro voluntario */}
                              {isLeaderOrAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextStatus =
                                      asg?.status === "COMPLETED"
                                        ? "IN_PROGRESS"
                                        : "COMPLETED";
                                    startTransition(async () => {
                                      try {
                                        await updateAssignmentStatus(
                                          task.id,
                                          nextStatus,
                                          undefined,
                                          member.id,
                                        );
                                        toast.success(
                                          `Estado de ${member.name} actualizado`,
                                        );
                                        onTaskUpdated?.();
                                      } catch (err: unknown) {
                                        const msg =
                                          err instanceof Error
                                            ? err.message
                                            : "Error al actualizar";
                                        toast.error(msg);
                                      }
                                    });
                                  }}
                                  title={
                                    asg?.status === "COMPLETED"
                                      ? "Reabrir para este voluntario"
                                      : "Completar por este voluntario"
                                  }
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  <CheckCircle2
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      asg?.status === "COMPLETED"
                                        ? "text-emerald-500"
                                        : "text-muted-foreground",
                                    )}
                                  />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CredenzaBody>

        {/* Pie de diálogo: Botón Guardar Cambios habilitado sólo si hay cambios en los campos principales */}
        <CredenzaFooter className="px-4 sm:px-6 py-3 border-t bg-muted/20 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {isDirty ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                * Tienes cambios sin guardar
              </span>
            ) : (
              <span>Todos los cambios guardados</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              {isDirty ? "Cancelar" : "Cerrar"}
            </Button>
            <Button
              type="button"
              onClick={handleSaveMain}
              disabled={!isDirty || isPending}
              className="text-xs gap-1.5 cursor-pointer font-semibold"
            >
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
