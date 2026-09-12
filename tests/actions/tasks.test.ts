import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// PRINCIPAL ENGINEER TEST SUITE: PROJECT TASKS / KANBAN SERVER ACTIONS
// ============================================================================

// 1. Mocks de infraestructura de Next.js
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

let mockCurrentUser: {
  id: string;
  name: string;
  email: string;
  role: string;
} | null = {
  id: "usr_lead_1",
  name: "Lead Project",
  email: "lead@votabien.pe",
  role: "lead",
};

vi.mock("@/lib/auth-actions", () => ({
  serverGetUser: vi.fn(async () => ({ user: mockCurrentUser })),
}));

// 2. Stateful In-Memory Storage
interface MockTask {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: string;
  position: number;
  completed_at: Date | null;
  created_by_id: string;
  tags: string[];
  resources: unknown;
  checklist: unknown;
}

interface MockColumn {
  id: string;
  board_id: string;
  title: string;
  position: number;
  is_completed: boolean;
}

interface MockAssignment {
  id: string;
  task_id: string;
  user_id: string;
  status: string;
  notes: string | null;
  completed_at: Date | null;
}

interface MockActivity {
  id: string;
  task_id: string;
  user_id: string | null;
  action: string;
  details: unknown;
}

let dbTasks: Map<string, MockTask>;
let dbColumns: Map<string, MockColumn>;
let dbAssignments: MockAssignment[];
let dbActivities: MockActivity[];

vi.mock("@/lib/prisma", () => {
  const prismaInstance = {
    project_column: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const col = dbColumns.get(where.id);
        return col ? { ...col } : null;
      }),
    },
    project_task: {
      findUnique: vi.fn(
        async ({
          where,
          include,
        }: {
          where: { id: string };
          include?: { assignments?: boolean };
        }) => {
          const task = dbTasks.get(where.id);
          if (!task) return null;
          const res: Record<string, unknown> = { ...task };
          if (include?.assignments) {
            res.assignments = dbAssignments.filter(
              (a) => a.task_id === where.id,
            );
          }
          return JSON.parse(JSON.stringify(res));
        },
      ),
      findFirst: vi.fn(
        async ({
          where,
          orderBy,
        }: {
          where: { column_id: string };
          orderBy: { position: string };
        }) => {
          const tasksInCol = Array.from(dbTasks.values()).filter(
            (t) => t.column_id === where.column_id,
          );
          if (tasksInCol.length === 0) return null;
          tasksInCol.sort((a, b) =>
            orderBy.position === "desc"
              ? b.position - a.position
              : a.position - b.position,
          );
          return { ...tasksInCol[0] };
        },
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const id = `task_${Math.random().toString(36).substring(2, 9)}`;
        const task: MockTask = {
          id,
          board_id: data.board_id as string,
          column_id: data.column_id as string,
          title: data.title as string,
          description: (data.description as string) || null,
          priority: (data.priority as string) || "MEDIA",
          position: data.position as number,
          completed_at: (data.completed_at as Date) || null,
          created_by_id: data.created_by_id as string,
          tags: (data.tags as string[]) || [],
          resources: data.resources,
          checklist: data.checklist,
        };
        dbTasks.set(id, task);

        const assignmentsData = (
          data.assignments as {
            create?: Array<{ user_id: string; status: string }>;
          }
        )?.create;
        if (assignmentsData) {
          for (const a of assignmentsData) {
            dbAssignments.push({
              id: `asg_${Math.random().toString(36).substring(2, 9)}`,
              task_id: id,
              user_id: a.user_id,
              status: a.status,
              notes: null,
              completed_at: null,
            });
          }
        }
        return { ...task };
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockTask>;
        }) => {
          const task = dbTasks.get(where.id);
          if (!task) throw new Error(`Task ${where.id} not found`);
          const updated = { ...task, ...data };
          dbTasks.set(where.id, updated);
          return { ...updated };
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: {
            column_id: string;
            position?: { gt?: number; gte?: number; lt?: number; lte?: number };
          };
          data: { position?: { increment?: number; decrement?: number } };
        }) => {
          let count = 0;
          for (const task of dbTasks.values()) {
            if (task.column_id !== where.column_id) continue;
            const pos = task.position;
            let matches = true;
            if (where.position) {
              if (where.position.gt !== undefined && !(pos > where.position.gt))
                matches = false;
              if (
                where.position.gte !== undefined &&
                !(pos >= where.position.gte)
              )
                matches = false;
              if (where.position.lt !== undefined && !(pos < where.position.lt))
                matches = false;
              if (
                where.position.lte !== undefined &&
                !(pos <= where.position.lte)
              )
                matches = false;
            }
            if (matches) {
              if (data.position?.increment)
                task.position += data.position.increment;
              if (data.position?.decrement)
                task.position -= data.position.decrement;
              count++;
            }
          }
          return { count };
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        dbTasks.delete(where.id);
        dbAssignments = dbAssignments.filter((a) => a.task_id !== where.id);
        return { id: where.id };
      }),
    },
    project_task_assignment: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { task_id_user_id: { task_id: string; user_id: string } };
        }) => {
          const asg = dbAssignments.find(
            (a) =>
              a.task_id === where.task_id_user_id.task_id &&
              a.user_id === where.task_id_user_id.user_id,
          );
          return asg ? { ...asg } : null;
        },
      ),
      findMany: vi.fn(async ({ where }: { where: { task_id: string } }) => {
        return dbAssignments
          .filter((a) => a.task_id === where.task_id)
          .map((a) => ({ ...a }));
      }),
      createMany: vi.fn(
        async ({
          data,
        }: {
          data: Array<{ task_id: string; user_id: string; status: string }>;
        }) => {
          for (const d of data) {
            dbAssignments.push({
              id: `asg_${Math.random().toString(36).substring(2, 9)}`,
              task_id: d.task_id,
              user_id: d.user_id,
              status: d.status,
              notes: null,
              completed_at: null,
            });
          }
          return { count: data.length };
        },
      ),
      deleteMany: vi.fn(
        async ({ where }: { where: { id: { in: string[] } } }) => {
          const initLen = dbAssignments.length;
          dbAssignments = dbAssignments.filter(
            (a) => !where.id.in.includes(a.id),
          );
          return { count: initLen - dbAssignments.length };
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockAssignment>;
        }) => {
          const idx = dbAssignments.findIndex((a) => a.id === where.id);
          if (idx === -1) throw new Error("Assignment not found");
          dbAssignments[idx] = { ...dbAssignments[idx], ...data };
          return { ...dbAssignments[idx] };
        },
      ),
    },
    project_task_activity: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const act: MockActivity = {
          id: `act_${Math.random().toString(36).substring(2, 9)}`,
          task_id: data.task_id as string,
          user_id: (data.user_id as string) || null,
          action: data.action as string,
          details: data.details,
        };
        dbActivities.push(act);
        return act;
      }),
    },
    $transaction: vi.fn(
      async <T>(cb: (tx: unknown) => Promise<T>): Promise<T> => {
        return cb(prismaInstance);
      },
    ),
  };

  return { prisma: prismaInstance };
});

import {
  moveTask,
  createTask,
  updateTask,
  updateAssignmentStatus,
  deleteTask,
} from "@/app/admin/tareas/_lib/actions";

describe("Project Tasks Server Actions - Principal Engineer Invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbTasks = new Map();
    dbColumns = new Map();
    dbAssignments = [];
    dbActivities = [];

    // Columnas base
    dbColumns.set("col_todo", {
      id: "col_todo",
      board_id: "b_1",
      title: "Por Hacer",
      position: 0,
      is_completed: false,
    });
    dbColumns.set("col_done", {
      id: "col_done",
      board_id: "b_1",
      title: "Completado",
      position: 1,
      is_completed: true,
    });

    mockCurrentUser = {
      id: "usr_lead_1",
      name: "Coordinador",
      email: "coord@votabien.pe",
      role: "lead",
    };
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 1: Algoritmo de Re-indexación Matemática Intra-Columna
  // --------------------------------------------------------------------------
  it("INVARIANTE 1: Mover tarea hacia abajo reordena ordenadamente los elementos intermediarios", async () => {
    dbTasks.set("t0", {
      id: "t0",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T0",
      description: null,
      priority: "MEDIA",
      position: 0,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });
    dbTasks.set("t1", {
      id: "t1",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T1",
      description: null,
      priority: "MEDIA",
      position: 1,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });
    dbTasks.set("t2", {
      id: "t2",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T2",
      description: null,
      priority: "MEDIA",
      position: 2,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });

    // Mover t0 de posición 0 a posición 2
    const res = await moveTask("t0", "col_todo", 2);
    expect(res.success).toBe(true);

    // t0 ahora está en 2
    expect(dbTasks.get("t0")?.position).toBe(2);
    // t1 decrementó a 0
    expect(dbTasks.get("t1")?.position).toBe(0);
    // t2 decrementó a 1
    expect(dbTasks.get("t2")?.position).toBe(1);
  });

  it("INVARIANTE 1.2: Mover tarea hacia arriba desplaza los elementos hacia abajo sin duplicados", async () => {
    dbTasks.set("t0", {
      id: "t0",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T0",
      description: null,
      priority: "MEDIA",
      position: 0,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });
    dbTasks.set("t1", {
      id: "t1",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T1",
      description: null,
      priority: "MEDIA",
      position: 1,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });
    dbTasks.set("t2", {
      id: "t2",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T2",
      description: null,
      priority: "MEDIA",
      position: 2,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });

    // Mover t2 de posición 2 a posición 0
    const res = await moveTask("t2", "col_todo", 0);
    expect(res.success).toBe(true);

    expect(dbTasks.get("t2")?.position).toBe(0);
    expect(dbTasks.get("t0")?.position).toBe(1);
    expect(dbTasks.get("t1")?.position).toBe(2);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 2: Movimiento Cross-Column y Transición de Estado de Completado
  // --------------------------------------------------------------------------
  it("INVARIANTE 2: Mover a columna is_completed estampa completed_at y cierra hueco en origen", async () => {
    dbTasks.set("t0", {
      id: "t0",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T0",
      description: null,
      priority: "MEDIA",
      position: 0,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });
    dbTasks.set("t1", {
      id: "t1",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T1",
      description: null,
      priority: "MEDIA",
      position: 1,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });

    // Mover t0 a col_done (is_completed: true)
    const res = await moveTask("t0", "col_done", 0);
    expect(res.success).toBe(true);

    const moved = dbTasks.get("t0");
    expect(moved?.column_id).toBe("col_done");
    expect(moved?.position).toBe(0);
    // completed_at debe haberse seteado
    expect(moved?.completed_at).toBeInstanceOf(Date);

    // En col_todo, t1 debe haber bajado de pos 1 a pos 0 para cerrar el hueco
    expect(dbTasks.get("t1")?.position).toBe(0);

    // Debe registrar la bitácora
    const activity = dbActivities.find((a) => a.action === "MOVED_COLUMN");
    expect(activity).toBeDefined();
    expect(
      (activity?.details as { to_column_title: string }).to_column_title,
    ).toBe("Completado");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 3: Control de Acceso (RBAC) para Creación de Tareas
  // --------------------------------------------------------------------------
  it("INVARIANTE 3: Un voluntario no puede crear tareas; solo leads y admins", async () => {
    mockCurrentUser = {
      id: "usr_vol",
      name: "Voluntario",
      email: "vol@votabien.pe",
      role: "volunteer",
    };

    await expect(
      createTask({
        boardId: "b_1",
        columnId: "col_todo",
        title: "Tarea no permitida",
      }),
    ).rejects.toThrow(
      "Solo los líderes de área y administradores pueden crear tareas.",
    );
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 4: Sincronización Diferencial de Asignaciones (Set Diffing)
  // --------------------------------------------------------------------------
  it("INVARIANTE 4: updateTask calcula el diff y elimina solo asignaciones descartadas", async () => {
    const task: MockTask = {
      id: "task_sync",
      board_id: "b_1",
      column_id: "col_todo",
      title: "Tarea colaborativa",
      description: null,
      priority: "MEDIA",
      position: 0,
      completed_at: null,
      created_by_id: "u_creator",
      tags: [],
      resources: [],
      checklist: [],
    };
    dbTasks.set("task_sync", task);
    dbAssignments.push({
      id: "asg_1",
      task_id: "task_sync",
      user_id: "user_1",
      status: "PENDING",
      notes: null,
      completed_at: null,
    });
    dbAssignments.push({
      id: "asg_2",
      task_id: "task_sync",
      user_id: "user_2",
      status: "IN_PROGRESS",
      notes: null,
      completed_at: null,
    });

    await updateTask({
      taskId: "task_sync",
      title: "Tarea colaborativa (Editada)",
      priority: "ALTA",
      assignedUserIds: ["user_2", "user_3"],
    });

    const activeAssignments = dbAssignments.filter(
      (a) => a.task_id === "task_sync",
    );
    expect(activeAssignments).toHaveLength(2);
    // user_1 fue eliminado
    expect(
      activeAssignments.find((a) => a.user_id === "user_1"),
    ).toBeUndefined();
    // user_2 se conservó intacto con su id y status
    const asg2 = activeAssignments.find((a) => a.user_id === "user_2");
    expect(asg2?.id).toBe("asg_2");
    expect(asg2?.status).toBe("IN_PROGRESS");
    // user_3 fue creado con status PENDING
    const asg3 = activeAssignments.find((a) => a.user_id === "user_3");
    expect(asg3).toBeDefined();
    expect(asg3?.status).toBe("PENDING");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 5: Detección en Cascada de Culminación Grupal
  // --------------------------------------------------------------------------
  it("INVARIANTE 5: Cuando todos los voluntarios completan su asignación, se dispara ALL_ASSIGNMENTS_COMPLETED", async () => {
    dbTasks.set("task_grp", {
      id: "task_grp",
      board_id: "b_1",
      column_id: "col_todo",
      title: "Task Group",
      description: null,
      priority: "MEDIA",
      position: 0,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });
    dbAssignments.push({
      id: "asg_g1",
      task_id: "task_grp",
      user_id: "u1",
      status: "COMPLETED",
      notes: null,
      completed_at: new Date(),
    });
    dbAssignments.push({
      id: "asg_g2",
      task_id: "task_grp",
      user_id: "u2",
      status: "PENDING",
      notes: null,
      completed_at: null,
    });

    // u2 completa su asignación
    mockCurrentUser = {
      id: "u2",
      name: "Voluntario 2",
      email: "u2@votabien.pe",
      role: "volunteer",
    };
    await updateAssignmentStatus("task_grp", "COMPLETED");

    // Verificar que se registró el evento grupal
    const allCompletedEvent = dbActivities.find(
      (a) => a.action === "ALL_ASSIGNMENTS_COMPLETED",
    );
    expect(allCompletedEvent).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 6: Compactación de Posiciones al Eliminar Tarea
  // --------------------------------------------------------------------------
  it("INVARIANTE 6: deleteTask cierra limpiamente el hueco posicional en la columna", async () => {
    dbTasks.set("t0", {
      id: "t0",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T0",
      description: null,
      priority: "MEDIA",
      position: 0,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });
    dbTasks.set("t1", {
      id: "t1",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T1",
      description: null,
      priority: "MEDIA",
      position: 1,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });
    dbTasks.set("t2", {
      id: "t2",
      board_id: "b_1",
      column_id: "col_todo",
      title: "T2",
      description: null,
      priority: "MEDIA",
      position: 2,
      completed_at: null,
      created_by_id: "u1",
      tags: [],
      resources: [],
      checklist: [],
    });

    // Eliminar t1 (posición 1)
    const res = await deleteTask("t1");
    expect(res.success).toBe(true);
    expect(dbTasks.has("t1")).toBe(false);

    // t0 permanece en 0
    expect(dbTasks.get("t0")?.position).toBe(0);
    // t2 (que estaba en pos 2) baja a pos 1
    expect(dbTasks.get("t2")?.position).toBe(1);
  });
});
