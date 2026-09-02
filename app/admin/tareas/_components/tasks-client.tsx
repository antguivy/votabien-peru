"use client";

import React, { useState } from "react";
import {
  BoardSummary,
  KanbanBoard as BoardType,
  TeamMember,
  KanbanTask,
  TaskFilters,
} from "../_lib/types";
import { WorkspaceHeader } from "./workspace-header";
import { KanbanBoard } from "./kanban-board";
import { TasksTableView } from "./tasks-table-view";
import { TaskDetailDialog } from "./task-detail-dialog";
import { TaskCreateDialog } from "./task-create-dialog";
import { BoardFormDialog } from "./board-form-dialog";
import { useRouter } from "next/navigation";

interface TasksClientProps {
  boards: BoardSummary[];
  initialBoard: BoardType;
  teamMembers: TeamMember[];
  currentUserId?: string;
  userRole?: string;
}

export function TasksClient({
  boards,
  initialBoard,
  teamMembers,
  currentUserId,
  userRole,
}: TasksClientProps) {
  const router = useRouter();

  // Estados de vista y filtros
  const [viewMode, setViewMode] = useState<"KANBAN" | "TABLE">("KANBAN");
  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    priority: "ALL",
    userId: "ALL",
    dueDate: "ALL",
  });

  // Modales
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<
    string | undefined
  >();
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isEditBoardOpen, setIsEditBoardOpen] = useState(false);

  const activeTask = selectedTaskId
    ? initialBoard.columns
        .flatMap((c) => c.tasks)
        .find((t) => t.id === selectedTaskId) || null
    : null;

  const handleOpenDetail = (task: KanbanTask) => {
    setSelectedTaskId(task.id);
    setIsDetailOpen(true);
  };

  const handleQuickAddTask = (columnId: string) => {
    setCreateTaskColumnId(columnId);
    setIsCreateTaskOpen(true);
  };

  const handleSelectBoard = (boardId: string) => {
    router.push(`/admin/tareas?boardId=${boardId}`);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <WorkspaceHeader
        boards={boards}
        activeBoard={initialBoard}
        teamMembers={teamMembers}
        currentUserId={currentUserId}
        userRole={userRole}
        filters={filters}
        onFilterChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSelectBoard={handleSelectBoard}
        onOpenCreateTask={() => {
          setCreateTaskColumnId(undefined);
          setIsCreateTaskOpen(true);
        }}
        onOpenCreateBoard={() => setIsCreateBoardOpen(true)}
        onOpenEditBoard={() => setIsEditBoardOpen(true)}
      />

      {/* Contenedor Principal: Tablero Kanban o Vista Lista */}
      <div className="flex-1 min-h-0">
        {viewMode === "KANBAN" ? (
          <KanbanBoard
            board={initialBoard}
            teamMembers={teamMembers}
            currentUserId={currentUserId}
            userRole={userRole}
            filters={filters}
            onOpenDetail={handleOpenDetail}
            onQuickAddTask={handleQuickAddTask}
          />
        ) : (
          <TasksTableView
            columns={initialBoard.columns}
            filters={filters}
            currentUserId={currentUserId}
            onOpenDetail={handleOpenDetail}
          />
        )}
      </div>

      {/* Diálogo Detalle & Comentarios & Recursos */}
      {activeTask && (
        <TaskDetailDialog
          key={activeTask.id}
          task={activeTask}
          columns={initialBoard.columns}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
          userRole={userRole}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedTaskId(null);
          }}
          onTaskUpdated={handleRefresh}
        />
      )}

      {/* Diálogo Crear Tarea */}
      <TaskCreateDialog
        boardId={initialBoard.id}
        columns={initialBoard.columns}
        defaultColumnId={createTaskColumnId}
        teamMembers={teamMembers}
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={handleRefresh}
      />

      {/* Diálogo Crear Tablero */}
      <BoardFormDialog
        mode="create"
        isOpen={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
        onBoardSaved={(newId) => {
          router.push(`/admin/tareas?boardId=${newId}`);
          handleRefresh();
        }}
      />

      {/* Diálogo Editar / Configurar Tablero y Fases */}
      <BoardFormDialog
        mode="edit"
        initialBoard={initialBoard}
        isOpen={isEditBoardOpen}
        onClose={() => setIsEditBoardOpen(false)}
        onBoardSaved={() => {
          handleRefresh();
        }}
        onBoardDeleted={() => {
          router.push("/admin/tareas");
        }}
      />
    </div>
  );
}
