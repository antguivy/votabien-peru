import { prisma } from "@/lib/prisma";
import {
  KanbanBoard,
  BoardSummary,
  TeamMember,
  KanbanTask,
  ProjectArea,
  PriorityLevel,
  SharedResource,
  ChecklistItem,
  AssignmentStatus,
} from "./types";

export async function getBoardsSummary(): Promise<BoardSummary[]> {
  // Asegurar boards predeterminados si no existen
  await ensureDefaultBoards();

  const boards = await prisma.project_board.findMany({
    include: {
      columns: {
        select: {
          id: true,
          is_completed: true,
          _count: {
            select: { tasks: true },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          column_id: true,
        },
      },
    },
    orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
  });

  return boards.map((b) => {
    const completedColumnIds = new Set(
      b.columns.filter((c) => c.is_completed).map((c) => c.id),
    );
    const completedCount = b.tasks.filter((t) =>
      completedColumnIds.has(t.column_id),
    ).length;

    return {
      id: b.id,
      title: b.title,
      description: b.description,
      icon: b.icon,
      color: b.color,
      area: b.area as ProjectArea,
      is_default: b.is_default,
      task_count: b.tasks.length,
      completed_count: completedCount,
    };
  });
}

export async function getBoardWithDetails(
  boardId?: string,
): Promise<KanbanBoard | null> {
  await ensureDefaultBoards();

  let targetBoardId = boardId;

  if (!targetBoardId) {
    const defaultBoard = await prisma.project_board.findFirst({
      where: { is_default: true },
      select: { id: true },
    });
    targetBoardId = defaultBoard?.id;
  }

  if (!targetBoardId) {
    const firstBoard = await prisma.project_board.findFirst({
      orderBy: { created_at: "asc" },
      select: { id: true },
    });
    targetBoardId = firstBoard?.id;
  }

  if (!targetBoardId) return null;

  const board = await prisma.project_board.findUnique({
    where: { id: targetBoardId },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: {
              assignments: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                      role: true,
                    },
                  },
                },
              },
              comments: {
                orderBy: { created_at: "asc" },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                      role: true,
                    },
                  },
                },
              },
              activities: {
                orderBy: { created_at: "desc" },
                take: 20,
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!board) return null;

  return {
    id: board.id,
    title: board.title,
    description: board.description,
    icon: board.icon,
    color: board.color,
    area: board.area as ProjectArea,
    is_default: board.is_default,
    created_by_id: board.created_by_id,
    created_at: board.created_at.toISOString(),
    updated_at: board.updated_at.toISOString(),
    columns: board.columns.map((c) => ({
      id: c.id,
      board_id: c.board_id,
      title: c.title,
      position: c.position,
      color: c.color,
      is_completed: c.is_completed,
      tasks: c.tasks.map(
        (t): KanbanTask => ({
          id: t.id,
          board_id: t.board_id,
          column_id: t.column_id,
          title: t.title,
          description: t.description,
          priority: t.priority as PriorityLevel,
          position: t.position,
          due_date: t.due_date ? t.due_date.toISOString() : null,
          tags: t.tags || [],
          created_by_id: t.created_by_id,
          resources: Array.isArray(t.resources)
            ? (t.resources as unknown as SharedResource[])
            : [],
          checklist: Array.isArray(t.checklist)
            ? (t.checklist as unknown as ChecklistItem[])
            : [],
          completed_at: t.completed_at ? t.completed_at.toISOString() : null,
          created_at: t.created_at.toISOString(),
          updated_at: t.updated_at.toISOString(),
          assignments: t.assignments.map((a) => ({
            id: a.id,
            task_id: a.task_id,
            user_id: a.user_id,
            status: a.status as AssignmentStatus,
            notes: a.notes,
            completed_at: a.completed_at ? a.completed_at.toISOString() : null,
            user: a.user,
          })),
          comments: t.comments.map((cm) => ({
            id: cm.id,
            task_id: cm.task_id,
            user_id: cm.user_id,
            content: cm.content,
            created_at: cm.created_at.toISOString(),
            user: cm.user,
          })),
          activities: t.activities.map((ac) => ({
            id: ac.id,
            task_id: ac.task_id,
            user_id: ac.user_id,
            action: ac.action,
            details: ac.details as Record<string, unknown> | null,
            created_at: ac.created_at.toISOString(),
            user: ac.user,
          })),
        }),
      ),
    })),
  };
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["volunteer", "lead", "editor", "admin", "super_admin"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  return users;
}

export async function ensureDefaultBoards() {
  const count = await prisma.project_board.count();
  if (count > 0) return;

  // 1. Tablero de Investigación Electoral
  await prisma.project_board.create({
    data: {
      title: "Investigación Electoral",
      description:
        "Recopilación y verificación de hojas de vida, antecedentes y propuestas por departamentos.",
      icon: "Search",
      color: "blue",
      area: "INVESTIGACION",
      is_default: true,
      columns: {
        create: [
          { title: "Por Iniciar", position: 0, color: "slate" },
          { title: "En Recopilación", position: 1, color: "blue" },
          { title: "En Verificación / Filtro", position: 2, color: "amber" },
          {
            title: "Aprobado / Publicable",
            position: 3,
            color: "emerald",
            is_completed: true,
          },
        ],
      },
    },
  });

  // 2. Tablero de Contenido y Redes
  await prisma.project_board.create({
    data: {
      title: "Contenido & Redes Sociales",
      description:
        "Pipeline creativo de guiones, producción audiovisual y publicaciones oficiales.",
      icon: "Video",
      color: "purple",
      area: "CONTENIDO",
      columns: {
        create: [
          { title: "Ideas & Temas", position: 0, color: "slate" },
          { title: "Guion en Redacción", position: 1, color: "indigo" },
          { title: "Revisión Coordinación", position: 2, color: "amber" },
          { title: "Grabación / Diseño", position: 3, color: "pink" },
          { title: "Edición Final", position: 4, color: "cyan" },
          {
            title: "Publicado",
            position: 5,
            color: "emerald",
            is_completed: true,
          },
        ],
      },
    },
  });

  // 3. Tablero de Convocatoria y Voluntarios
  await prisma.project_board.create({
    data: {
      title: "Convocatoria & Voluntarios",
      description:
        "Gestión de postulaciones, filtros por correo, inducción y asignación a comités.",
      icon: "UserCheck",
      color: "emerald",
      area: "RECLUTAMIENTO",
      columns: {
        create: [
          { title: "Postulantes Nuevos", position: 0, color: "slate" },
          { title: "Email Filtro Enviado", position: 1, color: "sky" },
          { title: "Confirmados para Inducción", position: 2, color: "amber" },
          {
            title: "Capacitados / Asignados",
            position: 3,
            color: "emerald",
            is_completed: true,
          },
        ],
      },
    },
  });
}
