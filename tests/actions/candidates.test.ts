import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// PRINCIPAL ENGINEER TEST SUITE: CANDIDACY OVERLAP & ELECTORAL RULES
// ============================================================================
// Enfoque: Verificación de reglas de la Ley Orgánica de Elecciones y ciclos de vida:
// 1. Invariante de Unicidad de Candidatura por proceso electoral.
// 2. Invariante de Doble Postulación permitida (Fórmula Presidencial + Cámara).
// 3. Bloqueo estricto de combinaciones incompatibles (ej. Senador + Diputado).
// 4. Verificación de existencia de distrito electoral (Integridad referencial).
// 5. Auto-exclusión en edición (updateCandidatePeriod no auto-colisiona).
// 6. Transiciones de estado de candidatura y actualización masiva.
// ============================================================================

const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
  revalidateTag: (tag: string, profile?: string) =>
    mockRevalidateTag(tag, profile),
}));

let mockCurrentUser: {
  id: string;
  name: string;
  email: string;
  role: string;
} | null = {
  id: "usr_editor_cand",
  name: "Editor Candidatos",
  email: "editor@votabien.pe",
  role: "admin",
};

vi.mock("@/lib/auth-actions", () => ({
  serverRequireEditor: vi.fn(async () => {
    if (
      !mockCurrentUser ||
      !["editor", "admin", "super_admin"].includes(mockCurrentUser.role)
    ) {
      throw new Error("No autorizado: se requiere rol de editor");
    }
    return { user: mockCurrentUser };
  }),
  serverRequireReviewer: vi.fn(async () => {
    if (!mockCurrentUser || mockCurrentUser.role === "user") {
      throw new Error("No autorizado: se requiere rol de revisor");
    }
    return { user: mockCurrentUser };
  }),
}));

vi.mock("@paralleldrive/cuid2", () => {
  let counter = 0;
  return {
    createId: () => `cuid_cand_${++counter}`,
  };
});

// In-Memory Database Harness
interface MockCandidate {
  id: string;
  person_id: string;
  electoral_process_id: string;
  electoral_district_id: string;
  political_party_id: string;
  type: string;
  status: string;
  list_number: number | null;
  active: boolean;
}

interface MockDistrict {
  id: string;
  name: string;
}

let dbCandidates: Map<string, MockCandidate>;
let dbDistricts: Map<string, MockDistrict>;

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    electoraldistrict: {
      findFirst: vi.fn(
        async ({ where }: { where: { name: { contains: string } } }) => {
          for (const d of dbDistricts.values()) {
            if (
              d.name.toLowerCase().includes(where.name.contains.toLowerCase())
            ) {
              return { ...d };
            }
          }
          return null;
        },
      ),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const d = dbDistricts.get(where.id);
        return d ? { ...d } : null;
      }),
    },
    candidate: {
      findMany: vi.fn(
        async ({
          where,
        }: {
          where: {
            active?: boolean;
            person_id: string;
            electoral_process_id: string;
            id?: { not?: string };
          };
        }) => {
          return Array.from(dbCandidates.values())
            .filter((c) => {
              if (where.active !== undefined && c.active !== where.active)
                return false;
              if (c.person_id !== where.person_id) return false;
              if (c.electoral_process_id !== where.electoral_process_id)
                return false;
              if (where.id?.not && c.id === where.id.not) return false;
              return true;
            })
            .map((c) => ({ ...c }));
        },
      ),
      create: vi.fn(async ({ data }: { data: MockCandidate }) => {
        dbCandidates.set(data.id, { ...data });
        return { ...data };
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockCandidate>;
        }) => {
          const existing = dbCandidates.get(where.id);
          if (!existing) throw new Error(`Candidate ${where.id} not found`);
          const updated = { ...existing, ...data };
          dbCandidates.set(where.id, updated);
          return { ...updated };
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: { in: string[] } };
          data: Partial<MockCandidate>;
        }) => {
          let count = 0;
          for (const id of where.id.in) {
            const c = dbCandidates.get(id);
            if (c) {
              dbCandidates.set(id, { ...c, ...data });
              count++;
            }
          }
          return { count };
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const existing = dbCandidates.get(where.id);
        if (!existing) throw new Error(`Candidate ${where.id} not found`);
        dbCandidates.delete(where.id);
        return { ...existing };
      }),
    },
  };

  return {
    prisma: prismaMock,
    default: prismaMock,
  };
});

import {
  createCandidatePeriod,
  updateCandidatePeriod,
  deleteCandidatePeriod,
  bulkUpdateCandidates,
  updateCandidateStatus,
} from "@/app/admin/candidatos/_lib/actions";
import { CandidacyType, CandidacyStatus } from "@/interfaces/candidate";

describe("Candidate Periods & Electoral Rules - Principal Engineer Invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbCandidates = new Map();
    dbDistricts = new Map();

    // Distritos base
    dbDistricts.set("dist_nac", {
      id: "dist_nac",
      name: "Distrito Electoral Nacional",
    });
    dbDistricts.set("dist_lima", {
      id: "dist_lima",
      name: "Lima Metropolitana",
    });
    dbDistricts.set("dist_cusco", { id: "dist_cusco", name: "Cusco" });

    mockCurrentUser = {
      id: "usr_editor_cand",
      name: "Editor Candidatos",
      email: "editor@votabien.pe",
      role: "admin",
    };
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 1: Unicidad de Tipo de Candidatura
  // --------------------------------------------------------------------------
  it("INVARIANTE 1: Rechaza registrar dos veces a la misma persona con el mismo cargo en el mismo proceso", async () => {
    const personId = "person_juan_perez";
    const processId = "proc_general_2026";

    // Ya existe como DIPUTADO en Cusco
    dbCandidates.set("cand_existing_1", {
      id: "cand_existing_1",
      person_id: personId,
      electoral_process_id: processId,
      electoral_district_id: "dist_cusco",
      political_party_id: "party_1",
      type: CandidacyType.DIPUTADO,
      status: "INSCRITO",
      list_number: 1,
      active: true,
    });

    // Intenta postular de nuevo como DIPUTADO en Lima
    const res = await createCandidatePeriod({
      person_id: personId,
      electoral_process_id: processId,
      electoral_district_id: "dist_lima",
      political_party_id: "party_1",
      type: CandidacyType.DIPUTADO,
      status: CandidacyStatus.INSCRITO,
      active: true,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain(
      "Esta persona ya está registrada como DIPUTADO",
    );
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 2: Doble Postulación Electoral Permitida (Presidencial + Cámara)
  // --------------------------------------------------------------------------
  it("INVARIANTE 2: Permite a un candidato presidencial postular simultáneamente al Senado o Diputados", async () => {
    const personId = "person_presidencial";
    const processId = "proc_general_2026";

    // Registrar primero como PRESIDENTE
    const resPres = await createCandidatePeriod({
      person_id: personId,
      electoral_process_id: processId,
      electoral_district_id: "dist_nac",
      political_party_id: "party_1",
      type: CandidacyType.PRESIDENTE,
      status: CandidacyStatus.INSCRITO,
      active: true,
    });
    expect(resPres.success).toBe(true);

    // Registrar en simultáneo como SENADOR (Permitido por Ley Orgánica de Elecciones)
    const resSen = await createCandidatePeriod({
      person_id: personId,
      electoral_process_id: processId,
      electoral_district_id: "dist_nac",
      political_party_id: "party_1",
      type: CandidacyType.SENADOR,
      status: CandidacyStatus.INSCRITO,
      active: true,
    });
    expect(resSen.success).toBe(true);

    const candidates = Array.from(dbCandidates.values()).filter(
      (c) => c.person_id === personId,
    );
    expect(candidates).toHaveLength(2);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 3: Rechazo de Combinaciones Prohibidas
  // --------------------------------------------------------------------------
  it("INVARIANTE 3: Rechaza postulación simultánea de SENADOR con DIPUTADO", async () => {
    const personId = "person_congresal";
    const processId = "proc_general_2026";

    dbCandidates.set("cand_sen", {
      id: "cand_sen",
      person_id: personId,
      electoral_process_id: processId,
      electoral_district_id: "dist_nac",
      political_party_id: "party_1",
      type: CandidacyType.SENADOR,
      status: "INSCRITO",
      list_number: 1,
      active: true,
    });

    // Intenta postular como DIPUTADO (Prohibido postular a ambas cámaras)
    const res = await createCandidatePeriod({
      person_id: personId,
      electoral_process_id: processId,
      electoral_district_id: "dist_lima",
      political_party_id: "party_1",
      type: CandidacyType.DIPUTADO,
      status: CandidacyStatus.INSCRITO,
      active: true,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain(
      "Solo las candidaturas de PRESIDENTE/VICEPRESIDENTE pueden combinarse",
    );
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 4: Integridad Referencial de Distrito Electoral
  // --------------------------------------------------------------------------
  it("INVARIANTE 4: Rechaza distritos electorales inexistentes", async () => {
    const res = await createCandidatePeriod({
      person_id: "person_any",
      electoral_process_id: "proc_general_2026",
      electoral_district_id: "distrito_fantasma_inexistente",
      political_party_id: "party_1",
      type: CandidacyType.SENADOR,
      status: CandidacyStatus.INSCRITO,
      active: true,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("El distrito electoral seleccionado no existe");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 5: Auto-Exclusión en Actualización
  // --------------------------------------------------------------------------
  it("INVARIANTE 5: updateCandidatePeriod no colisiona consigo mismo al editar otros campos", async () => {
    const candId = "cand_edit_test";
    dbCandidates.set(candId, {
      id: candId,
      person_id: "person_self_edit",
      electoral_process_id: "proc_general_2026",
      electoral_district_id: "dist_lima",
      political_party_id: "party_1",
      type: CandidacyType.DIPUTADO,
      status: "INSCRITO",
      list_number: 5,
      active: true,
    });

    // Modificar list_number manteniendo el mismo tipo y distrito
    const res = await updateCandidatePeriod({
      id: candId,
      person_id: "person_self_edit",
      electoral_process_id: "proc_general_2026",
      electoral_district_id: "dist_lima",
      type: CandidacyType.DIPUTADO,
      list_number: 1, // Ascendido a cabeza de lista
    });

    expect(res.success).toBe(true);
    expect(dbCandidates.get(candId)?.list_number).toBe(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/candidatos");
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 6: Transiciones de Estado y Operaciones Batch
  // --------------------------------------------------------------------------
  it("INVARIANTE 6: updateCandidateStatus y bulkUpdateCandidates mutan y purgan caché", async () => {
    dbCandidates.set("c1", {
      id: "c1",
      person_id: "p1",
      electoral_process_id: "ep",
      electoral_district_id: "d",
      political_party_id: "pt",
      type: CandidacyType.DIPUTADO,
      status: "INSCRITO",
      list_number: 1,
      active: true,
    });
    dbCandidates.set("c2", {
      id: "c2",
      person_id: "p2",
      electoral_process_id: "ep",
      electoral_district_id: "d",
      political_party_id: "pt",
      type: CandidacyType.DIPUTADO,
      status: "INSCRITO",
      list_number: 2,
      active: true,
    });

    // 1. Excluir candidatura
    const resStatus = await updateCandidateStatus(
      "c1",
      CandidacyStatus.EXCLUIDO,
    );
    expect(resStatus.success).toBe(true);
    expect(dbCandidates.get("c1")?.status).toBe(CandidacyStatus.EXCLUIDO);

    // 2. Desactivar en bloque
    const resBulk = await bulkUpdateCandidates({
      ids: ["c1", "c2"],
      active: false,
    });
    expect(resBulk.data?.count).toBe(2);
    expect(dbCandidates.get("c1")?.active).toBe(false);
    expect(dbCandidates.get("c2")?.active).toBe(false);

    // 3. Eliminar periodo
    const resDel = await deleteCandidatePeriod("c2");
    expect(resDel.success).toBe(true);
    expect(dbCandidates.has("c2")).toBe(false);
  });
});
