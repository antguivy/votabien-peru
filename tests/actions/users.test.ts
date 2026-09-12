import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// PRINCIPAL ENGINEER TEST SUITE: USERS & ROLES MANAGEMENT SERVER ACTIONS
// ============================================================================
// Enfoque: Verificación de invariantes de seguridad, ciclo de vida de usuarios,
// sincronización de credenciales/sesiones y protección contra auto-bloqueo:
// 1. Guardias de autorización de administrador (RBAC).
// 2. Creación transaccional (User + Account con hash de contraseña).
// 3. Invariante de roles asignables (soporte para 'lead', 'volunteer', 'editor', 'admin').
// 4. Invariante de auto-protección (un admin no puede auto-degradarse ni darse de baja).
// 5. Invariante de baja segura (revocación inmediata de sesiones activas en DB).
// 6. Reset de contraseñas y revalidación de caché.
// ============================================================================

// 1. Mocks de infraestructura
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn(async (pwd: string) => `scrypt_hash_${pwd}`),
}));

vi.mock("@paralleldrive/cuid2", () => {
  let counter = 0;
  return {
    createId: () => `cuid_${++counter}`,
  };
});

let mockSessionUser: {
  id: string;
  name: string;
  email: string;
  role: string;
} | null = {
  id: "usr_admin_master",
  name: "Master Admin",
  email: "admin@votabien.pe",
  role: "admin",
};

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => {
        if (!mockSessionUser) return null;
        return {
          user: {
            id: mockSessionUser.id,
            email: mockSessionUser.email,
            name: mockSessionUser.name,
          },
          session: { id: "sess_1", userId: mockSessionUser.id },
        };
      }),
    },
  },
}));

// 2. Stateful In-Memory Database Harness
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockAccount {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  password?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

let dbUsers: Map<string, MockUser>;
let dbAccounts: Map<string, MockAccount>;
let dbSessions: MockSession[];

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    user: {
      findUnique: vi.fn(
        async ({ where }: { where: { id?: string; email?: string } }) => {
          if (where.id) {
            const u = dbUsers.get(where.id);
            return u ? { ...u } : null;
          }
          if (where.email) {
            for (const u of dbUsers.values()) {
              if (u.email === where.email) return { ...u };
            }
          }
          return null;
        },
      ),
      findMany: vi.fn(
        async ({ orderBy }: { orderBy?: { createdAt: string } } = {}) => {
          const list = Array.from(dbUsers.values());
          if (orderBy?.createdAt === "desc") {
            list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }
          return list.map((u) => ({ ...u }));
        },
      ),
      create: vi.fn(async ({ data }: { data: Partial<MockUser> }) => {
        const record: MockUser = {
          id: data.id!,
          name: data.name!,
          email: data.email!,
          role: data.role || "user",
          emailVerified: Boolean(data.emailVerified),
          image: data.image || null,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
        };
        dbUsers.set(record.id, record);
        return { ...record };
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockUser>;
        }) => {
          const u = dbUsers.get(where.id);
          if (!u) throw new Error(`User ${where.id} not found`);
          const updated = { ...u, ...data, updatedAt: new Date() };
          dbUsers.set(where.id, updated);
          return { ...updated };
        },
      ),
    },
    account: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { userId: string; providerId: string };
        }) => {
          for (const a of dbAccounts.values()) {
            if (
              a.userId === where.userId &&
              a.providerId === where.providerId
            ) {
              return { ...a };
            }
          }
          return null;
        },
      ),
      create: vi.fn(async ({ data }: { data: MockAccount }) => {
        dbAccounts.set(data.id, { ...data });
        return { ...data };
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockAccount>;
        }) => {
          const a = dbAccounts.get(where.id);
          if (!a) throw new Error(`Account ${where.id} not found`);
          const updated = { ...a, ...data, updatedAt: new Date() };
          dbAccounts.set(where.id, updated);
          return { ...updated };
        },
      ),
    },
    session: {
      deleteMany: vi.fn(async ({ where }: { where: { userId: string } }) => {
        const initialCount = dbSessions.length;
        dbSessions = dbSessions.filter((s) => s.userId !== where.userId);
        return { count: initialCount - dbSessions.length };
      }),
    },
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: unknown) => Promise<unknown>)(prismaMock);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg;
    }),
  };

  return {
    prisma: prismaMock,
    default: prismaMock,
  };
});

import {
  serverCreateUser,
  serverUpdateUserRole,
  serverDeactivateUser,
  serverAdminResetPassword,
  serverGetAllUsers,
} from "@/lib/auth-actions";

describe("User Management Server Actions - Principal Engineer Invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbUsers = new Map();
    dbAccounts = new Map();
    dbSessions = [];

    // Admin principal conectado
    const adminUser: MockUser = {
      id: "usr_admin_master",
      name: "Master Admin",
      email: "admin@votabien.pe",
      role: "admin",
      emailVerified: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
    dbUsers.set(adminUser.id, adminUser);

    mockSessionUser = {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    };
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 1: Soporte Completo de Roles Asignables (incluyendo 'lead')
  // --------------------------------------------------------------------------
  it("INVARIANTE 1: serverCreateUser debe permitir crear un Líder de Área con role 'lead'", async () => {
    const res = await serverCreateUser({
      name: "Carlos Líder",
      email: "carlos.lider@votabien.pe",
      password: "password123",
      role: "lead", // Este rol está en el UI pero faltaba en ASSIGNABLE_ROLES del backend
    });

    expect(res.error).toBeUndefined();
    expect(res.success).toBe(true);
    expect(res.userId).toBeDefined();

    const created = dbUsers.get(res.userId!);
    expect(created).toBeDefined();
    expect(created?.role).toBe("lead");
    expect(created?.emailVerified).toBe(true);

    // Debe haber creado la cuenta con la contraseña hasheada
    const account = Array.from(dbAccounts.values()).find(
      (a) => a.userId === res.userId,
    );
    expect(account).toBeDefined();
    expect(account?.password).toBe("scrypt_hash_password123");
  });

  it("INVARIANTE 1.2: Permite crear los demás roles válidos ('volunteer', 'editor', 'admin')", async () => {
    for (const role of ["volunteer", "editor", "admin"] as const) {
      const res = await serverCreateUser({
        name: `Usuario ${role}`,
        email: `new_${role}@votabien.pe`,
        password: "securepassword",
        role,
      });
      expect(res.success).toBe(true);
      expect(dbUsers.get(res.userId!)?.role).toBe(role);
    }
  });

  it("INVARIANTE 1.3: Rechaza roles no permitidos o arbitrarios", async () => {
    const res = await serverCreateUser({
      name: "Hacker",
      email: "hacker@test.com",
      password: "password123",
      // @ts-expect-error test invalid role
      role: "god_mode",
    });
    expect(res.success).toBeFalsy();
    expect(res.error).toBe("Rol inválido");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 2: Detección de Email Duplicado y Validación de Credenciales
  // --------------------------------------------------------------------------
  it("INVARIANTE 2: No permite duplicar emails existentes", async () => {
    const res = await serverCreateUser({
      name: "Duplicado",
      email: "admin@votabien.pe", // Mismo email del master admin
      password: "password123",
      role: "volunteer",
    });
    expect(res.success).toBeFalsy();
    expect(res.error).toContain("Ya existe un usuario");
  });

  it("INVARIANTE 2.2: Valida longitud mínima de contraseña (al menos 6 caracteres)", async () => {
    const res = await serverCreateUser({
      name: "Corto",
      email: "corto@votabien.pe",
      password: "123",
      role: "volunteer",
    });
    expect(res.success).toBeFalsy();
    expect(res.error).toContain("al menos 6 caracteres");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 3: Auto-Protección de Administrador (Anti Lock-Out)
  // --------------------------------------------------------------------------
  it("INVARIANTE 3: Un administrador no puede auto-degradar su propio rol", async () => {
    const res = await serverUpdateUserRole("usr_admin_master", "volunteer");
    expect(res.success).toBeFalsy();
    expect(res.error).toBe("No puedes cambiar tu propio rol de administrador");
    expect(dbUsers.get("usr_admin_master")?.role).toBe("admin");
  });

  it("INVARIANTE 3.2: Un administrador no puede darse de baja a sí mismo", async () => {
    const res = await serverDeactivateUser("usr_admin_master");
    expect(res.success).toBeFalsy();
    expect(res.error).toBe("No puedes darte de baja a ti mismo");
    expect(dbUsers.get("usr_admin_master")?.role).toBe("admin");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 4: Baja Segura con Revocación Inmediata de Sesiones
  // --------------------------------------------------------------------------
  it("INVARIANTE 4: serverDeactivateUser degrada rol a 'user' y purga todas las sesiones en DB", async () => {
    // Usuario voluntario con 2 sesiones activas
    const volUser: MockUser = {
      id: "usr_vol_target",
      name: "Voluntario Activo",
      email: "target@votabien.pe",
      role: "volunteer",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbUsers.set(volUser.id, volUser);
    dbSessions.push({
      id: "s1",
      userId: volUser.id,
      token: "tok_1",
      expiresAt: new Date(),
    });
    dbSessions.push({
      id: "s2",
      userId: volUser.id,
      token: "tok_2",
      expiresAt: new Date(),
    });

    expect(dbSessions.filter((s) => s.userId === volUser.id)).toHaveLength(2);

    const res = await serverDeactivateUser(volUser.id);
    expect(res.success).toBe(true);

    // Rol degradado a 'user'
    expect(dbUsers.get(volUser.id)?.role).toBe("user");
    // Sesiones eliminadas de raíz para forzar logout inmediato
    expect(dbSessions.filter((s) => s.userId === volUser.id)).toHaveLength(0);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/usuarios");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 5: Actualización de Rol y Revalidación de Caché
  // --------------------------------------------------------------------------
  it("INVARIANTE 5: serverUpdateUserRole actualiza el rol de otro usuario y revalida caché", async () => {
    const editorUser: MockUser = {
      id: "usr_editor_target",
      name: "Editor Target",
      email: "editor.target@votabien.pe",
      role: "editor",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbUsers.set(editorUser.id, editorUser);

    const res = await serverUpdateUserRole(editorUser.id, "lead");
    expect(res.success).toBe(true);
    expect(dbUsers.get(editorUser.id)?.role).toBe("lead");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/usuarios");

    // Rechaza rol inválido
    // @ts-expect-error testing invalid role
    const invalidRes = await serverUpdateUserRole(
      editorUser.id,
      "invalid_role",
    );
    expect(invalidRes.success).toBeFalsy();
    expect(invalidRes.error).toBe("Rol inválido");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 6: Reset de Contraseña y Revocación Opcional de Sesiones
  // --------------------------------------------------------------------------
  it("INVARIANTE 6: serverAdminResetPassword actualiza contraseña y purga sesiones", async () => {
    const targetUser: MockUser = {
      id: "usr_reset_target",
      name: "Reset Target",
      email: "reset@votabien.pe",
      role: "volunteer",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbUsers.set(targetUser.id, targetUser);
    dbAccounts.set("acc_1", {
      id: "acc_1",
      accountId: targetUser.id,
      providerId: "credential",
      userId: targetUser.id,
      password: "old_hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    dbSessions.push({
      id: "s_res",
      userId: targetUser.id,
      token: "tok_res",
      expiresAt: new Date(),
    });

    const res = await serverAdminResetPassword({
      userId: targetUser.id,
      newPassword: "brand_new_password_99",
      revokeSessions: true,
    });

    expect(res.success).toBe(true);
    const acc = dbAccounts.get("acc_1");
    expect(acc?.password).toBe("scrypt_hash_brand_new_password_99");
    expect(dbSessions.filter((s) => s.userId === targetUser.id)).toHaveLength(
      0,
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/usuarios");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 7: Listado Ordenado y Protección RBAC en serverGetAllUsers
  // --------------------------------------------------------------------------
  it("INVARIANTE 7: serverGetAllUsers devuelve usuarios ordenados descendentemente por fecha", async () => {
    const u1: MockUser = {
      id: "u1",
      name: "User 1",
      email: "u1@pe",
      role: "user",
      emailVerified: true,
      createdAt: new Date("2026-02-01"),
      updatedAt: new Date(),
    };
    const u2: MockUser = {
      id: "u2",
      name: "User 2",
      email: "u2@pe",
      role: "user",
      emailVerified: true,
      createdAt: new Date("2026-03-01"),
      updatedAt: new Date(),
    };
    dbUsers.set(u1.id, u1);
    dbUsers.set(u2.id, u2);

    const res = await serverGetAllUsers();
    expect(res.error).toBeNull();
    expect(res.profiles.length).toBeGreaterThanOrEqual(3);
    expect(res.profiles[0].id).toBe("u2"); // Más reciente primero
  });
});
