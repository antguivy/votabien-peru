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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border bg-card p-3.5 shadow-sm transition-all duration-200",
        "hover:border-primary/40 hover:shadow-md",
        isDragging && "opacity-40 ring-2 ring-primary scale-95",
        isOverlay &&
          "rotate-2 shadow-2xl ring-2 ring-primary cursor-grabbing scale-105 z-50",
        isAssignedToMe && "border-l-4 border-l-primary",
      )}
    >
      {/* Cabecera: Prioridad, Tags & Menú Rápido */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
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

        <div className="flex items-center gap-1">
          {/* Mango de arrastre táctil / puntero */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground p-1 rounded transition-colors"
            title="Arrastrar para mover"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Menú de 1 toque (Mobile-first) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">
                Acciones de tarea
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onOpenDetail(task)}>
                Ver detalle y recursos
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs gap-2">
                  <MoveRight className="h-3.5 w-3.5 text-primary" />
                  <span>Mover a columna...</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {columns.map((col) => (
                    <DropdownMenuItem
                      key={col.id}
                      disabled={col.id === task.column_id}
                      onClick={() => onMoveQuick(task.id, col.id)}
                      className="text-xs flex items-center justify-between"
                    >
                      <span>{col.title}</span>
                      {col.id === task.column_id && (
                        <span className="text-[10px] text-muted-foreground">
                          (actual)
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Título de la Tarea / Paquete de Trabajo */}
      <h4
        onClick={() => onOpenDetail(task)}
        className="font-medium text-sm text-foreground leading-snug cursor-pointer hover:text-primary transition-colors line-clamp-2"
      >
        {task.title}
      </h4>

      {/* Descripción corta si existe */}
      {task.description && (
        <p
          onClick={() => onOpenDetail(task)}
          className="mt-1 text-xs text-muted-foreground line-clamp-2 cursor-pointer"
        >
          {task.description}
        </p>
      )}

      {/* Recursos en vivo (Drive, Figma, Meet) */}
      {task.resources && task.resources.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          {task.resources.slice(0, 3).map((res) => (
            <a
              key={res.id}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/80 hover:bg-secondary text-[11px] font-medium text-foreground transition-colors border border-border/50 max-w-[140px] truncate"
              title={res.title || res.url}
            >
              {getResourceIcon(res.type)}
              <span className="truncate">{res.title || "Enlace"}</span>
            </a>
          ))}
          {task.resources.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{task.resources.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Barra de Consenso de Asignados si hay más de 1 asignado */}
      {totalAssigned > 1 && (
        <div className="mt-3 pt-2 border-t border-border/40 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Quórum completado:</span>
            <span className="font-semibold text-foreground">
              {completedAssigned}/{totalAssigned}
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round((completedAssigned / totalAssigned) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Pie de Tarjeta: Checklist, Fecha Límite y Avatares */}
      <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          {/* Checklist */}
          {totalChecklist > 0 && (
            <div
              className={cn(
                "flex items-center gap-1 text-[11px]",
                checklistPercent === 100
                  ? "text-emerald-500 font-semibold"
                  : "",
              )}
              title={`Checklist: ${completedChecklist} de ${totalChecklist} ítems`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>
                {completedChecklist}/{totalChecklist}
              </span>
            </div>
          )}

          {/* Fecha Límite */}
          {formattedDueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-[11px]",
                isOverdue
                  ? "text-rose-500 font-semibold"
                  : "text-muted-foreground",
              )}
              title={
                isOverdue ? "¡Tarea vencida!" : `Vence el ${formattedDueDate}`
              }
            >
              {isOverdue ? (
                <Clock className="h-3.5 w-3.5 text-rose-500" />
              ) : (
                <Calendar className="h-3.5 w-3.5" />
              )}
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>

        {/* Avatares de Asignados */}
        <div className="flex -space-x-2 overflow-hidden">
          {task.assignments && task.assignments.length > 0 ? (
            task.assignments.slice(0, 3).map((asg) => (
              <Avatar
                key={asg.id}
                className={cn(
                  "h-6 w-6 border-2 border-background ring-1",
                  asg.status === "COMPLETED"
                    ? "ring-emerald-500"
                    : asg.status === "IN_PROGRESS"
                      ? "ring-blue-500"
                      : "ring-muted-foreground/30",
                )}
                title={`${asg.user.name} (${asg.status === "COMPLETED" ? "Listo" : "En progreso"})`}
              >
                <AvatarImage src={asg.user.image || ""} alt={asg.user.name} />
                <AvatarFallback className="text-[9px] font-medium uppercase bg-muted">
                  {asg.user.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            <div
              className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-[10px] text-muted-foreground"
              title="Sin asignar"
            >
              ?
            </div>
          )}
          {task.assignments && task.assignments.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
              +{task.assignments.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
