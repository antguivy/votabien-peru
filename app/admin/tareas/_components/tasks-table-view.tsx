"use client";

import React from "react";
import { KanbanTask, KanbanColumn, TaskFilters } from "../_lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  CheckSquare,
  Clock,
  ExternalLink,
  FileText,
  Figma,
  FolderArchive,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TasksTableViewProps {
  columns: KanbanColumn[];
  filters: TaskFilters;
  currentUserId?: string;
  onOpenDetail: (task: KanbanTask) => void;
}

export function TasksTableView({
  columns,
  filters,
  currentUserId,
  onOpenDetail,
}: TasksTableViewProps) {
  // Aplanar tareas de todas las columnas
  let allTasks = columns.flatMap((col) =>
    col.tasks.map((t) => ({ ...t, column_title: col.title })),
  );

  // Aplicar filtros
  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase();
    allTasks = allTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );
  }

  if (filters.priority && filters.priority !== "ALL") {
    allTasks = allTasks.filter((t) => t.priority === filters.priority);
  }

  if (filters.userId === "MINE" && currentUserId) {
    allTasks = allTasks.filter((t) =>
      t.assignments?.some((a) => a.user_id === currentUserId),
    );
  } else if (filters.userId && filters.userId !== "ALL") {
    allTasks = allTasks.filter((t) =>
      t.assignments?.some((a) => a.user_id === filters.userId),
    );
  }

  if (filters.dueDate === "OVERDUE") {
    const now = new Date();
    allTasks = allTasks.filter(
      (t) => t.due_date && !t.completed_at && new Date(t.due_date) < now,
    );
  }

  return (
    <div className="w-full rounded-2xl border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="text-xs font-bold">Tarea / Tema</TableHead>
            <TableHead className="text-xs font-bold">Fase / Estado</TableHead>
            <TableHead className="text-xs font-bold">Prioridad</TableHead>
            <TableHead className="text-xs font-bold">
              Voluntarios Asignados
            </TableHead>
            <TableHead className="text-xs font-bold">Recursos</TableHead>
            <TableHead className="text-xs font-bold">Checklist</TableHead>
            <TableHead className="text-xs font-bold">Fecha Límite</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTasks.map((task) => {
            const isAssignedToMe = task.assignments?.some(
              (a) => a.user_id === currentUserId,
            );
            const totalAssigned = task.assignments?.length || 0;
            const completedAssigned =
              task.assignments?.filter((a) => a.status === "COMPLETED")
                .length || 0;

            const totalCheck = task.checklist?.length || 0;
            const completedCheck =
              task.checklist?.filter((c) => c.completed).length || 0;

            const isOverdue =
              task.due_date &&
              !task.completed_at &&
              new Date(task.due_date) < new Date();

            return (
              <TableRow
                key={task.id}
                onClick={() => onOpenDetail(task)}
                className="cursor-pointer hover:bg-muted/60 transition-colors"
              >
                {/* Título */}
                <TableCell className="font-medium text-xs sm:text-sm max-w-[280px]">
                  <div className="flex items-center gap-2">
                    {isAssignedToMe && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <span className="truncate">{task.title}</span>
                  </div>
                </TableCell>

                {/* Columna */}
                <TableCell>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {task.column_title}
                  </Badge>
                </TableCell>

                {/* Prioridad */}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] uppercase font-semibold",
                      task.priority === "URGENTE" &&
                        "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
                      task.priority === "ALTA" &&
                        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
                      task.priority === "MEDIA" &&
                        "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
                      task.priority === "BAJA" &&
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
                    )}
                  >
                    {task.priority}
                  </Badge>
                </TableCell>

                {/* Asignados */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {task.assignments?.map((asg) => (
                        <Avatar
                          key={asg.id}
                          className="h-6 w-6 border-2 border-background"
                          title={`${asg.user.name} (${asg.status})`}
                        >
                          <AvatarImage src={asg.user.image || ""} />
                          <AvatarFallback className="text-[9px]">
                            {asg.user.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {totalAssigned > 0 && (
                      <span className="text-[11px] text-muted-foreground font-medium">
                        ({completedAssigned}/{totalAssigned})
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Recursos */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    {task.resources?.slice(0, 2).map((r) => (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title={r.title}
                      >
                        {r.type === "drive" && (
                          <FolderArchive className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        {r.type === "doc" && (
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                        )}
                        {r.type === "figma" && (
                          <Figma className="h-3.5 w-3.5 text-purple-500" />
                        )}
                        {r.type === "meet" && (
                          <Video className="h-3.5 w-3.5 text-rose-500" />
                        )}
                        {r.type === "link" && (
                          <ExternalLink className="h-3.5 w-3.5" />
                        )}
                      </a>
                    ))}
                    {task.resources && task.resources.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{task.resources.length - 2}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Checklist */}
                <TableCell>
                  {totalCheck > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckSquare className="h-3.5 w-3.5" />
                      <span>
                        {completedCheck}/{totalCheck}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>

                {/* Fecha */}
                <TableCell>
                  {task.due_date ? (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        isOverdue
                          ? "text-rose-500 font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {isOverdue ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {new Date(task.due_date).toLocaleDateString("es-PE", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}

          {allTasks.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-28 text-center text-xs text-muted-foreground"
              >
                No hay tareas que coincidan con los filtros aplicados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
