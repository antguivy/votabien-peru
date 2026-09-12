import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// PRINCIPAL ENGINEER TEST SUITE: TRIVIA GAME SERVER ACTIONS
// ============================================================================
// Enfoque: Verificación de invariantes de dominio en el módulo de trivia:
// 1. Guardias de autorización y degradación de privilegios de publicación (RBAC).
// 2. Mapeo polimórfico de respuestas (PERSON vs PARTY).
// 3. Sincronización transaccional de audiencias M2M.
// 4. Invariante de duplicación segura (monotonía de global_index y borrador forzado).
// 5. Tolerancia a fallos en importación por lotes (bulk import).
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
  id: "usr_editor_1",
  name: "Editor Trivia",
  email: "editor@votabien.pe",
  role: "admin",
};

vi.mock("@/lib/auth-actions", () => ({
  serverRequireReviewer: vi.fn(async () => {
    if (!mockCurrentUser || mockCurrentUser.role === "user") {
      throw new Error("No autorizado: se requiere rol de revisor");
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

// 2. In-Memory Store
interface MockTriviaGame {
  id: bigint;
  topic_id: string | null;
  quote: string;
  title: string | null;
  category: string;
  difficulty: string;
  display_type: string;
  correct_answer_id: string;
  global_index: bigint;
  explanation: string | null;
  source_url: string | null;
  image_url: string | null;
  is_published: boolean;
  options: unknown;
  person_id: string | null;
  political_party_id: string | null;
}

interface MockTriviaAudience {
  id: string;
  question_id: bigint;
  audience_id: string;
}

let dbTrivias: Map<string, MockTriviaGame>;
let dbAudiences: MockTriviaAudience[];
let triviaIdCounter: bigint;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    triviagame: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        triviaIdCounter += BigInt(1);
        const record: MockTriviaGame = {
          id: triviaIdCounter,
          topic_id: (data.topic_id as string) || null,
          quote: data.quote as string,
          title: (data.title as string) || null,
          category: data.category as string,
          difficulty: data.difficulty as string,
          display_type: data.display_type as string,
          correct_answer_id: data.correct_answer_id as string,
          global_index: data.global_index as bigint,
          explanation: (data.explanation as string) || null,
          source_url: (data.source_url as string) || null,
          image_url: (data.image_url as string) || null,
          is_published: Boolean(data.is_published),
          options: data.options,
          person_id: (data.person_id as string) || null,
          political_party_id: (data.political_party_id as string) || null,
        };
        dbTrivias.set(record.id.toString(), record);
        return { ...record };
      }),
      findUnique: vi.fn(
        async ({
          where,
          include,
        }: {
          where: { id: bigint };
          include?: { audiences?: boolean };
        }) => {
          const item = dbTrivias.get(where.id.toString());
          if (!item) return null;
          const res: Record<string, unknown> = { ...item };
          if (include?.audiences) {
            res.audiences = dbAudiences.filter(
              (a) => a.question_id === where.id,
            );
          }
          return JSON.parse(
            JSON.stringify(res, (_, v) =>
              typeof v === "bigint" ? v.toString() : v,
            ),
          );
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: bigint };
          data: Partial<MockTriviaGame>;
        }) => {
          const existing = dbTrivias.get(where.id.toString());
          if (!existing) throw new Error(`Trivia not found: ${where.id}`);
          const updated = { ...existing, ...data };
          dbTrivias.set(where.id.toString(), updated);
          return { ...updated };
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: { in: bigint[] } };
          data: Partial<MockTriviaGame>;
        }) => {
          let count = 0;
          for (const id of where.id.in) {
            const item = dbTrivias.get(id.toString());
            if (item) {
              dbTrivias.set(id.toString(), { ...item, ...data });
              count++;
            }
          }
          return { count };
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: bigint } }) => {
        dbTrivias.delete(where.id.toString());
        dbAudiences = dbAudiences.filter((a) => a.question_id !== where.id);
        return { id: where.id };
      }),
      aggregate: vi.fn(async () => {
        let maxIndex = BigInt(0);
        for (const t of dbTrivias.values()) {
          if (t.global_index > maxIndex) maxIndex = t.global_index;
        }
        return { _max: { global_index: maxIndex } };
      }),
    },
    triviagame_audience: {
      createMany: vi.fn(
        async ({
          data,
        }: {
          data: Array<{ question_id: bigint; audience_id: string }>;
        }) => {
          for (const d of data) {
            dbAudiences.push({
              id: `rel_${Math.random()}`,
              question_id: d.question_id,
              audience_id: d.audience_id,
            });
          }
          return { count: data.length };
        },
      ),
      deleteMany: vi.fn(
        async ({ where }: { where: { question_id: bigint } }) => {
          const initialLen = dbAudiences.length;
          dbAudiences = dbAudiences.filter(
            (a) => a.question_id !== where.question_id,
          );
          return { count: initialLen - dbAudiences.length };
        },
      ),
    },
  },
}));

import {
  createTrivia,
  updateTrivia,
  togglePublishTrivia,
  bulkPublishTrivias,
  bulkUnpublishTrivias,
  duplicateTrivia,
  deleteTrivia,
} from "@/app/admin/(juegos)/trivia/_lib/actions";

describe("Trivia Game Server Actions - Principal Engineer Invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbTrivias = new Map();
    dbAudiences = [];
    triviaIdCounter = BigInt(100);
    mockCurrentUser = {
      id: "usr_admin",
      name: "Admin User",
      email: "admin@votabien.pe",
      role: "admin",
    };
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 1: Degradación Segura de Privilegios de Publicación (RBAC)
  // --------------------------------------------------------------------------
  it("INVARIANTE 1: Usuarios con rol revisor no pueden publicar directamente (se fuerza a borrador)", async () => {
    mockCurrentUser = {
      id: "usr_rev",
      name: "Revisor Junior",
      email: "rev@votabien.pe",
      role: "reviewer",
    };

    const payload = {
      quote: "¿Quién propuso la ley de reforma judicial?",
      title: "Reforma judicial",
      category: "CONGRESO",
      difficulty: "FACIL" as const,
      display_type: "PERSON" as const,
      correct_answer_id: "person_123",
      global_index: 1,
      options: [
        { option_id: "person_123", name: "Congresista A" },
        { option_id: "person_456", name: "Congresista B" },
      ],
      is_published: true, // El revisor intenta publicarla directamente
    };

    const res = await createTrivia(payload);
    expect(res.success).toBe(true);

    const created = dbTrivias.get(res.id!.toString());
    expect(created).toBeDefined();
    // Invariante de seguridad: forzado a borrador para revisor ordinario
    expect(created?.is_published).toBe(false);
  });

  it("INVARIANTE 1.2: Usuarios con rol admin o editor sí pueden publicar directamente", async () => {
    mockCurrentUser = {
      id: "usr_admin",
      name: "Admin Master",
      email: "admin@votabien.pe",
      role: "admin",
    };

    const payload = {
      quote: "¿Cuál fue el primer partido en presentar su plan de gobierno?",
      category: "ELECCIONES",
      difficulty: "MEDIO" as const,
      display_type: "PARTY" as const,
      correct_answer_id: "party_99",
      global_index: 2,
      options: [
        { option_id: "party_99", name: "Partido Alpha" },
        { option_id: "party_88", name: "Partido Beta" },
      ],
      is_published: true,
    };

    const res = await createTrivia(payload);
    expect(res.success).toBe(true);

    const created = dbTrivias.get(res.id!.toString());
    expect(created?.is_published).toBe(true);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 2: Mapeo Polimórfico de Respuestas (PERSON vs PARTY)
  // --------------------------------------------------------------------------
  it("INVARIANTE 2: Asigna person_id o political_party_id según display_type", async () => {
    // 1. PERSON
    const resPerson = await createTrivia({
      quote: "Pregunta sobre candidato",
      category: "CONGRESO",
      difficulty: "DIFICIL" as const,
      display_type: "PERSON" as const,
      correct_answer_id: "candidate_77",
      global_index: 10,
      options: [
        { option_id: "candidate_77", name: "Persona" },
        { option_id: "candidate_88", name: "Persona B" },
      ],
      is_published: false,
    });
    expect(resPerson.success).toBe(true);
    const createdPerson = dbTrivias.get(resPerson.id!.toString());
    expect(createdPerson?.person_id).toBe("candidate_77");
    expect(createdPerson?.political_party_id).toBeNull();

    // 2. PARTY
    const resParty = await createTrivia({
      quote: "Pregunta sobre bancada",
      category: "PARTIDOS",
      difficulty: "FACIL" as const,
      display_type: "PARTY" as const,
      correct_answer_id: "party_55",
      global_index: 11,
      options: [
        { option_id: "party_55", name: "Partido" },
        { option_id: "party_66", name: "Partido B" },
      ],
      is_published: false,
    });
    expect(resParty.success).toBe(true);
    const createdParty = dbTrivias.get(resParty.id!.toString());
    expect(createdParty?.political_party_id).toBe("party_55");
    expect(createdParty?.person_id).toBeNull();
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 3: Sincronización Transaccional de Audiencias (M2M)
  // --------------------------------------------------------------------------
  it("INVARIANTE 3: updateTrivia reemplaza limpiamente las audiencias asociadas sin dejar huérfanas", async () => {
    const res = await createTrivia({
      quote: "¿Conoce a su representante juvenil?",
      category: "JUVENTUD",
      difficulty: "FACIL" as const,
      display_type: "PERSON" as const,
      correct_answer_id: "p_1",
      global_index: 5,
      audience_ids: ["aud_jovenes", "aud_estudiantes"],
      options: [
        { option_id: "p_1", name: "Candidato" },
        { option_id: "p_2", name: "Candidato B" },
      ],
      is_published: false,
    });
    expect(res.success).toBe(true);
    const qId = BigInt(res.id!);

    expect(dbAudiences.filter((a) => a.question_id === qId)).toHaveLength(2);

    const updateRes = await updateTrivia(Number(qId), {
      quote: "¿Conoce a su representante juvenil? (Actualizado)",
      category: "JUVENTUD",
      difficulty: "MEDIO" as const,
      display_type: "PERSON" as const,
      correct_answer_id: "p_1",
      global_index: 5,
      audience_ids: ["aud_profesionales"],
      options: [
        { option_id: "p_1", name: "Candidato" },
        { option_id: "p_2", name: "Candidato B" },
      ],
      is_published: false,
    });
    expect(updateRes.success).toBe(true);

    const currentAudiences = dbAudiences.filter((a) => a.question_id === qId);
    expect(currentAudiences).toHaveLength(1);
    expect(currentAudiences[0].audience_id).toBe("aud_profesionales");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 4: Duplicación Segura (Monotonía de global_index y Borrador Forzado)
  // --------------------------------------------------------------------------
  it("INVARIANTE 4: duplicateTrivia clona con sufijo, incrementa global_index y fuerza borrador", async () => {
    const original: MockTriviaGame = {
      id: BigInt(200),
      topic_id: "top_1",
      quote: "¿Quién promulgó la constitución del 93?",
      title: "Historia Constitucional",
      category: "HISTORIA",
      difficulty: "MEDIO",
      display_type: "PERSON",
      correct_answer_id: "fuji_1",
      global_index: BigInt(40),
      explanation: "Fue promulgada tras el CCD",
      source_url: "https://congreso.gob.pe",
      image_url: null,
      is_published: true,
      options: [
        { option_id: "fuji_1", name: "AF" },
        { option_id: "other_2", name: "Otro" },
      ],
      person_id: "fuji_1",
      political_party_id: null,
    };
    dbTrivias.set(original.id.toString(), original);
    dbAudiences.push({
      id: "rel_1",
      question_id: original.id,
      audience_id: "aud_general",
    });

    const res = await duplicateTrivia(200);
    expect(res.success).toBe(true);

    const copy = dbTrivias.get("101");
    expect(copy).toBeDefined();
    expect(copy?.quote).toBe("¿Quién promulgó la constitución del 93? (Copia)");
    expect(copy?.title).toBe("Historia Constitucional (Copia)");
    expect(copy?.is_published).toBe(false);
    expect(copy?.global_index).toBe(BigInt(41));

    const copyAudiences = dbAudiences.filter(
      (a) => a.question_id === BigInt(101),
    );
    expect(copyAudiences).toHaveLength(1);
    expect(copyAudiences[0].audience_id).toBe("aud_general");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 5: Operaciones Bulk de Publicación con Validación RBAC
  // --------------------------------------------------------------------------
  it("INVARIANTE 5: bulkPublishTrivias y bulkUnpublishTrivias aplican transiciones masivas", async () => {
    dbTrivias.set("301", {
      id: BigInt(301),
      topic_id: null,
      quote: "Q1",
      title: null,
      category: "GEN",
      difficulty: "FACIL",
      display_type: "PERSON",
      correct_answer_id: "p1",
      global_index: BigInt(1),
      explanation: null,
      source_url: null,
      image_url: null,
      is_published: false,
      options: [],
      person_id: null,
      political_party_id: null,
    });
    dbTrivias.set("302", {
      id: BigInt(302),
      topic_id: null,
      quote: "Q2",
      title: null,
      category: "GEN",
      difficulty: "FACIL",
      display_type: "PERSON",
      correct_answer_id: "p2",
      global_index: BigInt(2),
      explanation: null,
      source_url: null,
      image_url: null,
      is_published: false,
      options: [],
      person_id: null,
      political_party_id: null,
    });

    // 1. Revisor intenta publicar en bloque -> Rechazado
    mockCurrentUser = {
      id: "u_rev",
      name: "Rev",
      email: "rev@pe",
      role: "reviewer",
    };
    const rej = await bulkPublishTrivias([301, 302]);
    expect(rej.success).toBe(false);
    expect(dbTrivias.get("301")?.is_published).toBe(false);

    // 2. Admin publica en bloque -> Aceptado
    mockCurrentUser = {
      id: "u_adm",
      name: "Adm",
      email: "adm@pe",
      role: "admin",
    };
    const pub = await bulkPublishTrivias([301, 302]);
    expect(pub.success).toBe(true);
    expect(dbTrivias.get("301")?.is_published).toBe(true);
    expect(dbTrivias.get("302")?.is_published).toBe(true);

    // 3. Admin despublica en bloque
    const unpub = await bulkUnpublishTrivias([301, 302]);
    expect(unpub.success).toBe(true);
    expect(dbTrivias.get("301")?.is_published).toBe(false);
    expect(dbTrivias.get("302")?.is_published).toBe(false);

    // 4. Admin alterna publicación individual (togglePublishTrivia)
    const toggleRes = await togglePublishTrivia(301, true);
    expect(toggleRes.success).toBe(true);
    expect(dbTrivias.get("301")?.is_published).toBe(true);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 6: Eliminación Restringida a Editores/Admins
  // --------------------------------------------------------------------------
  it("INVARIANTE 6: deleteTrivia solo permite a editores o administradores eliminar preguntas", async () => {
    dbTrivias.set("401", {
      id: BigInt(401),
      topic_id: null,
      quote: "Pregunta a eliminar",
      title: null,
      category: "GEN",
      difficulty: "FACIL",
      display_type: "PERSON",
      correct_answer_id: "p1",
      global_index: BigInt(1),
      explanation: null,
      source_url: null,
      image_url: null,
      is_published: false,
      options: [],
      person_id: null,
      political_party_id: null,
    });

    mockCurrentUser = {
      id: "u_rev",
      name: "Rev",
      email: "rev@pe",
      role: "reviewer",
    };
    await expect(deleteTrivia(401)).rejects.toThrow("rol de editor");
    expect(dbTrivias.has("401")).toBe(true);

    mockCurrentUser = {
      id: "u_edit",
      name: "Editor",
      email: "edit@pe",
      role: "editor",
    };
    const res = await deleteTrivia(401);
    expect(res.success).toBe(true);
    expect(dbTrivias.has("401")).toBe(false);
  });
});
