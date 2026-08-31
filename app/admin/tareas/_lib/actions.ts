"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { serverGetUser } from "@/lib/auth-actions";
import {
  PriorityLevel,
  ProjectArea,
  AssignmentStatus,
  SharedResource,
  ChecklistItem,
} from "./types";
import { toJsonInsert } from "@/lib/utils/text";

// Helper de autenticación y rol mínimo (volunteer en adelante)
async function requireAuthUser() {
  const { user } = await serverGetUser();
  if (!user || user.role === "user") {
    throw new Error("No tienes autorización para realizar esta acción");
  }
  return user;
}

export async function moveTask(
  taskId: string,
  toColumnId: string,
  targetIndex: number,
) {
  const user = await requireAuthUser();

  await prisma.$transaction(async (tx) => {
    const task = await tx.project_task.findUnique({
      where: { id: taskId },
      include: { assignments: true },
    });

    if (!task) throw new Error("Tarea no encontrada");

    const toColumn = await tx.project_column.findUnique({
      where: { id: toColumnId },
    });

    if (!toColumn) throw new Error("Columna de destino no encontrada");

    const fromColumnId = task.column_id;
    const oldPosition = task.position;

    if (fromColumnId === toColumnId) {
      if (oldPosition === targetIndex) return;

      if (oldPosition < targetIndex) {
        // Mover hacia abajo: restar 1 a los que estaban entre oldPosition y targetIndex
        await tx.project_task.updateMany({
          where: {
            column_id: fromColumnId,
            position: {
              gt: oldPosition,
              lte: targetIndex,
            },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else {
        // Mover hacia arriba: sumar 1 a los que estaban entre targetIndex y oldPosition
        await tx.project_task.updateMany({
          where: {
            column_id: fromColumnId,
            position: {
              gte: targetIndex,
              lt: oldPosition,
            },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }

      await tx.project_task.update({
        where: { id: taskId },
        data: { position: targetIndex },
      });
    } else {
      // Mover a otra columna
      // 1. Cerrar hueco en columna origen
      await tx.project_task.updateMany({
        where: {
          column_id: fromColumnId,
          position: { gt: oldPosition },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // 2. Abrir hueco en columna destino
      await tx.project_task.updateMany({
        where: {
          column_id: toColumnId,
          position: { gte: targetIndex },
        },
        data: {
          position: { increment: 1 },
        },
      });

      // 3. Actualizar la tarea
      await tx.project_task.update({
        where: { id: taskId },
        data: {
          column_id: toColumnId,
          position: targetIndex,
          completed_at: toColumn.is_completed ? new Date() : null,
        },
      });

      // Registrar auditoría
      await tx.project_task_activity.create({
        data: {
          task_id: taskId,
          user_id: user.id,
          action: "MOVED_COLUMN",
          details: {
            to_column_title: toColumn.title,
            is_completed: toColumn.is_completed,
          },
        },
      });
    }
  });

  revalidatePath("/admin/tareas");
  return { success: true };
}

export async function createTask(data: {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: PriorityLevel;
  dueDate?: string | null;
  tags?: string[];
  assignedUserIds?: string[];
  resources?: SharedResource[];
  checklist?: ChecklistItem[];
}) {
  const user = await requireAuthUser();
  const canManage = ["lead", "editor", "admin", "super_admin"].includes(
    user.role,
  );
  if (!canManage) {
    throw new Error(
      "Solo los líderes de área y administradores pueden crear tareas.",
    );
  }

  const task = await prisma.$transaction(async (tx) => {
    // Calcular siguiente posición
    const lastTask = await tx.project_task.findFirst({
      where: { column_id: data.columnId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const nextPosition = lastTask ? lastTask.position + 1 : 0;

    const newTask = await tx.project_task.create({
      data: {
        board_id: data.boardId,
        column_id: data.columnId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority || "MEDIA",
        position: nextPosition,
        due_date: data.dueDate ? new Date(data.dueDate) : null,
        tags: data.tags || [],
        created_by_id: user.id,
        resources: toJsonInsert(data.resources),
        checklist: toJsonInsert(data.checklist),
        assignments: {
          create: (data.assignedUserIds || []).map((uid) => ({
            user_id: uid,
            status: "PENDING",
          })),
        },
      },
    });

    await tx.project_task_activity.create({
      data: {
        task_id: newTask.id,
        user_id: user.id,
        action: "CREATED",
        details: { title: newTask.title },
      },
    });

    return newTask;
  });

  revalidatePath("/admin/tareas");
  return { success: true, taskId: task.id };
}

export async function updateTask(data: {
  taskId: string;
  title: string;
  description?: string | null;
  priority: PriorityLevel;
  dueDate?: string | null;
  tags?: string[];
  assignedUserIds?: string[];
  resources?: SharedResource[];
  checklist?: ChecklistItem[];
}) {
  const user = await requireAuthUser();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.project_task.findUnique({
      where: { id: data.taskId },
      include: { assignments: true },
    });

    if (!existing) throw new Error("Tarea no encontrada");

    // Sincronizar asignaciones
    const currentAssigneeIds = new Set(
      existing.assignments.map((a) => a.user_id),
    );
    const targetAssigneeIds = new Set(data.assignedUserIds || []);

    const toRemove = existing.assignments
      .filter((a) => !targetAssigneeIds.has(a.user_id))
      .map((a) => a.id);

    const toAdd = (data.assignedUserIds || []).filter(
      (uid) => !currentAssigneeIds.has(uid),
    );

    if (toRemove.length > 0) {
      await tx.project_task_assignment.deleteMany({
        where: { id: { in: toRemove } },
      });
    }

    if (toAdd.length > 0) {
      await tx.project_task_assignment.createMany({
        data: toAdd.map((uid) => ({
          task_id: data.taskId,
          user_id: uid,
          status: "PENDING",
        })),
      });
    }

    await tx.project_task.update({
      where: { id: data.taskId },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority,
        due_date: data.dueDate ? new Date(data.dueDate) : null,
        tags: data.tags || [],
        resources: toJsonInsert(data.resources),
        checklist: toJsonInsert(data.checklist),
      },
    });

    await tx.project_task_activity.create({
      data: {
        task_id: data.taskId,
        user_id: user.id,
        action: "UPDATED",
        details: { title: data.title },
      },
    });
  });

  revalidatePath("/admin/tareas");
  return { success: true };
}

export async function updateAssignmentStatus(
  taskId: string,
  status: AssignmentStatus,
  notes?: string,
  targetUserId?: string,
) {
  const user = await requireAuthUser();
  const isLeadOrAdmin = ["lead", "editor", "admin", "super_admin"].includes(
    user.role,
  );

  // Si se especifica otro usuario objetivo, verificar que el llamante sea Líder o Admin
  const effectiveUserId =
    targetUserId && targetUserId !== user.id
      ? isLeadOrAdmin
        ? targetUserId
        : user.id
      : user.id;

  await prisma.$transaction(async (tx) => {
    const assignment = await tx.project_task_assignment.findUnique({
      where: {
        task_id_user_id: {
          task_id: taskId,
          user_id: effectiveUserId,
        },
      },
    });

    if (!assignment) {
      throw new Error("El voluntario no está asignado a esta tarea.");
    }

    await tx.project_task_assignment.update({
      where: { id: assignment.id },
      data: {
        status,
        notes: notes || assignment.notes,
        completed_at: status === "COMPLETED" ? new Date() : null,
      },
    });

    await tx.project_task_activity.create({
      data: {
        task_id: taskId,
        user_id: user.id,
        action: "STATUS_CHANGED",
        details: {
          status,
          user_name: user.name,
          for_user_id: effectiveUserId,
          is_override: effectiveUserId !== user.id,
        },
      },
    });

    // Verificar si todos los miembros asignados completaron su parte
    const allAssignments = await tx.project_task_assignment.findMany({
      where: { task_id: taskId },
    });

    const allCompleted =
      allAssignments.length > 0 &&
      allAssignments.every((a) =>
        a.user_id === effectiveUserId
          ? status === "COMPLETED"
          : a.status === "COMPLETED",
      );

    if (allCompleted) {
      await tx.project_task_activity.create({
        data: {
          task_id: taskId,
          user_id: null,
          action: "ALL_ASSIGNMENTS_COMPLETED",
          details: {
            message: "Todos los voluntarios completaron su parte del paquete.",
          },
        },
      });
    }
  });

  revalidatePath("/admin/tareas");
  return { success: true };
}

export async function addComment(taskId: string, content: string) {
  const user = await requireAuthUser();

  if (!content.trim()) throw new Error("El comentario no puede estar vacío");

  const comment = await prisma.$transaction(async (tx) => {
    const newComment = await tx.project_task_comment.create({
      data: {
        task_id: taskId,
        user_id: user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    await tx.project_task_activity.create({
      data: {
        task_id: taskId,
        user_id: user.id,
        action: "COMMENTED",
        details: { preview: content.slice(0, 50) },
      },
    });

    return newComment;
  });

  revalidatePath("/admin/tareas");
  return { success: true, comment };
}

export async function deleteTask(taskId: string) {
  const user = await requireAuthUser();

  await prisma.$transaction(async (tx) => {
    const task = await tx.project_task.findUnique({
      where: { id: taskId },
    });

    if (!task) return;

    // Verificar permisos: admin, super_admin, o creador
    const isOwnerOrAdmin =
      ["admin", "super_admin", "lead", "editor"].includes(user.role) ||
      task.created_by_id === user.id;

    if (!isOwnerOrAdmin) {
      throw new Error("No tienes permisos para eliminar esta tarea");
    }

    await tx.project_task.delete({
      where: { id: taskId },
    });

    // Reordenar tareas restantes en la columna
    await tx.project_task.updateMany({
      where: {
        column_id: task.column_id,
        position: { gt: task.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });
  });

  revalidatePath("/admin/tareas");
  return { success: true };
}

export async function createBoard(data: {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  area: ProjectArea;
  columns?: string[];
}) {
  const user = await requireAuthUser();
  const canManage = ["lead", "editor", "admin", "super_admin"].includes(
    user.role,
  );
  if (!canManage) {
    throw new Error(
      "Solo los líderes de área y administradores pueden crear tableros.",
    );
  }

  const defaultCols =
    data.columns && data.columns.length > 0
      ? data.columns
      : ["Pendiente", "En Proceso", "Revisión", "Completado"];

  const board = await prisma.project_board.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      icon: data.icon || "FolderKanban",
      color: data.color || "indigo",
      area: data.area || "GENERAL",
      created_by_id: user.id,
      columns: {
        create: defaultCols.map((colName, index) => ({
          title: colName,
          position: index,
          is_completed: index === defaultCols.length - 1,
        })),
      },
    },
  });

  revalidatePath("/admin/tareas");
  return { success: true, boardId: board.id };
}
