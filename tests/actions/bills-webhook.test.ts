import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ============================================================================
// PRINCIPAL ENGINEER TEST SUITE: BILLS INGESTION WEBHOOK GATEWAY
// ============================================================================
// Enfoque: Verificación exhaustiva de contratos entre microservicio Python y DB:
// 1. Barrera de Seguridad (Bearer API_SECRET_KEY) en GET y POST.
// 2. Validación estructural de payloads (rechazo de no-arrays).
// 3. Manejo de campos obligatorios faltantes (number, submission_date).
// 4. Invariante de autor obligatorio en inserción (skipped_sin_autor).
// 5. Inserción con parseo y normalización de fechas (DD/MM/YYYY vs ISO).
// 6. Actualización no destructiva con preservación de campos previos y cosponsors.
// 7. Reasignación de autor: recálculo simultáneo para legislador anterior y nuevo.
// 8. Invariante matemático del recálculo de métricas legislativas (upsert en cascada).
// 9. Snapshot GET con filtrado opcional por periodo.
// ============================================================================

vi.mock("@paralleldrive/cuid2", () => {
  let counter = 0;
  return {
    createId: () => `cuid_bill_${++counter}`,
  };
});

interface MockBill {
  id: string;
  number: string;
  title: string | null;
  summary: string | null;
  submission_date: Date;
  approval_status: string;
  approval_date: Date | null;
  sponsor: string | null;
  period: string | null;
  legislative_session: string | null;
  committees: string | null;
  document_url: string | null;
  title_ai: string | null;
  legislator_id: string;
  parliamentary_group_id: string | null;
  coauthors: string | null;
  cosponsors: string | null;
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
      findUnique: vi.fn(
        async ({ where }: { where: { number?: string; id?: string } }) => {
          if (where.number) {
            const b = dbBills.get(where.number);
            return b ? { ...b } : null;
          }
          if (where.id) {
            for (const b of dbBills.values()) {
              if (b.id === where.id) return { ...b };
            }
          }
          return null;
        },
      ),
      findMany: vi.fn(
        async (args?: {
          where?: { period?: string; legislator_id?: string };
        }) => {
          let list = Array.from(dbBills.values());
          if (args?.where?.period) {
            list = list.filter((b) => b.period === args.where!.period);
          }
          if (args?.where?.legislator_id) {
            list = list.filter(
              (b) => b.legislator_id === args.where!.legislator_id,
            );
          }
          return list.map((b) => ({ ...b }));
        },
      ),
      create: vi.fn(async ({ data }: { data: MockBill }) => {
        dbBills.set(data.number, { ...data });
        return { ...data };
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { number: string };
          data: Partial<MockBill>;
        }) => {
          const existing = dbBills.get(where.number);
          if (!existing) throw new Error(`Bill ${where.number} not found`);
          const updated = { ...existing, ...data };
          dbBills.set(where.number, updated);
          return { ...updated };
        },
      ),
    },
    legislatormetrics: {
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
            const merged = { ...existing, ...update, last_updated: new Date() };
            dbMetrics.set(where.legislator_id, merged);
            return merged;
          } else {
            const created = { ...create, last_updated: new Date() };
            dbMetrics.set(where.legislator_id, created);
            return created;
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

import { GET, POST } from "@/app/api/webhooks/bills/route";

describe("Bills Webhook Gateway - Principal Engineer & QA Architecture Suite", () => {
  const SECRET = "test_bills_webhook_secret_key";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_SECRET_KEY = SECRET;
    dbBills = new Map();
    dbMetrics = new Map();
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 1: Barrera de Autenticación
  // --------------------------------------------------------------------------
  it("INVARIANTE 1: Rechaza peticiones sin token o con token incorrecto tanto en GET como POST (401)", async () => {
    // GET sin auth
    const reqGet = new NextRequest("http://localhost:3000/api/webhooks/bills");
    const resGet = await GET(reqGet);
    expect(resGet.status).toBe(401);

    // POST con token incorrecto
    const reqPost = new NextRequest(
      "http://localhost:3000/api/webhooks/bills",
      {
        method: "POST",
        headers: { Authorization: "Bearer bad_secret" },
        body: JSON.stringify([]),
      },
    );
    const resPost = await POST(reqPost);
    expect(resPost.status).toBe(401);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 2: Validación Estructural de Payloads
  // --------------------------------------------------------------------------
  it("INVARIANTE 2: Rechaza payloads POST que no sean un arreglo arrojando 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/bills", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}` },
      body: JSON.stringify({ not_an_array: true }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("array");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 3: Manejo Defensivo de Campos Requeridos
  // --------------------------------------------------------------------------
  it("INVARIANTE 3: Registra error y salta proyectos sin número o sin fecha de presentación", async () => {
    const payload = [
      {
        title: "Ley sin número ni fecha",
      },
      {
        number: "00001/2026-CR",
        // Falta submission_date
        title: "Ley sin fecha",
        legislator_id: "leg_1",
      },
    ];

    const req = new NextRequest("http://localhost:3000/api/webhooks/bills", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}` },
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results.inserted).toBe(0);
    expect(body.results.errors).toHaveLength(2);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 4: Inserción de Proyectos Institucionales (Poder Ejecutivo, Colegios, etc.)
  // --------------------------------------------------------------------------
  it("INVARIANTE 4: Si un proyecto nuevo no tiene legislator_id, se inserta como proyecto institucional sin autor congresal", async () => {
    const payload = [
      {
        number: "00100/2026-CR",
        submission_date: "2026-08-01",
        title: "Ley de iniciativa ciudadana o del Poder Ejecutivo",
        sponsor: "Poder Ejecutivo",
        legislator_id: null,
      },
    ];

    const req = new NextRequest("http://localhost:3000/api/webhooks/bills", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}` },
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.results.inserted).toBe(1);
    expect(dbBills.has("00100/2026-CR")).toBe(true);
    expect(dbBills.get("00100/2026-CR").legislator_id).toBeNull();
    expect(dbBills.get("00100/2026-CR").sponsor).toBe("Poder Ejecutivo");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 5: Inserción Exitosa con Normalización de Fechas y Métricas
  // --------------------------------------------------------------------------
  it("INVARIANTE 5: Inserta proyecto nuevo con fecha DD/MM/YYYY, estandariza estado y recalcula métricas", async () => {
    const legId = "leg_autor_1";
    const payload = [
      {
        number: "00200/2026-CR",
        title: "Ley General de Aguas",
        summary: "Sumilla oficial",
        submission_date: "15/08/2026", // Formato peruano con barras
        approval_status: "EN_COMISION",
        period: "2026-2031",
        legislator_id: legId,
        sponsor: "García Correa Idelso",
        coauthors: "Julón Irigoín Elva; Cruz Mamani Flavio",
        cosponsors: "Bancada APP",
      },
    ];

    const req = new NextRequest("http://localhost:3000/api/webhooks/bills", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}` },
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.results.inserted).toBe(1);

    const saved = dbBills.get("00200/2026-CR");
    expect(saved).toBeDefined();
    expect(saved!.title).toBe("Ley General de Aguas");
    expect(saved!.submission_date.toISOString()).toContain("2026-08-15");
    expect(saved!.cosponsors).toBe("Bancada APP");

    // Recálculo de métricas en legislatormetrics
    const metrics = dbMetrics.get(legId);
    expect(metrics).toBeDefined();
    expect(metrics!.total_bills).toBe(1);
    expect(metrics!.bills_en_comision).toBe(1);
    expect(metrics!.bills_en_proceso).toBe(1);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 6: Actualización No Destructiva y Preservación de Cosponsors
  // --------------------------------------------------------------------------
  it("INVARIANTE 6: Actualiza proyecto existente preservando campos no provistos (cosponsors, título IA)", async () => {
    const legId = "leg_autor_2";

    // Proyecto preexistente con título IA y cosponsors
    dbBills.set("00300/2026-CR", {
      id: "bill_300",
      number: "00300/2026-CR",
      title: "Ley de Turismo",
      title_ai: "Fomento al turismo en comunidades altoandinas",
      summary: "Resumen inicial",
      submission_date: new Date("2026-08-01"),
      approval_status: "PRESENTADO",
      approval_date: null,
      sponsor: "Congresista Original",
      period: "2026-2031",
      legislative_session: null,
      committees: "Comisión de Comercio Exterior",
      document_url: "https://congreso.gob.pe/doc300.pdf",
      legislator_id: legId,
      parliamentary_group_id: "pg_1",
      coauthors: "Autor 2",
      cosponsors: "Bancada Fuerza Popular",
    });

    // Webhook envía actualización de estado a APROBADO pero sin cosponsors ni título IA
    const payload = [
      {
        number: "00300/2026-CR",
        submission_date: "2026-08-01",
        approval_status: "APROBADO",
        approval_date: "2026-09-10",
        // no envía title_ai ni cosponsors ni document_url
      },
    ];

    const req = new NextRequest("http://localhost:3000/api/webhooks/bills", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}` },
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.results.updated).toBe(1);

    const updated = dbBills.get("00300/2026-CR")!;
    expect(updated.approval_status).toBe("APROBADO");
    // Preservados:
    expect(updated.title_ai).toBe(
      "Fomento al turismo en comunidades altoandinas",
    );
    expect(updated.cosponsors).toBe("Bancada Fuerza Popular");
    expect(updated.document_url).toBe("https://congreso.gob.pe/doc300.pdf");
    expect(updated.approval_date).toBeDefined();

    // Métricas del legislador deben reflejar APROBADO
    const metrics = dbMetrics.get(legId)!;
    expect(metrics.bills_aprobado).toBe(1);
    expect(metrics.bills_en_proceso).toBe(0);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 7: Reasignación de Autor Recalcula Métricas de AMBOS Legisladores
  // --------------------------------------------------------------------------
  it("INVARIANTE 7: Si se actualiza el autor, se recalculan métricas tanto del legislador anterior como del nuevo", async () => {
    const legAntiguo = "leg_antiguo";
    const legNuevo = "leg_nuevo";

    dbBills.set("00400/2026-CR", {
      id: "bill_400",
      number: "00400/2026-CR",
      title: "Ley de Inteligencia Artificial",
      title_ai: null,
      summary: null,
      submission_date: new Date("2026-08-01"),
      approval_status: "PUBLICADO", // Cuenta como aprobado
      approval_date: new Date("2026-09-01"),
      sponsor: "Autor Antiguo",
      period: "2026-2031",
      legislative_session: null,
      committees: null,
      document_url: null,
      legislator_id: legAntiguo,
      parliamentary_group_id: null,
      coauthors: null,
      cosponsors: null,
    });

    // Simulamos métricas iniciales del legislador antiguo (1 aprobado)
    dbMetrics.set(legAntiguo, {
      legislator_id: legAntiguo,
      total_bills: 1,
      bills_presentado: 0,
      bills_en_comision: 0,
      bills_aprobado: 1,
      bills_rechazado: 0,
      bills_retirado_por_autor: 0,
      bills_en_proceso: 0,
      last_updated: new Date(),
    });

    // Webhook transfiere el proyecto al nuevo legislador
    const payload = [
      {
        number: "00400/2026-CR",
        submission_date: "2026-08-01",
        legislator_id: legNuevo,
        sponsor: "Autor Nuevo Corregido",
      },
    ];

    const req = new NextRequest("http://localhost:3000/api/webhooks/bills", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}` },
      body: JSON.stringify(payload),
    });
    await POST(req);

    // El legislador antiguo ahora debe tener 0 proyectos
    const metricsAntiguo = dbMetrics.get(legAntiguo)!;
    expect(metricsAntiguo.total_bills).toBe(0);
    expect(metricsAntiguo.bills_aprobado).toBe(0);

    // El nuevo legislador debe tener 1 proyecto PUBLICADO (aprobado)
    const metricsNuevo = dbMetrics.get(legNuevo)!;
    expect(metricsNuevo.total_bills).toBe(1);
    expect(metricsNuevo.bills_aprobado).toBe(1);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 8: Snapshot GET para el Diffing de Python
  // --------------------------------------------------------------------------
  it("INVARIANTE 8: Endpoint GET retorna mapa indexado por número de proyecto y filtra por periodo", async () => {
    dbBills.set("00501/2026-CR", {
      id: "b_501",
      number: "00501/2026-CR",
      title: "Ley Periodo 2026",
      title_ai: null,
      summary: null,
      submission_date: new Date(),
      approval_status: "PRESENTADO",
      approval_date: null,
      sponsor: null,
      period: "2026-2031",
      legislative_session: null,
      committees: null,
      document_url: null,
      legislator_id: "leg_1",
      parliamentary_group_id: null,
      coauthors: null,
      cosponsors: null,
    });

    dbBills.set("00100/2021-CR", {
      id: "b_100",
      number: "00100/2021-CR",
      title: "Ley Periodo 2021",
      title_ai: null,
      summary: null,
      submission_date: new Date(),
      approval_status: "APROBADO",
      approval_date: null,
      sponsor: null,
      period: "2021-2026",
      legislative_session: null,
      committees: null,
      document_url: null,
      legislator_id: "leg_old",
      parliamentary_group_id: null,
      coauthors: null,
      cosponsors: null,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/bills?period=2026-2031",
      {
        headers: { Authorization: `Bearer ${SECRET}` },
      },
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.count).toBe(1);
    expect(body.bills["00501/2026-CR"]).toBeDefined();
    expect(body.bills["00100/2021-CR"]).toBeUndefined();
  });
});
