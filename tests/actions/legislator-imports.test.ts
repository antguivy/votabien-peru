import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// PRINCIPAL ENGINEER TEST SUITE: LEGISLATOR BULK IMPORT & MAPPING INVARIANTS
// ============================================================================
// Enfoque: Verificación de la frontera de ingesta masiva (Excel/CSV a BD):
// 1. Barrera de Seguridad (serverRequireEditor).
// 2. Invariante All-or-Nothing (Fase 1 de Validación Pura): si una sola fila
//    tiene error de DNI, Partido, Bancada, Distrito o Cámara, se aborta sin mutar DB.
// 3. Coincidencia insensible a mayúsculas/minúsculas y por siglas (Acronym).
// 4. Invariante de Dominio: inserción atómica sincronizada en `legislator` y
//    `parliamentarymembership` inicial (change_reason: INICIAL).
// 5. Normalización y trim de email institucional opcional.
// 6. Invalidación precisa de caché (/admin/legisladores y tags).
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
  id: "usr_editor_import",
  name: "Editor Import",
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
}));

vi.mock("@paralleldrive/cuid2", () => {
  let counter = 0;
  return {
    createId: () => `cuid_import_${++counter}`,
  };
});

// In-Memory Database Harness
interface MockPerson {
  id: string;
  dni: string;
  fullname: string;
}

interface MockParty {
  id: string;
  name: string;
  acronym: string | null;
}

interface MockGroup {
  id: string;
  name: string;
}

interface MockDistrict {
  id: string;
  name: string;
}

interface MockPeriod {
  id: string;
  name: string;
}

interface MockLegislator {
  id: string;
  person_id: string;
  electoral_district_id: string;
  chamber: string;
  active: boolean;
  condition: string;
  elected_by_party_id: string;
  legislative_period_id: string;
  institutional_email: string | null;
}

interface MockMembership {
  id: string;
  legislator_id: string;
  parliamentary_group_id: string;
  change_reason: string;
}

let dbPersons: Map<string, MockPerson>;
let dbParties: Map<string, MockParty>;
let dbGroups: Map<string, MockGroup>;
let dbDistricts: Map<string, MockDistrict>;
let dbPeriods: Map<string, MockPeriod>;
let dbLegislators: Map<string, MockLegislator>;
let dbMemberships: Map<string, MockMembership>;

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    person: {
      findFirst: vi.fn(async ({ where }: { where: { dni: string } }) => {
        for (const p of dbPersons.values()) {
          if (p.dni === where.dni) return { ...p };
        }
        return null;
      }),
    },
    politicalparty: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: {
            OR: Array<{
              name?: { equals: string; mode: string };
              acronym?: { equals: string; mode: string };
            }>;
          };
        }) => {
          for (const p of dbParties.values()) {
            for (const cond of where.OR) {
              if (
                cond.name &&
                p.name.toLowerCase() === cond.name.equals.toLowerCase()
              ) {
                return { ...p };
              }
              if (
                cond.acronym &&
                p.acronym &&
                p.acronym.toLowerCase() === cond.acronym.equals.toLowerCase()
              ) {
                return { ...p };
              }
            }
          }
          return null;
        },
      ),
    },
    parliamentarygroup: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { name: { equals: string; mode: string } };
        }) => {
          for (const g of dbGroups.values()) {
            if (g.name.toLowerCase() === where.name.equals.toLowerCase()) {
              return { ...g };
            }
          }
          return null;
        },
      ),
    },
    electoraldistrict: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { name: { equals: string; mode: string } };
        }) => {
          for (const d of dbDistricts.values()) {
            if (d.name.toLowerCase() === where.name.equals.toLowerCase()) {
              return { ...d };
            }
          }
          return null;
        },
      ),
    },
    legislativeperiod: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { name: { contains: string; mode: string } };
        }) => {
          for (const lp of dbPeriods.values()) {
            if (
              lp.name.toLowerCase().includes(where.name.contains.toLowerCase())
            ) {
              return { ...lp };
            }
          }
          return null;
        },
      ),
    },
    $transaction: vi.fn(
      async (txCallback: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          legislator: {
            create: vi.fn(async ({ data }: { data: MockLegislator }) => {
              dbLegislators.set(data.id, { ...data });
              return { ...data };
            }),
          },
          parliamentarymembership: {
            create: vi.fn(async ({ data }: { data: MockMembership }) => {
              dbMemberships.set(data.id, { ...data });
              return { ...data };
            }),
          },
        };
        return txCallback(txMock);
      },
    ),
  };

  return {
    prisma: prismaMock,
    default: prismaMock,
  };
});

import {
  importLegislators,
  ImportLegislatorRow,
} from "@/app/admin/legisladores/_lib/import-actions";

describe("Legislators Bulk Import Actions - Principal Engineer Invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbPersons = new Map();
    dbParties = new Map();
    dbGroups = new Map();
    dbDistricts = new Map();
    dbPeriods = new Map();
    dbLegislators = new Map();
    dbMemberships = new Map();

    mockCurrentUser = {
      id: "usr_editor_import",
      name: "Editor Import",
      email: "editor@votabien.pe",
      role: "admin",
    };

    // Sembrar entidades maestras
    dbPersons.set("p_1", {
      id: "p_1",
      dni: "44556677",
      fullname: "Juan Pérez Congresista",
    });
    dbPersons.set("p_2", {
      id: "p_2",
      dni: "88990011",
      fullname: "María Gómez Senadora",
    });

    dbParties.set("party_fp", {
      id: "party_fp",
      name: "Fuerza Popular",
      acronym: "FP",
    });
    dbParties.set("party_app", {
      id: "party_app",
      name: "Alianza Para el Progreso",
      acronym: "APP",
    });

    dbGroups.set("bg_fp", { id: "bg_fp", name: "Bancada Fuerza Popular" });
    dbGroups.set("bg_app", {
      id: "bg_app",
      name: "Bancada Alianza Para el Progreso",
    });

    dbDistricts.set("dist_lima", { id: "dist_lima", name: "Lima" });
    dbDistricts.set("dist_arequipa", { id: "dist_arequipa", name: "Arequipa" });

    dbPeriods.set("period_2026", { id: "period_2026", name: "2026-2031" });
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 1: Seguridad y Control de Acceso
  // --------------------------------------------------------------------------
  it("INVARIANTE 1: Rechaza peticiones si el usuario no tiene rol de editor o admin", async () => {
    mockCurrentUser = null;
    await expect(importLegislators([])).rejects.toThrow("No autorizado");

    mockCurrentUser = {
      id: "usr_voluntario",
      name: "Voluntario",
      email: "voluntario@votabien.pe",
      role: "volunteer",
    };
    await expect(importLegislators([])).rejects.toThrow("No autorizado");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 2: Validación Previa Pura (All-or-Nothing)
  // --------------------------------------------------------------------------
  it("INVARIANTE 2: Aborta la operación y no crea ningún registro si un DNI no existe", async () => {
    const rows: ImportLegislatorRow[] = [
      {
        dni: "44556677", // Válido
        camara: "DIPUTADOS",
        partido: "Fuerza Popular",
        bancada: "Bancada Fuerza Popular",
        distrito: "Lima",
        periodo: "2026-2031",
      },
      {
        dni: "00000000", // NO EXISTE
        camara: "SENADO",
        partido: "Alianza Para el Progreso",
        bancada: "Bancada Alianza Para el Progreso",
        distrito: "Arequipa",
        periodo: "2026-2031",
      },
    ];

    const result = await importLegislators(rows);
    expect(result.success).toBe(false);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Fila 2 (DNI 00000000)");
    expect(result.errors[0]).toContain("Persona no encontrada");

    // Verificar que nada se insertó en la base de datos
    expect(dbLegislators.size).toBe(0);
    expect(dbMemberships.size).toBe(0);
  });

  it("INVARIANTE 2B: Detecta partido, bancada, distrito o periodo inexistentes y reporta fila exacta", async () => {
    const rows: ImportLegislatorRow[] = [
      {
        dni: "44556677",
        camara: "DIPUTADOS",
        partido: "Partido Inexistente Fantasma",
        bancada: "Bancada Fuerza Popular",
        distrito: "Lima",
        periodo: "2026-2031",
      },
      {
        dni: "88990011",
        camara: "SENADO",
        partido: "Fuerza Popular",
        bancada: "Bancada Desconocida",
        distrito: "Lima",
        periodo: "2026-2031",
      },
    ];

    const result = await importLegislators(rows);
    expect(result.success).toBe(false);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain(
      'Partido "Partido Inexistente Fantasma" no encontrado',
    );
    expect(result.errors[1]).toContain(
      'Bancada "Bancada Desconocida" no encontrada',
    );
  });

  it("INVARIANTE 2C: Bloquea cámaras inválidas distintas a SENADO, DIPUTADOS o CONGRESO", async () => {
    const rows: ImportLegislatorRow[] = [
      {
        dni: "44556677",
        camara: "CAMARA_INVENTADA", // Inválido
        partido: "FP",
        bancada: "Bancada Fuerza Popular",
        distrito: "Lima",
        periodo: "2026-2031",
      },
    ];

    const result = await importLegislators(rows);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("Cámara inválida");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 3: Inserción Atómica y Mapeo por Siglas / Insensible a Mayúsculas
  // --------------------------------------------------------------------------
  it("INVARIANTE 3: Importa con éxito mapeando partidos por siglas (acronym) y creando membresía inicial", async () => {
    const rows: ImportLegislatorRow[] = [
      {
        dni: "44556677",
        camara: "DIPUTADOS",
        partido: "fp", // Sigla en minúscula -> resuelve a party_fp
        bancada: "bancada fuerza popular", // Case-insensitive
        distrito: "lima",
        periodo: "2026", // Coincidencia parcial con "2026-2031"
        email: "   juan.perez@congreso.gob.pe   ", // Con espacios a recortar
      },
      {
        dni: "88990011",
        camara: "SENADO",
        partido: "Alianza Para el Progreso",
        bancada: "Bancada Alianza Para el Progreso",
        distrito: "Arequipa",
        periodo: "2026-2031",
      },
    ];

    const result = await importLegislators(rows);
    expect(result.success).toBe(true);
    expect(result.created).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verificar legisladores creados
    expect(dbLegislators.size).toBe(2);
    const leg1 = Array.from(dbLegislators.values()).find(
      (l) => l.person_id === "p_1",
    )!;
    expect(leg1).toBeDefined();
    expect(leg1.chamber).toBe("DIPUTADOS");
    expect(leg1.active).toBe(true);
    expect(leg1.condition).toBe("EN_EJERCICIO");
    expect(leg1.elected_by_party_id).toBe("party_fp");
    expect(leg1.electoral_district_id).toBe("dist_lima");
    expect(leg1.institutional_email).toBe("juan.perez@congreso.gob.pe");

    // Verificar membresías iniciales vinculadas
    expect(dbMemberships.size).toBe(2);
    const mem1 = Array.from(dbMemberships.values()).find(
      (m) => m.legislator_id === leg1.id,
    )!;
    expect(mem1).toBeDefined();
    expect(mem1.parliamentary_group_id).toBe("bg_fp");
    expect(mem1.change_reason).toBe("INICIAL");

    // Invalidación de caché
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/legisladores");
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});
