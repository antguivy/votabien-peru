"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  KanbanTask,
  KanbanColumn,
  PriorityLevel,
  SharedResource,
} from "../_lib/types";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  FileText,
  Figma,
  FolderArchive,
  GripVertical,
  MoreHorizontal,
  MoveRight,
  Video,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";

const COLUMN_COLORS: Record<string, string> = {
  slate: "bg-slate-400",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  amber: "bg-amber-500",
  pink: "bg-pink-500",
  purple: "bg-purple-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
};

interface KanbanCardProps {
  task: KanbanTask;
  columns: KanbanColumn[];
  currentUserId?: string;
  onOpenDetail: (task: KanbanTask) => void;
  onMoveQuick: (taskId: string, targetColId: string) => void;
  isOverlay?: boolean;
}

const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  BAJA: {
    label: "Baja",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
  },
  MEDIA: {
    label: "Media",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-900",
  },
  ALTA: {
    label: "Alta",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-900",
  },
  URGENTE: {
    label: "Urgente",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-300 dark:border-rose-900",
  },
};

function getResourceIcon(type: SharedResource["type"]) {
  switch (type) {
    case "drive":
      return <FolderArchive className="h-3 w-3 text-emerald-500" />;
    case "doc":
    case "sheet":
      return <FileText className="h-3 w-3 text-blue-500" />;
    case "figma":
      return <Figma className="h-3 w-3 text-purple-500" />;
    case "meet":
      return <Video className="h-3 w-3 text-red-500" />;
    default:
      return <ExternalLink className="h-3 w-3 text-muted-foreground" />;
  }
}

export function KanbanCard({
  task,
  columns,
  currentUserId,
  onOpenDetail,
  onMoveQuick,
  isOverlay = false,
}: KanbanCardProps) {
  const [isActionSheetOpen, setIsActionSheetOpen] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Cálculo de checklist
  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist =
    task.checklist?.filter((item) => item.completed).length || 0;
  const checklistPercent =
    totalChecklist > 0
      ? Math.round((completedChecklist / totalChecklist) * 100)
      : 0;

  // Cálculo de asignaciones
  const totalAssigned = task.assignments?.length || 0;
  const completedAssigned =
    task.assignments?.filter((a) => a.status === "COMPLETED").length || 0;
  const isAssignedToMe = task.assignments?.some(
    (a) => a.user_id === currentUserId,
  );

  // Fecha de vencimiento
  const isOverdue =
    task.due_date && !task.completed_at && new Date(task.due_date) < new Date();

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("es-PE", {
        month: "short",
        day: "numeric",
      })
    : null;

  const priorityMeta = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIA;
  const currentColumn = columns.find((c) => c.id === task.column_id);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative rounded-xl border bg-card p-2.5 sm:p-3 shadow-2xs transition-all duration-200",
          "hover:border-primary/40 hover:shadow-sm",
          isDragging && "opacity-40 ring-2 ring-primary scale-95",
          isOverlay &&
            "rotate-2 shadow-2xl ring-2 ring-primary cursor-grabbing scale-105 z-50",
          isAssignedToMe && "border-l-4 border-l-primary",
        )}
      >
        {/* Cabecera: Prioridad, Asignado a ti & Acciones */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1 min-w-0 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] font-semibold px-1.5 py-0 rounded-full border",
                priorityMeta.bg,
                priorityMeta.text,
                priorityMeta.border,
              )}
            >
              {priorityMeta.label}
            </Badge>

            {isAssignedToMe && (
              <Badge
                variant="secondary"
                className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary font-medium border-primary/20"
              >
                Asignado a ti
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* Mango de arrastre táctil / puntero */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground p-0.5 rounded transition-colors"
              title="Arrastrar para mover"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>

            {/* Botón de Acciones / Mover Tarea (Abre Action Sheet / Drawer sin desbordamientos) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsActionSheetOpen(true);
              }}
              className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Mover de fase o ver acciones"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Título de la Tarea / Paquete de Trabajo */}
        <h4
          onClick={() => onOpenDetail(task)}
          className="font-medium text-xs sm:text-sm text-foreground leading-snug cursor-pointer hover:text-primary transition-colors line-clamp-2"
        >
          {task.title}
        </h4>

        {/* Descripción corta si existe */}
        {task.description && (
          <p
            onClick={() => onOpenDetail(task)}
            className="mt-1 text-[11px] text-muted-foreground line-clamp-1 cursor-pointer"
          >
            {task.description}
          </p>
        )}

        {/* Recursos en vivo compactos */}
        {task.resources && task.resources.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
            {task.resources.slice(0, 2).map((res) => (
              <a
                key={res.id}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary/70 hover:bg-secondary text-[10px] font-medium text-foreground transition-colors border border-border/50 max-w-[120px] truncate"
                title={res.title || res.url}
              >
                {getResourceIcon(res.type)}
                <span className="truncate">{res.title || "Enlace"}</span>
              </a>
            ))}
            {task.resources.length > 2 && (
              <span className="text-[9px] text-muted-foreground font-semibold px-1 rounded bg-secondary/50">
                +{task.resources.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Pie de Tarjeta Compacto */}
        <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs min-w-0">
            {/* Checklist */}
            {totalChecklist > 0 && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-[10px]",
                  checklistPercent === 100
                    ? "text-emerald-500 font-semibold"
                    : "text-muted-foreground",
                )}
                title={`Checklist: ${completedChecklist} de ${totalChecklist} ítems`}
              >
                <CheckSquare className="h-3 w-3" />
                <span>
                  {completedChecklist}/{totalChecklist}
                </span>
              </div>
            )}

            {/* Fecha Límite */}
            {formattedDueDate && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-[10px]",
                  isOverdue
                    ? "text-rose-500 font-semibold"
                    : "text-muted-foreground",
                )}
                title={
                  isOverdue ? "¡Tarea vencida!" : `Vence el ${formattedDueDate}`
                }
              >
                {isOverdue ? (
                  <Clock className="h-3 w-3 text-rose-500" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                <span>{formattedDueDate}</span>
              </div>
            )}

            {/* Quórum Compacto si hay más de 1 asignado */}
            {totalAssigned > 1 && (
              <span
                className={cn(
                  "text-[9px] px-1 py-0 rounded font-semibold border hidden sm:inline-block",
                  completedAssigned === totalAssigned
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                    : "bg-secondary text-muted-foreground border-border/50",
                )}
                title={`Quórum: ${completedAssigned} de ${totalAssigned} voluntarios listos`}
              >
                {completedAssigned}/{totalAssigned}
              </span>
            )}
          </div>

          {/* Avatares de Asignados */}
          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
            {task.assignments && task.assignments.length > 0 ? (
              task.assignments.slice(0, 3).map((asg) => (
                <Avatar
                  key={asg.id}
                  className={cn(
                    "h-5 w-5 border border-background ring-1",
                    asg.status === "COMPLETED"
                      ? "ring-emerald-500"
                      : asg.status === "IN_PROGRESS"
                        ? "ring-blue-500"
                        : "ring-muted-foreground/30",
                  )}
                  title={`${asg.user.name} (${asg.status === "COMPLETED" ? "Listo" : "En progreso"})`}
                >
                  <AvatarImage src={asg.user.image || ""} alt={asg.user.name} />
                  <AvatarFallback className="text-[8px] font-medium uppercase bg-muted">
                    {asg.user.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ))
            ) : (
              <div
                className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-[9px] text-muted-foreground"
                title="Sin asignar"
              >
                ?
              </div>
            )}
            {task.assignments && task.assignments.length > 3 && (
              <div className="h-5 w-5 rounded-full bg-secondary border border-background flex items-center justify-center text-[8px] font-semibold text-muted-foreground">
                +{task.assignments.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Sheet / Bottom Drawer para Móvil & Desktop (Cero desbordamientos) */}
      <Credenza
        open={isActionSheetOpen}
        onOpenChange={(open) => setIsActionSheetOpen(open)}
      >
        <CredenzaContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border bg-background shadow-2xl">
          <CredenzaHeader className="px-5 py-3.5 border-b bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-semibold px-1.5 py-0 rounded-full border",
                  priorityMeta.bg,
                  priorityMeta.text,
                  priorityMeta.border,
                )}
              >
                {priorityMeta.label}
              </Badge>
              {currentColumn && (
                <span className="text-[11px] text-muted-foreground">
                  Fase actual: <b>{currentColumn.title}</b>
                </span>
              )}
            </div>
            <CredenzaTitle className="text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2">
              {task.title}
            </CredenzaTitle>
          </CredenzaHeader>

          <CredenzaBody className="px-5 py-3 space-y-3">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Mover a columna / fase:
              </p>
              <div className="space-y-1.5">
                {columns.map((col) => {
                  const isCurrent = col.id === task.column_id;
                  const dotColor =
                    COLUMN_COLORS[col.color || "slate"] || "bg-slate-400";

                  return (
                    <button
                      key={col.id}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        onMoveQuick(task.id, col.id);
                        setIsActionSheetOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer",
                        isCurrent
                          ? "bg-primary/10 border-primary/40 font-semibold text-foreground cursor-default"
                          : "bg-card hover:bg-secondary border-border/60 hover:border-primary/40 text-foreground active:scale-[0.99]",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn("h-2.5 w-2.5 rounded-full", dotColor)}
                        />
                        <span className="text-xs sm:text-sm">{col.title}</span>
                        {col.is_completed && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </div>
                      {isCurrent ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Actual
                        </Badge>
                      ) : (
                        <MoveRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t flex flex-col gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenDetail(task);
                }}
                className="w-full text-xs h-8 font-semibold justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                Ver detalle, checklist y recursos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsActionSheetOpen(false)}
                className="w-full text-xs h-7 text-muted-foreground justify-center cursor-pointer"
              >
                Cancelar
              </Button>
            </div>
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
