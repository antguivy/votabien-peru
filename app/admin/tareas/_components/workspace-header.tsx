import React, { useState } from "react";
import {
  BoardSummary,
  KanbanBoard,
  TeamMember,
  TaskFilters,
  PriorityLevel,
  ProjectArea,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza";
import {
  CheckCircle2,
  Clock,
  Code,
  FolderKanban,
  Kanban,
  LayoutList,
  Plus,
  Scale,
  Search,
  Settings,
  SlidersHorizontal,
  UserCheck,
  Users,
  Video,
  X,
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
  onOpenEditBoard?: () => void;
}

function getBoardAreaIcon(area: ProjectArea) {
  switch (area) {
    case "INVESTIGACION":
      return <Search className="h-4 w-4 text-blue-500 shrink-0" />;
    case "CONTENIDO":
      return <Video className="h-4 w-4 text-purple-500 shrink-0" />;
    case "RECLUTAMIENTO":
      return <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />;
    case "LEGAL":
      return <Scale className="h-4 w-4 text-amber-500 shrink-0" />;
    case "DESARROLLO":
      return <Code className="h-4 w-4 text-cyan-500 shrink-0" />;
    default:
      return <FolderKanban className="h-4 w-4 text-primary shrink-0" />;
  }
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
  onOpenEditBoard,
}: WorkspaceHeaderProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Progreso global
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

  // Conteo de filtros activos
  let activeFilterCount = 0;
  if (filters.priority && filters.priority !== "ALL") activeFilterCount++;
  if (filters.userId && filters.userId !== "ALL") activeFilterCount++;
  if (filters.dueDate && filters.dueDate !== "ALL") activeFilterCount++;
  if (filters.search?.trim()) activeFilterCount++;

  const isAnyFilterActive = activeFilterCount > 0;

  const handleResetFilters = () => {
    onFilterChange({
      search: "",
      priority: "ALL",
      userId: "ALL",
      dueDate: "ALL",
    });
  };

  const selectedMember = teamMembers.find((m) => m.id === filters.userId);

  return (
    <div className="space-y-2.5 pb-2.5 border-b">
      {/* Fila 1: Tablero Activo + Métricas + Selector de Vista + Botones (RBAC) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Selector de Tablero Compacto (Sin icono gigante desperdiciador) */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 p-1 px-2 rounded-xl bg-secondary/50 border min-w-0">
            {getBoardAreaIcon(activeBoard.area)}

            <Select value={activeBoard.id} onValueChange={onSelectBoard}>
              <SelectTrigger className="h-7 font-bold text-sm sm:text-base border-none shadow-none px-1 gap-1 focus:ring-0 truncate max-w-[200px] sm:max-w-[260px]">
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
              className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 hidden md:inline-flex"
            >
              {activeBoard.area}
            </Badge>
          </div>

          {/* Botón de Ajustes/Edición del Tablero (Solo Leads y Admins) */}
          {isLeaderOrAdmin && onOpenEditBoard && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenEditBoard}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              title="Configurar fases y propiedades del tablero"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Bloque Derecho: Progreso, Switcher de Vista y Botones de Acción */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end">
          {/* Métrica de Progreso Compacta */}
          <div className="flex items-center gap-2 bg-secondary/30 px-2.5 py-1 rounded-lg border text-xs shrink-0">
            <span className="font-bold text-foreground text-xs">
              {progressPercent}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({completedTasks}/{totalTasks})
            </span>
            <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden border border-border/40">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Selector de Vista: Kanban vs Lista */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 shrink-0">
            <Button
              variant={viewMode === "KANBAN" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("KANBAN")}
              className={cn(
                "h-6 px-2 text-xs gap-1 rounded-md cursor-pointer",
                viewMode === "KANBAN" &&
                  "bg-background shadow-2xs font-semibold",
              )}
            >
              <Kanban className="h-3 w-3" />
              <span className="hidden sm:inline">Tablero</span>
            </Button>
            <Button
              variant={viewMode === "TABLE" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("TABLE")}
              className={cn(
                "h-6 px-2 text-xs gap-1 rounded-md cursor-pointer",
                viewMode === "TABLE" &&
                  "bg-background shadow-2xs font-semibold",
              )}
            >
              <LayoutList className="h-3 w-3" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
          </div>

          {/* Botones de Creación (Solo visibles para Líderes / Admins, NUNCA para voluntarios) */}
          {isLeaderOrAdmin && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCreateBoard}
                className="h-7 text-xs gap-1 px-2.5 rounded-lg cursor-pointer hidden md:inline-flex"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tablero</span>
              </Button>

              <Button
                size="sm"
                onClick={onOpenCreateTask}
                className="h-7 text-xs gap-1 px-2.5 font-semibold rounded-lg cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nueva Tarea</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Fila 2: Barra de Búsqueda y Filtros Mobile-First */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Buscador de texto fluido con botón limpiar */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o etiqueta..."
            value={filters.search || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="h-8 pl-8 pr-7 text-xs rounded-xl bg-background/80"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: "" })}
              className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Botón rápido "Mis Tareas" (Sin ícono de IA, con UserCheck profesional) */}
          <Button
            variant={filters.userId === "MINE" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onFilterChange({
                ...filters,
                userId: filters.userId === "MINE" ? "ALL" : "MINE",
              })
            }
            className={cn(
              "h-8 text-xs gap-1.5 rounded-xl px-3 cursor-pointer transition-all shrink-0",
              filters.userId === "MINE"
                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                : "hover:bg-secondary",
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Mis Tareas</span>
          </Button>

          {/* Botón principal de Filtros (Abre Drawer / Bottom Sheet en Móvil) */}
          <Button
            variant={
              isAnyFilterActive && filters.userId !== "MINE"
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={cn(
              "h-8 text-xs gap-1.5 rounded-xl px-3 cursor-pointer transition-all shrink-0",
              isAnyFilterActive && filters.userId !== "MINE"
                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                : "hover:bg-secondary",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "h-4 px-1.5 text-[9px] font-bold rounded-full ml-0.5",
                  isAnyFilterActive && filters.userId !== "MINE"
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Fila 3: Chips de Filtros Activos (Fácil de deseleccionar con 1 toque) */}
      {isAnyFilterActive && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mr-0.5">
            Filtros:
          </span>

          {filters.search && (
            <Badge
              variant="secondary"
              className="text-[10px] gap-1 pl-2 pr-1 py-0.5 rounded-lg border bg-card"
            >
              <span>Texto: &quot;{filters.search}&quot;</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, search: "" })}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.userId === "MINE" && (
            <Badge
              variant="secondary"
              className="text-[10px] gap-1 pl-2 pr-1 py-0.5 rounded-lg border bg-primary/10 text-primary border-primary/30"
            >
              <span>Mis Tareas</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, userId: "ALL" })}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.userId &&
            filters.userId !== "ALL" &&
            filters.userId !== "MINE" &&
            selectedMember && (
              <Badge
                variant="secondary"
                className="text-[10px] gap-1 pl-2 pr-1 py-0.5 rounded-lg border bg-card"
              >
                <span>Asignado: {selectedMember.name}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, userId: "ALL" })}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

          {filters.priority && filters.priority !== "ALL" && (
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] gap-1 pl-2 pr-1 py-0.5 rounded-lg border",
                filters.priority === "URGENTE" &&
                  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900",
                filters.priority === "ALTA" &&
                  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
                filters.priority === "MEDIA" &&
                  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
                filters.priority === "BAJA" &&
                  "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
              )}
            >
              <span>Prioridad: {filters.priority}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, priority: "ALL" })}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.dueDate === "OVERDUE" && (
            <Badge
              variant="secondary"
              className="text-[10px] gap-1 pl-2 pr-1 py-0.5 rounded-lg border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900"
            >
              <span>Vencidas</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, dueDate: "ALL" })}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer ml-1"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* DRAWER / MODAL DE FILTROS MOBILE-FIRST */}
      <Credenza open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <CredenzaContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border bg-background shadow-2xl flex flex-col max-h-[85dvh]">
          <CredenzaHeader className="px-5 py-3.5 border-b bg-muted/30 flex flex-row items-center justify-between shrink-0">
            <div>
              <CredenzaTitle className="text-base font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span>Filtros de Tareas</span>
              </CredenzaTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Refina las tareas mostradas en el tablero o lista.
              </p>
            </div>
            {isAnyFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                Restablecer
              </Button>
            )}
          </CredenzaHeader>

          <CredenzaBody className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
            {/* Sección 1: Prioridad */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">
                Nivel de Prioridad
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { value: "ALL", label: "Cualquiera", color: "bg-muted" },
                  {
                    value: "URGENTE",
                    label: "Urgente",
                    dot: "bg-rose-500",
                    active: "bg-rose-500 text-white border-rose-600",
                  },
                  {
                    value: "ALTA",
                    label: "Alta",
                    dot: "bg-amber-500",
                    active: "bg-amber-500 text-white border-amber-600",
                  },
                  {
                    value: "MEDIA",
                    label: "Media",
                    dot: "bg-blue-500",
                    active: "bg-blue-500 text-white border-blue-600",
                  },
                  {
                    value: "BAJA",
                    label: "Baja",
                    dot: "bg-slate-400",
                    active: "bg-slate-600 text-white border-slate-700",
                  },
                ].map((p) => {
                  const isSelected = (filters.priority || "ALL") === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() =>
                        onFilterChange({
                          ...filters,
                          priority: p.value as PriorityLevel | "ALL",
                        })
                      }
                      className={cn(
                        "flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                        isSelected
                          ? p.active ||
                              "bg-primary text-primary-foreground font-semibold border-primary shadow-2xs"
                          : "bg-card hover:bg-secondary border-border/60 text-foreground",
                      )}
                    >
                      {p.dot && (
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            isSelected ? "bg-white" : p.dot,
                          )}
                        />
                      )}
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sección 2: Vencimiento y Estado */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">
                Estado de Entrega / Fecha
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, dueDate: "ALL" })}
                  className={cn(
                    "flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                    (filters.dueDate || "ALL") === "ALL"
                      ? "bg-primary text-primary-foreground font-semibold border-primary shadow-2xs"
                      : "bg-card hover:bg-secondary border-border/60 text-foreground",
                  )}
                >
                  <span>Todas las fechas</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      dueDate:
                        filters.dueDate === "OVERDUE" ? "ALL" : "OVERDUE",
                    })
                  }
                  className={cn(
                    "flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                    filters.dueDate === "OVERDUE"
                      ? "bg-rose-500 text-white font-semibold border-rose-600 shadow-2xs"
                      : "bg-card hover:bg-secondary border-border/60 text-foreground",
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Solo Vencidas</span>
                </button>
              </div>
            </div>

            {/* Sección 3: Asignado a Miembro del Equipo */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">
                Voluntario Asignado
              </label>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, userId: "ALL" })}
                  className={cn(
                    "flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                    (filters.userId || "ALL") === "ALL"
                      ? "bg-primary text-primary-foreground font-semibold border-primary shadow-2xs"
                      : "bg-card hover:bg-secondary border-border/60 text-foreground",
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Todos</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      userId: filters.userId === "MINE" ? "ALL" : "MINE",
                    })
                  }
                  className={cn(
                    "flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                    filters.userId === "MINE"
                      ? "bg-primary text-primary-foreground font-semibold border-primary shadow-2xs"
                      : "bg-card hover:bg-secondary border-border/60 text-foreground",
                  )}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Mis Tareas</span>
                </button>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto pr-1 border rounded-xl p-1.5 bg-background/50">
                {teamMembers.map((member) => {
                  const isSelected = filters.userId === member.id;
                  return (
                    <div
                      key={member.id}
                      onClick={() =>
                        onFilterChange({
                          ...filters,
                          userId: isSelected ? "ALL" : member.id,
                        })
                      }
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg border text-xs transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary/40 font-semibold text-foreground"
                          : "hover:bg-muted/50 border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage src={member.image || ""} />
                          <AvatarFallback className="text-[9px]">
                            {member.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-xs">{member.name}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CredenzaBody>

          <CredenzaFooter className="px-5 py-3 border-t bg-muted/20 shrink-0">
            <Button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="w-full text-xs font-semibold h-9 cursor-pointer"
            >
              Aplicar Filtros{" "}
              {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}
