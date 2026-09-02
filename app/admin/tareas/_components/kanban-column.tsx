"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn as ColumnType, KanbanTask } from "../_lib/types";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
  column: ColumnType;
  allColumns: ColumnType[];
  currentUserId?: string;
  canCreate?: boolean;
  onOpenDetail: (task: KanbanTask) => void;
  onMoveQuick: (taskId: string, targetColId: string) => void;
  onQuickAddTask: (columnId: string) => void;
}

const COLOR_MAP: Record<string, { bg: string; dot: string; border: string }> = {
  slate: {
    bg: "bg-slate-50/70 dark:bg-zinc-900/60",
    dot: "bg-slate-400",
    border: "border-slate-200 dark:border-zinc-800",
  },
  blue: {
    bg: "bg-blue-50/40 dark:bg-blue-950/20",
    dot: "bg-blue-500",
    border: "border-blue-200/60 dark:border-blue-900/40",
  },
  indigo: {
    bg: "bg-indigo-50/40 dark:bg-indigo-950/20",
    dot: "bg-indigo-500",
    border: "border-indigo-200/60 dark:border-indigo-900/40",
  },
  amber: {
    bg: "bg-amber-50/40 dark:bg-amber-950/20",
    dot: "bg-amber-500",
    border: "border-amber-200/60 dark:border-amber-900/40",
  },
  pink: {
    bg: "bg-pink-50/40 dark:bg-pink-950/20",
    dot: "bg-pink-500",
    border: "border-pink-200/60 dark:border-pink-900/40",
  },
  purple: {
    bg: "bg-purple-50/40 dark:bg-purple-950/20",
    dot: "bg-purple-500",
    border: "border-purple-200/60 dark:border-purple-900/40",
  },
  cyan: {
    bg: "bg-cyan-50/40 dark:bg-cyan-950/20",
    dot: "bg-cyan-500",
    border: "border-cyan-200/60 dark:border-cyan-900/40",
  },
  emerald: {
    bg: "bg-emerald-50/40 dark:bg-emerald-950/20",
    dot: "bg-emerald-500",
    border: "border-emerald-200/60 dark:border-emerald-900/40",
  },
};

export function KanbanColumn({
  column,
  allColumns,
  currentUserId,
  canCreate,
  onOpenDetail,
  onMoveQuick,
  onQuickAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map((t) => t.id);
  const colorStyle = COLOR_MAP[column.color || "slate"] || COLOR_MAP.slate;

  return (
    <div
      id={`col-${column.id}`}
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-shrink-0 w-[285px] sm:w-[300px] md:w-[320px] max-h-full rounded-2xl border p-2.5 transition-colors duration-200 snap-center shadow-sm",
        colorStyle.bg,
        colorStyle.border,
        isOver && "ring-2 ring-primary/60 border-primary bg-primary/5",
      )}
    >
      {/* Cabecera de Columna */}
      <div className="flex items-center justify-between px-2 py-1 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn("h-2.5 w-2.5 rounded-full shrink-0", colorStyle.dot)}
          />
          <h3 className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 truncate">
            <span className="truncate">{column.title}</span>
            {column.is_completed && (
              <span
                title="Columna de Entrega / Meta lograda"
                className="shrink-0"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </span>
            )}
          </h3>
          <span className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded-full border border-border/50 shrink-0">
            {column.tasks.length}
          </span>
        </div>

        {canCreate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onQuickAddTask(column.id)}
            className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 shrink-0 cursor-pointer"
            title="Añadir tarea a esta fase"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Lista Sortable de Tarjetas */}
      <div className="flex-1 overflow-y-auto space-y-2 px-0.5 min-h-[120px] pb-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              columns={allColumns}
              currentUserId={currentUserId}
              onOpenDetail={onOpenDetail}
              onMoveQuick={onMoveQuick}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 &&
          (canCreate ? (
            <div
              onClick={() => onQuickAddTask(column.id)}
              className="h-24 rounded-xl border border-dashed border-border/60 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary cursor-pointer transition-colors text-xs p-3 text-center bg-background/40"
            >
              <Plus className="h-4 w-4 opacity-70" />
              <span>Sin tareas en esta fase</span>
              <span className="text-[10px] text-muted-foreground/80">
                Haz clic para registrar una
              </span>
            </div>
          ) : (
            <div className="h-20 rounded-xl border border-dashed border-border/40 flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs p-3 text-center bg-background/20 select-none">
              <span>Sin tareas en esta fase</span>
            </div>
          ))}
      </div>
    </div>
  );
}
