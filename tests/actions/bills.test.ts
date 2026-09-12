import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// PRINCIPAL ENGINEER TEST SUITE: BILLS & LEGISLATIVE METRICS SERVER ACTIONS
// ============================================================================
// Enfoque: Verificación de invariantes de productividad legislativa:
// 1. Recálculo matemático y agregaciones estadísticas en cascada (legislatormetrics).
// 2. Mapeo estricto de estados legislativos (Aprobados, Rechazados, En Proceso).
// 3. Compactación de métricas tras la eliminación de proyectos de ley.
// 4. Regeneración con IA y resiliencia ante fallos del microservicio local.
// 5. Purgado del ecosistema de caché (/admin/proyectos-ley, /admin/legisladores).
// ============================================================================

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
  id: "usr_editor_1",
  name: "Editor Bills",
  email: "editor@votabien.pe",
  role: "admin",
};

vi.mock("@/lib/auth-actions", () => ({
  serverRequireAdmin: vi.fn(async () => {
    if (
      !mockCurrentUser ||
      !["admin", "super_admin"].includes(mockCurrentUser.role)
    ) {
      throw new Error("No autorizado: se requiere rol de administrador");
    }
    return { user: mockCurrentUser };
  }),
  serverRequireEditor: vi.fn(async () => {
    if (
      !mockCurrentUser ||
      !["editor", "admin", "super_admin"].includes(mockCurrentUser.role)
    ) {
      throw new Error("No autorizado: se requiere rol de editor");
    }
    return { user: mockCurrentUser };
  }),
}));

// In-Memory Database Harness
interface MockBill {
  id: string;
  legislator_id: string | null;
  title: string;
  title_ai: string | null;
  summary: string | null;
  approval_status: string;
  document_url: string | null;
  committees: string | null;
  updated_at?: Date;
}

interface MockLegislatorMetrics {
  legislator_id: string;
  total_bills: number;
  bills_presentado: number;
  bills_en_comision: number;
  bills_aprobado: number;
  bills_rechazado: number;
  bills_retirado_por_autor: number;
  bills_en_proceso: number;
  last_updated: Date;
}

let dbBills: Map<string, MockBill>;
let dbMetrics: Map<string, MockLegislatorMetrics>;

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    bill: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const b = dbBills.get(where.id);
        return b ? { ...b } : null;
      }),
      findMany: vi.fn(
        async ({ where }: { where: { legislator_id: string } }) => {
          return Array.from(dbBills.values())
            .filter((b) => b.legislator_id === where.legislator_id)
            .map((b) => ({ ...b }));
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockBill>;
        }) => {
          const existing = dbBills.get(where.id);
          if (!existing) throw new Error(`Bill ${where.id} not found`);
          const updated = { ...existing, ...data, updated_at: new Date() };
          dbBills.set(where.id, updated);
          return { ...updated };
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const existing = dbBills.get(where.id);
        if (!existing) throw new Error(`Bill ${where.id} not found`);
        dbBills.delete(where.id);
        return { ...existing };
      }),
    },
    legislatormetrics: {
      findUnique: vi.fn(
        async ({ where }: { where: { legislator_id: string } }) => {
          const m = dbMetrics.get(where.legislator_id);
          return m ? { ...m } : null;
        },
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { legislator_id: string };
          create: MockLegislatorMetrics;
          update: Partial<MockLegislatorMetrics>;
        }) => {
          const existing = dbMetrics.get(where.legislator_id);
          if (existing) {
            const updated = {
              ...existing,
              ...update,
              last_updated: new Date(),
            };
            dbMetrics.set(where.legislator_id, updated);
            return { ...updated };
          } else {
            const created = { ...create, last_updated: new Date() };
            dbMetrics.set(where.legislator_id, created);
            return { ...created };
          }
        },
      ),
    },
  };

  return {
    prisma: prismaMock,
    default: prismaMock,
  };
});

import {
  updateBillAction,
  deleteBillAction,
  regenerateBillTitleAction,
} from "@/app/admin/proyectos-ley/_lib/actions";

describe("Bills & Legislator Metrics Server Actions - Principal Engineer Invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbBills = new Map();
    dbMetrics = new Map();

    mockCurrentUser = {
      id: "usr_editor_1",
      name: "Editor Bills",
      email: "editor@votabien.pe",
      role: "admin",
    };
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 1: Recálculo Estadístico de Productividad Legislativa
  // --------------------------------------------------------------------------
  it("INVARIANTE 1: updateBillAction recalcula correctamente métricas en cascada para el legislador", async () => {
    const legId = "leg_congresista_1";

    // 4 proyectos preexistentes:
    // 1 PRESENTADO, 1 EN_COMISION, 1 APROBADO, 1 AL_ARCHIVO
    dbBills.set("bill_1", {
      id: "bill_1",
      legislator_id: legId,
      title: "Ley 1",
      title_ai: null,
      summary: null,
      approval_status: "PRESENTADO",
      document_url: null,
      committees: null,
    });
    dbBills.set("bill_2", {
      id: "bill_2",
      legislator_id: legId,
      title: "Ley 2",
      title_ai: null,
      summary: null,
      approval_status: "EN_COMISION",
      document_url: null,
      committees: null,
    });
    dbBills.set("bill_3", {
      id: "bill_3",
      legislator_id: legId,
      title: "Ley 3",
      title_ai: null,
      summary: null,
      approval_status: "APROBADO",
      document_url: null,
      committees: null,
    });
    dbBills.set("bill_4", {
      id: "bill_4",
      legislator_id: legId,
      title: "Ley 4",
      title_ai: null,
      summary: null,
      approval_status: "AL_ARCHIVO",
      document_url: null,
      committees: null,
    });

    // Modificar bill_1 de PRESENTADO -> PUBLICADO (cuenta como aprobado)
    const res = await updateBillAction("bill_1", {
      approval_status: "PUBLICADO",
    });

    expect(res.success).toBe(true);
    expect(dbBills.get("bill_1")?.approval_status).toBe("PUBLICADO");

    // Verificar las métricas recalculadas en legislatormetrics
    const metrics = dbMetrics.get(legId);
    expect(metrics).toBeDefined();
    expect(metrics?.total_bills).toBe(4);
    expect(metrics?.bills_presentado).toBe(0); // bill_1 ya no es presentado
    expect(metrics?.bills_en_comision).toBe(1); // bill_2
    expect(metrics?.bills_aprobado).toBe(2); // bill_1 (PUBLICADO) + bill_3 (APROBADO)
    expect(metrics?.bills_rechazado).toBe(1); // bill_4 (AL_ARCHIVO)
    // En proceso: total(4) - aprobados(2) - rechazados(1) = 1 (bill_2)
    expect(metrics?.bills_en_proceso).toBe(1);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/proyectos-ley");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/legisladores");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 2: Agrupación de Estados Aprobados y Archivados Complejos
  // --------------------------------------------------------------------------
  it("INVARIANTE 2: Reconoce AUTOGRAFA y DECRETO_ARCHIVO en los baldes estadísticos correctos", async () => {
    const legId = "leg_congresista_2";

    dbBills.set("b10", {
      id: "b10",
      legislator_id: legId,
      title: "Autógrafa Ley",
      title_ai: null,
      summary: null,
      approval_status: "AUTOGRAFA",
      document_url: null,
      committees: null,
    });
    dbBills.set("b11", {
      id: "b11",
      legislator_id: legId,
      title: "Decreto Archivo",
      title_ai: null,
      summary: null,
      approval_status: "DECRETO_ARCHIVO",
      document_url: null,
      committees: null,
    });
    dbBills.set("b12", {
      id: "b12",
      legislator_id: legId,
      title: "Retirado",
      title_ai: null,
      summary: null,
      approval_status: "RETIRADO_POR_AUTOR",
      document_url: null,
      committees: null,
    });

    // Actualizar b10
    await updateBillAction("b10", {
      approval_status: "APROBADO_PRIMERA_VOTACION",
    });

    const metrics = dbMetrics.get(legId);
    expect(metrics?.total_bills).toBe(3);
    expect(metrics?.bills_aprobado).toBe(1); // APROBADO_PRIMERA_VOTACION
    expect(metrics?.bills_rechazado).toBe(1); // DECRETO_ARCHIVO
    expect(metrics?.bills_retirado_por_autor).toBe(1);
    expect(metrics?.bills_en_proceso).toBe(0); // 3 - 1 - 1 - 1 = 0
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 3: Eliminación Atómica y Compactación de Métricas
  // --------------------------------------------------------------------------
  it("INVARIANTE 3: deleteBillAction decrementa total_bills y recalcula contadores del congresista", async () => {
    const legId = "leg_congresista_3";

    dbBills.set("del_1", {
      id: "del_1",
      legislator_id: legId,
      title: "Ley a borrar",
      title_ai: null,
      summary: null,
      approval_status: "APROBADO",
      document_url: null,
      committees: null,
    });
    dbBills.set("del_2", {
      id: "del_2",
      legislator_id: legId,
      title: "Ley restante",
      title_ai: null,
      summary: null,
      approval_status: "EN_COMISION",
      document_url: null,
      committees: null,
    });

    const res = await deleteBillAction("del_1");
    expect(res.success).toBe(true);
    expect(dbBills.has("del_1")).toBe(false);

    // Métrica debe haberse recalculado
    const metrics = dbMetrics.get(legId);
    expect(metrics?.total_bills).toBe(1);
    expect(metrics?.bills_aprobado).toBe(0);
    expect(metrics?.bills_en_comision).toBe(1);
    expect(metrics?.bills_en_proceso).toBe(1);
  });

  it("INVARIANTE 3.2: deleteBillAction exige permisos de administrador", async () => {
    mockCurrentUser = {
      id: "usr_editor_only",
      name: "Editor",
      email: "editor@votabien.pe",
      role: "editor", // Solo editor, no admin
    };

    dbBills.set("del_no_perm", {
      id: "del_no_perm",
      legislator_id: "leg_1",
      title: "Test",
      title_ai: null,
      summary: null,
      approval_status: "PRESENTADO",
      document_url: null,
      committees: null,
    });

    await expect(deleteBillAction("del_no_perm")).rejects.toThrow(
      "se requiere rol de administrador",
    );
    expect(dbBills.has("del_no_perm")).toBe(true);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 4: Regeneración de Título con IA y Resiliencia de Red
  // --------------------------------------------------------------------------
  it("INVARIANTE 4: regenerateBillTitleAction maneja error de microservicio caído limpiamente", async () => {
    dbBills.set("ai_bill_1", {
      id: "ai_bill_1",
      legislator_id: "leg_1",
      title: "Proyecto de Ley que declara de interés nacional...",
      title_ai: null,
      summary: null,
      approval_status: "PRESENTADO",
      document_url: null,
      committees: null,
    });

    // Mock fetch que lanza error de conexión (ej. ECONNREFUSED en Docker)
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("connect ECONNREFUSED 127.0.0.1:8000"));

    const res = await regenerateBillTitleAction("ai_bill_1");
    expect(res.success).toBe(false);
    expect(res.error).toContain(
      "No se pudo conectar con el servicio local de IA",
    );
  });

  it("INVARIANTE 4.2: regenerateBillTitleAction persiste title_ai cuando el servicio responde exitosamente", async () => {
    dbBills.set("ai_bill_2", {
      id: "ai_bill_2",
      legislator_id: "leg_1",
      title:
        "PROYECTO DE LEY QUE PROPONE LA MODERNIZACION DEL TRANSPORTE URBANO",
      title_ai: null,
      summary: null,
      approval_status: "PRESENTADO",
      document_url: null,
      committees: null,
    });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title_ai: "Modernización del Transporte Urbano",
        summary: "Iniciativa para renovar la flota vehicular pública.",
      }),
    } as Response);

    const res = await regenerateBillTitleAction("ai_bill_2");
    expect(res.success).toBe(true);

    const updated = dbBills.get("ai_bill_2");
    expect(updated?.title_ai).toBe("Modernización del Transporte Urbano");
    expect(updated?.summary).toBe(
      "Iniciativa para renovar la flota vehicular pública.",
    );
  });
});
