"use client";

import React from "react";
import {
  BoardSummary,
  KanbanBoard,
  TeamMember,
  TaskFilters,
  PriorityLevel,
} from "../_lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Kanban,
  LayoutList,
  Plus,
  Search,
  UserCheck,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceHeaderProps {
  boards: BoardSummary[];
  activeBoard: KanbanBoard;
  teamMembers: TeamMember[];
  currentUserId?: string;
  userRole?: string;
  filters: TaskFilters;
  onFilterChange: (filters: TaskFilters) => void;
  viewMode: "KANBAN" | "TABLE";
  onViewModeChange: (mode: "KANBAN" | "TABLE") => void;
  onSelectBoard: (boardId: string) => void;
  onOpenCreateTask: () => void;
  onOpenCreateBoard: () => void;
}

export function WorkspaceHeader({
  boards,
  activeBoard,
  teamMembers,
  currentUserId: _currentUserId,
  userRole,
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onSelectBoard,
  onOpenCreateTask,
  onOpenCreateBoard,
}: WorkspaceHeaderProps) {
  // Cálculo de progreso global del tablero activo
  const totalTasks = activeBoard.columns.reduce(
    (acc, c) => acc + c.tasks.length,
    0,
  );
  const completedTasks = activeBoard.columns
    .filter((c) => c.is_completed)
    .reduce((acc, c) => acc + c.tasks.length, 0);

  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isLeaderOrAdmin = ["admin", "super_admin", "lead", "editor"].includes(
    userRole || "",
  );

  return (
    <div className="space-y-4 pb-4 border-b">
      {/* Fila 1: Selector de Tableros, Progreso Global y Botones de Acción */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Selector de Tablero */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {activeBoard.area === "CONTENIDO" ? (
              <Video className="h-6 w-6" />
            ) : activeBoard.area === "RECLUTAMIENTO" ? (
              <UserCheck className="h-6 w-6" />
            ) : (
              <FolderKanban className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Select value={activeBoard.id} onValueChange={onSelectBoard}>
                <SelectTrigger className="h-8 font-bold text-base border-none shadow-none px-1 gap-2 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-64">
                  {boards.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium truncate">{b.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {b.completed_count}/{b.task_count}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge
                variant="outline"
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
              >
                {activeBoard.area}
              </Badge>
            </div>

            {activeBoard.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-lg">
                {activeBoard.description}
              </p>
            )}
          </div>
        </div>

        {/* Barra de Progreso Global del Tablero & Botones */}
        <div className="flex items-center gap-4 flex-wrap justify-between lg:justify-end">
          {/* Métricas de Avance */}
          <div className="flex items-center gap-3 bg-secondary/30 px-3 py-1.5 rounded-xl border">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Avance General
              </span>
              <span className="text-xs font-semibold text-foreground">
                {completedTasks} de {totalTasks} ({progressPercent}%)
              </span>
            </div>
            <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden border border-border/40">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Selector de Vista: Kanban vs Lista */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50">
            <Button
              variant={viewMode === "KANBAN" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("KANBAN")}
              className={cn(
                "h-7 px-2.5 text-xs gap-1.5 rounded-lg",
                viewMode === "KANBAN" &&
                  "bg-background shadow-xs font-semibold",
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              Tablero
            </Button>
            <Button
              variant={viewMode === "TABLE" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("TABLE")}
              className={cn(
                "h-7 px-2.5 text-xs gap-1.5 rounded-lg",
                viewMode === "TABLE" && "bg-background shadow-xs font-semibold",
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Lista
            </Button>
          </div>

          {/* Botones de creación */}
          <div className="flex items-center gap-2">
            {isLeaderOrAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenCreateBoard}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nuevo Tablero
                </Button>

                <Button
                  size="sm"
                  onClick={onOpenCreateTask}
                  className="h-8 text-xs gap-1.5 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Tarea
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fila 2: Filtros Reactivos (Mis tareas, Búsqueda, Prioridad, Asignado) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón rápido "Mis Tareas" */}
          <Button
            variant={filters.userId === "MINE" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onFilterChange({
                ...filters,
                userId: filters.userId === "MINE" ? "ALL" : "MINE",
              })
            }
            className="h-8 text-xs gap-1.5 rounded-full"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Mis Tareas
          </Button>

          {/* Filtro por Asignado */}
          <Select
            value={filters.userId || "ALL"}
            onValueChange={(val) => onFilterChange({ ...filters, userId: val })}
          >
            <SelectTrigger className="h-8 text-xs w-[140px] rounded-full">
              <SelectValue placeholder="Asignado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los asignados</SelectItem>
              <SelectItem value="MINE">Solo las mías</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por Prioridad */}
          <Select
            value={filters.priority || "ALL"}
            onValueChange={(val) =>
              onFilterChange({
                ...filters,
                priority: val as PriorityLevel | "ALL",
              })
            }
          >
            <SelectTrigger className="h-8 text-xs w-[120px] rounded-full">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Cualquier prioridad</SelectItem>
              <SelectItem value="URGENTE">Urgente</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="MEDIA">Media</SelectItem>
              <SelectItem value="BAJA">Baja</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por Fecha de Vencimiento */}
          <Select
            value={filters.dueDate || "ALL"}
            onValueChange={(val) =>
              onFilterChange({
                ...filters,
                dueDate: val as "OVERDUE" | "TODAY" | "THIS_WEEK" | "ALL",
              })
            }
          >
            <SelectTrigger className="h-8 text-xs w-[120px] rounded-full">
              <SelectValue placeholder="Fechas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las fechas</SelectItem>
              <SelectItem value="OVERDUE">Vencidas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Buscador de texto */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarea o tag..."
            value={filters.search || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="h-8 pl-8 text-xs rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
