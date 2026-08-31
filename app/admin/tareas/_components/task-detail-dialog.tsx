"use client";

import React, { useState, useTransition } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "../_lib/actions";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  ExternalLink,
  FileText,
  Figma,
  FolderArchive,
  Link as LinkIcon,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export function TaskDetailDialog({
  task,
  columns: _columns,
  teamMembers,
  currentUserId,
  userRole,
  isOpen,
  onClose,
  onTaskUpdated,
}: TaskDetailDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Estados de edición de la tarea
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<PriorityLevel>(
    task?.priority || "MEDIA",
  );
  const [dueDate, setDueDate] = useState<string>(
    task?.due_date ? task.due_date.split("T")[0] : "",
  );
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(
    task?.assignments?.map((a) => a.user_id) || [],
  );
  const [resources, setResources] = useState<SharedResource[]>(
    task?.resources || [],
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task?.checklist || [],
  );

  // Estados locales para nuevos elementos
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceType, setNewResourceType] =
    useState<SharedResource["type"]>("drive");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [commentText, setCommentText] = useState("");

  if (!task) return null;

  const currentAssignment = task.assignments?.find(
    (a) => a.user_id === currentUserId,
  );

  // Manejar guardado de cambios principales
  const handleSaveMain = () => {
    if (!title.trim()) {
      toast.error("El título no puede estar vacío");
      return;
    }

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
          checklist,
        });
        toast.success("Tarea actualizada con éxito");
        onTaskUpdated?.();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al actualizar tarea";
        toast.error(msg);
      }
    });
  };

  // Manejar cambio de estado del propio voluntario asignado
  const handleToggleMyStatus = (newStatus: AssignmentStatus) => {
    startTransition(async () => {
      try {
        await updateAssignmentStatus(task.id, newStatus);
        toast.success("Tu estado de asignación ha sido actualizado");
        onTaskUpdated?.();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al actualizar asignación";
        toast.error(msg);
      }
    });
  };

  // Agregar recurso compartido
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

    // Guardar en servidor
    startTransition(async () => {
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
    });
  };

  const handleRemoveResource = (id: string) => {
    const updated = resources.filter((r) => r.id !== id);
    setResources(updated);
    startTransition(async () => {
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
      onTaskUpdated?.();
    });
  };

  // Agregar y tildar Checklist
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
    });
  };

  const handleToggleCheckItem = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    setChecklist(updated);

    startTransition(async () => {
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
    });
  };

  // Comentarios
  const handleSendComment = () => {
    if (!commentText.trim()) return;

    startTransition(async () => {
      try {
        await addComment(task.id, commentText);
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
    if (!confirm("¿Estás seguro de eliminar este paquete de trabajo?")) return;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-3 pr-6">
            <Badge
              variant="outline"
              className="text-xs uppercase font-bold tracking-wider"
            >
              {task.priority}
            </Badge>
            <div className="flex items-center gap-2">
              {["admin", "super_admin", "lead", "editor"].includes(
                userRole || "",
              ) && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 text-rose-500 hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 border border-rose-200 dark:border-rose-900"
                  onClick={handleDelete}
                  title="Eliminar tarea"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <DialogTitle className="sr-only">Detalle de tarea</DialogTitle>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={
              !["admin", "super_admin", "lead", "editor"].includes(
                userRole || "",
              )
            }
            className="text-lg font-bold border-none px-1 h-auto focus-visible:ring-1 focus-visible:ring-primary shadow-none disabled:opacity-90"
            placeholder="Nombre de la tarea..."
          />
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Columna Izquierda (2/3): Descripción, Checklist, Recursos y Comentarios */}
          <div className="md:col-span-2 space-y-6">
            {/* Descripción */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Descripción & Alcance
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalla instrucciones, pautas, objetivos o consideraciones especiales..."
                className="text-sm min-h-[90px] resize-none"
              />
            </div>

            {/* Recursos Compartidos (Drive, Figma, Docs, Meet) */}
            <div className="p-4 rounded-xl border bg-secondary/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Enlaces y Recursos Compartidos ({resources.length})
                  </h4>
                </div>
              </div>

              {/* Lista de recursos actuales */}
              <div className="space-y-2">
                {resources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-card border text-sm gap-2"
                  >
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline font-medium truncate"
                    >
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
                      <span className="truncate">{res.title}</span>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-rose-500"
                      onClick={() => handleRemoveResource(res.id)}
                    >
                      &times;
                    </Button>
                  </div>
                ))}

                {resources.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    Sin enlaces compartidos aún. Añade Google Drive, Figma, Docs
                    o Meet.
                  </p>
                )}
              </div>

              {/* Agregar nuevo recurso */}
              <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Select
                  value={newResourceType}
                  onValueChange={(val: SharedResource["type"]) =>
                    setNewResourceType(val)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
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
                  className="h-8 text-xs"
                />

                <Input
                  placeholder="https://drive.google.com/..."
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                  className="h-8 text-xs sm:col-span-1"
                />

                <Button
                  size="sm"
                  onClick={handleAddResource}
                  className="h-8 text-xs gap-1"
                  disabled={!newResourceUrl.trim()}
                >
                  <Plus className="h-3.5 w-3.5" /> Añadir
                </Button>
              </div>
            </div>

            {/* Checklist */}
            <div className="p-4 rounded-xl border bg-secondary/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Checklist de Verificación (
                    {checklist.filter((c) => c.completed).length}/
                    {checklist.length})
                  </h4>
                </div>
              </div>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-card border text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleCheckItem(item.id)}
                      className="h-4 w-4 rounded border-border text-primary cursor-pointer accent-primary"
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        item.completed && "line-through text-muted-foreground",
                      )}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Input
                  placeholder="Añadir ítem al checklist..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddChecklistItem()
                  }
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleAddChecklistItem}
                  className="h-8 text-xs"
                  disabled={!newChecklistText.trim()}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Comentarios y Bitácora */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Comentarios y Feedback ({task.comments?.length || 0})
                </h4>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {task.comments?.map((cm) => (
                  <div
                    key={cm.id}
                    className="p-3 rounded-xl bg-muted/50 border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-foreground">{cm.user.name}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(cm.created_at).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {cm.content}
                    </p>
                  </div>
                ))}

                {(!task.comments || task.comments.length === 0) && (
                  <p className="text-xs text-muted-foreground italic">
                    Aún no hay comentarios. Deja notas o indicaciones al equipo.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Escribe un comentario o actualización..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                  className="h-9 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleSendComment}
                  className="h-9 text-xs gap-1.5"
                  disabled={!commentText.trim() || isPending}
                >
                  <Send className="h-3.5 w-3.5" /> Enviar
                </Button>
              </div>
            </div>
          </div>

          {/* Columna Derecha (1/3): Asignaciones, Quórum, Prioridad y Fechas */}
          <div className="space-y-5 bg-card/60 p-4 rounded-xl border">
            {/* Si el usuario actual está asignado: Panel de acción rápida de 1 toque */}
            {currentAssignment && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                <p className="text-xs font-semibold text-primary">
                  Tu participación en esta tarea:
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={
                      currentAssignment.status === "COMPLETED"
                        ? "default"
                        : "outline"
                    }
                    className={cn(
                      "flex-1 h-8 text-xs font-medium",
                      currentAssignment.status === "COMPLETED"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "",
                    )}
                    onClick={() =>
                      handleToggleMyStatus(
                        currentAssignment.status === "COMPLETED"
                          ? "IN_PROGRESS"
                          : "COMPLETED",
                      )
                    }
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    {currentAssignment.status === "COMPLETED"
                      ? "¡Parte Completada!"
                      : "Marcar mi parte lista"}
                  </Button>
                </div>
              </div>
            )}

            {/* Asignación Múltiple de Voluntarios */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Voluntarios Asignados
              </label>

              <div className="space-y-1.5">
                {teamMembers.map((member) => {
                  const isAssigned = assignedUserIds.includes(member.id);
                  const asg = task.assignments?.find(
                    (a) => a.user_id === member.id,
                  );

                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        if (
                          !["admin", "super_admin", "lead", "editor"].includes(
                            userRole || "",
                          )
                        ) {
                          return;
                        }
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
                        ["admin", "super_admin", "lead", "editor"].includes(
                          userRole || "",
                        )
                          ? "cursor-pointer"
                          : "cursor-default",
                        isAssigned
                          ? "bg-primary/5 border-primary/40 font-medium"
                          : "hover:bg-muted/50 border-transparent",
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.image || ""} />
                          <AvatarFallback className="text-[9px]">
                            {member.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{member.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
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
                                ? "Completado"
                                : "En curso"}
                            </Badge>

                            {/* Si es Líder o Admin, puede marcar la tarea de otro voluntario si está inactivo */}
                            {[
                              "admin",
                              "super_admin",
                              "lead",
                              "editor",
                            ].includes(userRole || "") && (
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
                                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-[10px]"
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

            {/* Prioridad */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Prioridad
              </label>
              <Select
                value={priority}
                onValueChange={(val: PriorityLevel) => setPriority(val)}
                disabled={
                  !["admin", "super_admin", "lead", "editor"].includes(
                    userRole || "",
                  )
                }
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

            {/* Fecha Límite */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Fecha Límite
              </label>
              <Input
                type="date"
                value={dueDate}
                disabled={
                  !["admin", "super_admin", "lead", "editor"].includes(
                    userRole || "",
                  )
                }
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Botón de Guardar Cambios */}
            <Button
              className="w-full mt-4"
              onClick={handleSaveMain}
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
