"use client";

import React, { useState, useOptimistic, startTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  KanbanBoard as BoardType,
  KanbanTask,
  KanbanColumn as ColumnType,
  TeamMember,
  TaskFilters,
} from "../_lib/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { moveTask } from "../_lib/actions";
import { toast } from "sonner";

interface KanbanBoardProps {
  board: BoardType;
  teamMembers: TeamMember[];
  currentUserId?: string;
  userRole?: string;
  filters: TaskFilters;
  onOpenDetail: (task: KanbanTask) => void;
  onQuickAddTask: (columnId: string) => void;
}

export function KanbanBoard({
  board,
  teamMembers: _teamMembers,
  currentUserId,
  userRole,
  filters,
  onOpenDetail,
  onQuickAddTask,
}: KanbanBoardProps) {
  // Configuración de sensores táctiles y de puntero para soporte móvil
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
  );

  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  // useOptimistic para mover instantáneamente sin esperar respuesta del servidor
  const [optimisticColumns, setOptimisticColumns] = useOptimistic(
    board.columns,
    (
      state: ColumnType[],
      action: {
        taskId: string;
        fromColId: string;
        toColId: string;
        targetIndex: number;
      },
    ) => {
      const next = state.map((c) => ({
        ...c,
        tasks: [...c.tasks],
      }));

      const sourceCol = next.find((c) => c.id === action.fromColId);
      const destCol = next.find((c) => c.id === action.toColId);

      if (!sourceCol || !destCol) return state;

      const taskIndex = sourceCol.tasks.findIndex(
        (t) => t.id === action.taskId,
      );
      if (taskIndex === -1) return state;

      const [task] = sourceCol.tasks.splice(taskIndex, 1);
      const updatedTask = {
        ...task,
        column_id: action.toColId,
        position: action.targetIndex,
      };

      destCol.tasks.splice(action.targetIndex, 0, updatedTask);
      destCol.tasks.forEach((t, idx) => {
        t.position = idx;
      });

      return next;
    },
  );

  // Filtrado reactivo en cliente de acuerdo a los filtros de cabecera
  const filteredColumns = optimisticColumns.map((col) => {
    let tasks = col.tasks;

    // Filtro por texto
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    // Filtro por prioridad
    if (filters.priority && filters.priority !== "ALL") {
      tasks = tasks.filter((t) => t.priority === filters.priority);
    }

    // Filtro por usuario o "Mis tareas"
    if (filters.userId === "MINE" && currentUserId) {
      tasks = tasks.filter((t) =>
        t.assignments?.some((a) => a.user_id === currentUserId),
      );
    } else if (filters.userId && filters.userId !== "ALL") {
      tasks = tasks.filter((t) =>
        t.assignments?.some((a) => a.user_id === filters.userId),
      );
    }

    // Filtro por fecha de vencimiento
    if (filters.dueDate === "OVERDUE") {
      const now = new Date();
      tasks = tasks.filter(
        (t) => t.due_date && !t.completed_at && new Date(t.due_date) < now,
      );
    }

    return {
      ...col,
      tasks,
    };
  });

  // Mover tarjeta mediante acción rápida (One-Tap para móvil)
  const handleQuickMove = (taskId: string, targetColId: string) => {
    const sourceCol = board.columns.find((c) =>
      c.tasks.some((t) => t.id === taskId),
    );
    if (!sourceCol || sourceCol.id === targetColId) return;

    const destCol = board.columns.find((c) => c.id === targetColId);
    const targetIndex = destCol ? destCol.tasks.length : 0;

    startTransition(async () => {
      setOptimisticColumns({
        taskId,
        fromColId: sourceCol.id,
        toColId: targetColId,
        targetIndex,
      });

      try {
        await moveTask(taskId, targetColId, targetIndex);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al mover la tarjeta";
        toast.error(msg);
      }
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = board.columns
      .flatMap((c) => c.tasks)
      .find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Encontrar columna y posición de origen
    let sourceCol: ColumnType | undefined;
    let activeTaskObj: KanbanTask | undefined;

    for (const col of board.columns) {
      const found = col.tasks.find((t) => t.id === activeId);
      if (found) {
        sourceCol = col;
        activeTaskObj = found;
        break;
      }
    }

    if (!sourceCol || !activeTaskObj) return;

    // Determinar columna y posición de destino
    let targetColId: string;
    let targetIndex: number;

    const isOverAColumn = board.columns.some((c) => c.id === overId);

    if (isOverAColumn) {
      targetColId = overId;
      const destCol = board.columns.find((c) => c.id === overId);
      targetIndex = destCol ? destCol.tasks.length : 0;
    } else {
      let destCol: ColumnType | undefined;
      for (const col of board.columns) {
        const found = col.tasks.find((t) => t.id === overId);
        if (found) {
          destCol = col;
          break;
        }
      }

      if (!destCol) return;
      targetColId = destCol.id;
      const overIndex = destCol.tasks.findIndex((t) => t.id === overId);
      targetIndex = overIndex >= 0 ? overIndex : destCol.tasks.length;
    }

    if (
      sourceCol.id === targetColId &&
      activeTaskObj.position === targetIndex
    ) {
      return;
    }

    startTransition(async () => {
      setOptimisticColumns({
        taskId: activeId,
        fromColId: sourceCol!.id,
        toColId: targetColId,
        targetIndex,
      });

      try {
        await moveTask(activeId, targetColId, targetIndex);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al mover la tarjeta";
        toast.error(msg);
      }
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 w-full overflow-x-auto pb-4 pt-1 snap-x snap-mandatory flex gap-4 min-h-[calc(100vh-280px)]">
        {filteredColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            allColumns={board.columns}
            currentUserId={currentUserId}
            canCreate={["admin", "super_admin", "lead", "editor"].includes(
              userRole || "",
            )}
            onOpenDetail={onOpenDetail}
            onMoveQuick={handleQuickMove}
            onQuickAddTask={onQuickAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <KanbanCard
            task={activeTask}
            columns={board.columns}
            currentUserId={currentUserId}
            onOpenDetail={() => {}}
            onMoveQuick={() => {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
