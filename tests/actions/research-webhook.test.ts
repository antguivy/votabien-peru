import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ============================================================================
// PRINCIPAL ENGINEER TEST SUITE: RESEARCH PROPOSALS WEBHOOK GATEWAY
// ============================================================================
// Enfoque: Verificación de la frontera de ingesta entre el microservicio Python y DB:
// 1. Invariante de Seguridad y Rechazo de Token (Bearer API_SECRET_KEY).
// 2. Invariante de Idempotencia: purga de errores previos en reintentos de lote.
// 3. Filtro defensivo anti-basura (auto-descarte de hallazgos vacíos o inválidos).
// 4. Mapeo seguro de estados (IGNORE/NONE nunca quedan en PENDING).
// 5. Inserción atómica en research_proposals con normalización.
// 6. Ejecución directa de propuestas auto-aprobadas y recálculo en cascada.
// ============================================================================

const mockRevalidatePersonEcosystem = vi.fn();
vi.mock("@/lib/cache-revalidate", () => ({
  revalidatePersonEcosystem: () => mockRevalidatePersonEcosystem(),
}));

vi.mock("@paralleldrive/cuid2", () => {
  let counter = 0;
  return {
    createId: () => `cuid_prop_${++counter}`,
  };
});

// In-Memory Database Harness
interface MockProposal {
  id: string;
  person_id: string;
  batch_run_id: string | null;
  action: string;
  target_id: string | null;
  reason: string;
  confidence: number;
  status: string;
  proposed_data: Record<string, unknown>;
}

interface MockPerson {
  id: string;
  fullname: string;
  has_criminal_record: boolean;
  has_penal_sentence: boolean;
  has_sanction: boolean;
  is_under_investigation: boolean;
  posturas: Array<Record<string, unknown>>;
}

interface MockBackground {
  id: string;
  person_id: string;
  type: string;
  status: string;
  title: string;
  summary: string;
  sanction: string | null;
  source: string;
  source_url: string | null;
  publication_date: string | null;
}

let dbProposals: Map<string, MockProposal>;
let dbPersons: Map<string, MockPerson>;
let dbBackgrounds: Map<string, MockBackground>;

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    research_proposals: {
      deleteMany: vi.fn(
        async ({
          where,
        }: {
          where: {
            person_id: string;
            batch_run_id: string;
            OR?: Array<{ action?: string; status?: string }>;
          };
        }) => {
          let count = 0;
          for (const [id, p] of dbProposals.entries()) {
            if (
              p.person_id === where.person_id &&
              p.batch_run_id === where.batch_run_id
            ) {
              if (p.action === "ERROR" || p.status === "FAILED") {
                dbProposals.delete(id);
                count++;
              }
            }
          }
          return { count };
        },
      ),
      create: vi.fn(async ({ data }: { data: MockProposal }) => {
        dbProposals.set(data.id, { ...data });
        return { ...data };
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockProposal>;
        }) => {
          const existing = dbProposals.get(where.id);
          if (!existing) throw new Error(`Proposal ${where.id} not found`);
          const updated = { ...existing, ...data };
          dbProposals.set(where.id, updated);
          return { ...updated };
        },
      ),
    },
    background: {
      findMany: vi.fn(async ({ where }: { where: { person_id: string } }) => {
        return Array.from(dbBackgrounds.values())
          .filter((b) => b.person_id === where.person_id)
          .map((b) => ({ ...b }));
      }),
      create: vi.fn(async ({ data }: { data: MockBackground }) => {
        dbBackgrounds.set(data.id, { ...data });
        return { ...data };
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const b = dbBackgrounds.get(where.id);
        return b ? { ...b } : null;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockBackground>;
        }) => {
          const existing = dbBackgrounds.get(where.id);
          if (!existing) throw new Error(`Background ${where.id} not found`);
          const updated = { ...existing, ...data };
          dbBackgrounds.set(where.id, updated);
          return { ...updated };
        },
      ),
    },
    person: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const p = dbPersons.get(where.id);
        return p ? { ...p } : null;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockPerson>;
        }) => {
          const p = dbPersons.get(where.id);
          if (!p) throw new Error(`Person ${where.id} not found`);
          const updated = { ...p, ...data };
          dbPersons.set(where.id, updated);
          return { ...updated };
        },
      ),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => {
      return Promise.all(ops);
    }),
  };

  return {
    prisma: prismaMock,
    default: prismaMock,
  };
});

import { POST } from "@/app/api/internal/webhooks/research-proposals/route";

describe("Research Proposals Ingestion Webhook - Principal Engineer Invariants", () => {
  const SECRET = "internal_test_secret_key_12345";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_SECRET_KEY = SECRET;
    dbProposals = new Map();
    dbPersons = new Map();
    dbBackgrounds = new Map();

    // Persona de prueba
    dbPersons.set("pers_1", {
      id: "pers_1",
      fullname: "Candidato Investigado",
      has_criminal_record: false,
      has_penal_sentence: false,
      has_sanction: false,
      is_under_investigation: false,
      posturas: [],
    });
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 1: Barrera de Autenticación con Token Secreto
  // --------------------------------------------------------------------------
  it("INVARIANTE 1: Rechaza peticiones sin token o con token incorrecto arrojando 401", async () => {
    // 1. Sin header
    const reqNoAuth = new NextRequest(
      "http://localhost:3000/api/internal/webhooks/research-proposals",
      {
        method: "POST",
        body: JSON.stringify({ proposals: [] }),
      },
    );
    const resNoAuth = await POST(reqNoAuth);
    expect(resNoAuth.status).toBe(401);

    // 2. Token inválido
    const reqBadAuth = new NextRequest(
      "http://localhost:3000/api/internal/webhooks/research-proposals",
      {
        method: "POST",
        headers: { Authorization: "Bearer wrong_secret" },
        body: JSON.stringify({ proposals: [] }),
      },
    );
    const resBadAuth = await POST(reqBadAuth);
    expect(resBadAuth.status).toBe(401);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 2: Validación de Estructura de Payload
  // --------------------------------------------------------------------------
  it("INVARIANTE 2: Rechaza payloads sin el array 'proposals' arrojando 400", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/internal/webhooks/research-proposals",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${SECRET}` },
        body: JSON.stringify({ invalid_root: true }),
      },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Payload inválido");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 3: Idempotencia y Purga de Errores Previos en Reintentos
  // --------------------------------------------------------------------------
  it("INVARIANTE 3: Elimina propuestas previas fallidas del mismo lote y candidato", async () => {
    // Propuesta previa en error
    dbProposals.set("old_err", {
      id: "old_err",
      person_id: "pers_1",
      batch_run_id: "batch_400",
      action: "ERROR",
      target_id: null,
      reason: "Timeout LLM",
      confidence: 0,
      status: "FAILED",
      proposed_data: {},
    });

    const payload = {
      proposals: [
        {
          person_id: "pers_1",
          batch_run_id: "batch_400",
          action: "INSERT",
          confidence: 0.9,
          status: "PENDING",
          proposed_data: {
            title: "Propuesta de Ley sobre Ciberseguridad",
            summary:
              "El candidato presentó un proyecto para proteger datos del Estado.",
            type: "PROPUESTA",
            source: "El Comercio",
          },
        },
      ],
    };

    const req = new NextRequest(
      "http://localhost:3000/api/internal/webhooks/research-proposals",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${SECRET}` },
        body: JSON.stringify(payload),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    // La propuesta previa fallida fue eliminada
    expect(dbProposals.has("old_err")).toBe(false);
    // Y la nueva propuesta fue creada
    expect(dbProposals.size).toBe(1);
    const created = Array.from(dbProposals.values())[0];
    expect(created.status).toBe("PENDING");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 4: Filtro Defensivo Anti-Basura (Auto-Descarte de Alucinaciones)
  // --------------------------------------------------------------------------
  it("INVARIANTE 4: Descarta automáticamente como REJECTED hallazgos vacíos o 'Sin resumen'", async () => {
    const payload = {
      proposals: [
        {
          person_id: "pers_1",
          batch_run_id: "batch_trash",
          action: "INSERT",
          status: "PENDING",
          proposed_data: {
            title: "Hallazgo Web", // Título genérico basura
            summary: "Corto", // Menos de 15 caracteres
          },
        },
      ],
    };

    const req = new NextRequest(
      "http://localhost:3000/api/internal/webhooks/research-proposals",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${SECRET}` },
        body: JSON.stringify(payload),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    const created = Array.from(dbProposals.values())[0];
    // Invariante: Auto-descartado para proteger la bandeja de moderadores
    expect(created.status).toBe("REJECTED");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 5: Mapeo Seguro de Acciones Especiales (IGNORE / NONE)
  // --------------------------------------------------------------------------
  it("INVARIANTE 5: Acciones IGNORE pasan a REJECTED y NONE pasan a APPROVED (nunca PENDING)", async () => {
    const payload = {
      proposals: [
        {
          person_id: "pers_1",
          batch_run_id: "batch_actions",
          action: "IGNORE",
          status: "PENDING", // Servicio mandó PENDING por defecto
          proposed_data: {
            title: "Ignorable",
            summary: "Resumen lo suficientemente largo para pasar el filtro.",
          },
        },
        {
          person_id: "pers_1",
          batch_run_id: "batch_actions",
          action: "NONE",
          status: "PENDING",
          proposed_data: {
            title: "Sin cambios",
            summary: "Resumen lo suficientemente largo para pasar el filtro.",
          },
        },
      ],
    };

    const req = new NextRequest(
      "http://localhost:3000/api/internal/webhooks/research-proposals",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${SECRET}` },
        body: JSON.stringify(payload),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    const proposals = Array.from(dbProposals.values());
    const propIgnore = proposals.find((p) => p.action === "IGNORE");
    const propNone = proposals.find((p) => p.action === "NONE");

    expect(propIgnore?.status).toBe("REJECTED");
    expect(propNone?.status).toBe("APPROVED");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 6: Ejecución Directa de Propuestas Auto-Aprobadas
  // --------------------------------------------------------------------------
  it("INVARIANTE 6: Propuestas APPROVED de antecedentes penales mutan la persona y recalculan flags", async () => {
    const payload = {
      proposals: [
        {
          person_id: "pers_1",
          batch_run_id: "batch_direct",
          action: "INSERT",
          status: "APPROVED", // Auto-aprobada por alta certeza
          proposed_data: {
            title: "Sentencia por Corrupción de Funcionarios",
            summary:
              "Candidato sentenciado por la sala penal liquidadora en el 2023.",
            type: "PENAL",
            status: "SENTENCIADO",
            source: "Poder Judicial",
          },
        },
      ],
    };

    const req = new NextRequest(
      "http://localhost:3000/api/internal/webhooks/research-proposals",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${SECRET}` },
        body: JSON.stringify(payload),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Debe haberse creado el antecedente penal en background
    expect(dbBackgrounds.size).toBe(1);
    const bg = Array.from(dbBackgrounds.values())[0];
    expect(bg.type).toBe("PENAL");
    expect(bg.status).toBe("SENTENCIADO");

    // Y debe haber actualizado los flags de la persona en cascada
    const person = dbPersons.get("pers_1");
    expect(person?.has_penal_sentence).toBe(true);
    expect(person?.has_criminal_record).toBe(true);
    expect(mockRevalidatePersonEcosystem).toHaveBeenCalled();
  });
});
