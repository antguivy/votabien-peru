import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// PRINCIPAL ENGINEER TEST SUITE: CANDIDATE REVIEWS SERVER ACTIONS
// ============================================================================
// Enfoque: Verificación de invariantes de dominio, integridad referencial y
// máquinas de estado. No prueba llamadas triviales de mocks ("mockist"), sino
// el comportamiento real de ingestión, reversión, edición y seguridad.
// ============================================================================

// 1. Mocks de infraestructura externa
const mockRevalidatePersonEcosystem = vi.fn();
vi.mock("@/lib/cache-revalidate", () => ({
  revalidatePersonEcosystem: () => mockRevalidatePersonEcosystem(),
}));

let mockUser: { id: string; email: string; role: string } | null = {
  id: "usr_reviewer_1",
  email: "editor@votabien.pe",
  role: "ADMIN",
};

vi.mock("@/lib/auth-actions", () => ({
  serverRequireReviewer: vi.fn(async () => {
    if (!mockUser) {
      throw new Error("No autorizado: se requiere rol de revisor");
    }
    return { user: mockUser };
  }),
}));

// 2. Stateful In-Memory Database Harness (Simulación fiel de Prisma)
interface MockPerson {
  id: string;
  fullname: string;
  posturas: Array<Record<string, unknown>>;
  has_criminal_record: boolean;
  has_penal_sentence: boolean;
  has_sanction: boolean;
  is_under_investigation: boolean;
}

interface MockProposal {
  id: string;
  person_id: string;
  action: string;
  target_id: string | null;
  proposed_data: Record<string, unknown>;
  status: string;
  reviewed_at: Date | null;
  reviewed_by: string | null;
}

interface MockBackground {
  id: string;
  person_id: string;
  title: string;
  summary: string;
  type: string;
  status: string;
  publication_date: string | null;
  sanction: string | null;
  source: string;
  source_url: string | null;
  previous_version?: unknown;
}

let dbPersons: Map<string, MockPerson>;
let dbProposals: Map<string, MockProposal>;
let dbBackgrounds: Map<string, MockBackground>;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const p = dbPersons.get(where.id);
        return p ? JSON.parse(JSON.stringify(p)) : null;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockPerson>;
        }) => {
          const existing = dbPersons.get(where.id);
          if (!existing) throw new Error(`Person ${where.id} not found`);
          const updated = { ...existing, ...data };
          dbPersons.set(where.id, updated);
          return JSON.parse(JSON.stringify(updated));
        },
      ),
    },
    research_proposals: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const prop = dbProposals.get(where.id);
        return prop ? JSON.parse(JSON.stringify(prop)) : null;
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
          return JSON.parse(JSON.stringify(updated));
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: { in: string[] }; status: string };
          data: Partial<MockProposal>;
        }) => {
          let count = 0;
          for (const id of where.id.in) {
            const item = dbProposals.get(id);
            if (item && item.status === where.status) {
              dbProposals.set(id, { ...item, ...data });
              count++;
            }
          }
          return { count };
        },
      ),
    },
    background: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const bg = dbBackgrounds.get(where.id);
        return bg ? JSON.parse(JSON.stringify(bg)) : null;
      }),
      findMany: vi.fn(async ({ where }: { where: { person_id: string } }) => {
        return Array.from(dbBackgrounds.values())
          .filter((bg) => bg.person_id === where.person_id)
          .map((bg) => ({ type: bg.type, status: bg.status }));
      }),
      create: vi.fn(async ({ data }: { data: MockBackground }) => {
        dbBackgrounds.set(data.id, { ...data });
        return JSON.parse(JSON.stringify(data));
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
          return JSON.parse(JSON.stringify(updated));
        },
      ),
      deleteMany: vi.fn(async ({ where }: { where: { id: string } }) => {
        const deleted = dbBackgrounds.delete(where.id);
        return { count: deleted ? 1 : 0 };
      }),
    },
  },
}));

// Importar acciones a probar tras configurar los mocks
import {
  applyResearchFinding,
  revertResearchFinding,
  bulkApplyFindings,
} from "@/app/admin/candidatos/revisiones/actions";

describe("Candidate Reviews Server Actions (Principal Engineer Suite)", () => {
  const candidateId = "candidate_vracko_1";
  const sharedNewsUrl =
    "https://elcomercio.pe/politica/elecciones/reportaje-exclusivo-movimientos-regionales";

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: "usr_reviewer_1",
      email: "editor@votabien.pe",
      role: "ADMIN",
    };

    dbPersons = new Map();
    dbProposals = new Map();
    dbBackgrounds = new Map();

    // Estado inicial: Candidato sin posturas ni antecedentes
    dbPersons.set(candidateId, {
      id: candidateId,
      fullname: "FREDDY ALVARO VRACKO METZGER",
      posturas: [],
      has_criminal_record: false,
      has_penal_sentence: false,
      has_sanction: false,
      is_under_investigation: false,
    });
  });

  // ==========================================================================
  // INVARIANTE 1: INGESTIÓN NO DESTRUCTIVA (Guardián contra el bug original)
  // ==========================================================================
  describe("Invariant 1: Non-destructive News Ingestion", () => {
    it("debe preservar múltiples noticias del candidato que compartan la misma URL de origen sin sobreescribirlas", async () => {
      // Propuesta 1 de El Comercio
      dbProposals.set("prop_1", {
        id: "prop_1",
        person_id: candidateId,
        action: "INSERT",
        target_id: null,
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
        proposed_data: {
          tipo: "CAMPAÑA",
          titulo: "Acuerdo político frustrado con el PRIN",
          descripcion:
            "En marzo de 2024 anunció un acuerdo que se frustró por cupos.",
          fuente: "El Comercio",
          fuente_url: sharedNewsUrl,
          fecha: "2024-03-01",
        },
      });

      // Propuesta 2 de la MISMA nota de El Comercio
      dbProposals.set("prop_2", {
        id: "prop_2",
        person_id: candidateId,
        action: "INSERT",
        target_id: null,
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
        proposed_data: {
          tipo: "TRAYECTORIA",
          titulo: "Candidaturas fallidas a gobernador y congresista",
          descripcion:
            "Ha postulado sin éxito para gobernador regional desde 2016.",
          fuente: "El Comercio",
          fuente_url: sharedNewsUrl,
          fecha: "2024-07-04",
        },
      });

      // 1. Aprobar primera propuesta
      const res1 = await applyResearchFinding("prop_1");
      expect(res1.success).toBe(true);

      const candidateAfterProp1 = dbPersons.get(candidateId)!;
      expect(candidateAfterProp1.posturas).toHaveLength(1);
      expect(candidateAfterProp1.posturas[0].title).toBe(
        "Acuerdo político frustrado con el PRIN",
      );

      // 2. Aprobar segunda propuesta (misma fuente_url)
      const res2 = await applyResearchFinding("prop_2");
      expect(res2.success).toBe(true);

      // Verificación estricta: AMBAS posturas deben convivir en el perfil
      const candidateAfterProp2 = dbPersons.get(candidateId)!;
      expect(candidateAfterProp2.posturas).toHaveLength(2);

      const titles = candidateAfterProp2.posturas.map((p) => p.title);
      expect(titles).toContain("Acuerdo político frustrado con el PRIN");
      expect(titles).toContain(
        "Candidaturas fallidas a gobernador y congresista",
      );

      // Ambos deben tener IDs únicos
      expect(candidateAfterProp2.posturas[0].id).not.toBe(
        candidateAfterProp2.posturas[1].id,
      );
      expect(mockRevalidatePersonEcosystem).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // INVARIANTE 2: AISLAMIENTO ENTRE INSERT Y UPDATE DIRIGIDO
  // ==========================================================================
  describe("Invariant 2: Targeted Update vs Insert Isolation", () => {
    it("debe actualizar únicamente la postura indicada por target_id sin alterar las demás", async () => {
      // Estado con dos posturas ya existentes
      dbPersons.get(candidateId)!.posturas = [
        {
          id: "posture_alpha",
          title: "Postura Original Alfa",
          type: "ECONOMIA",
          date: "2023-01-01",
          description: "Resumen Alfa",
          source: "RPP",
          source_url: "https://rpp.pe/alfa",
        },
        {
          id: "posture_beta",
          title: "Postura Original Beta",
          type: "MEDIOAMBIENTE",
          date: "2023-05-01",
          description: "Resumen Beta",
          source: "Andina",
          source_url: "https://andina.pe/beta",
        },
      ];

      // Propuesta marcada como UPDATE por el servicio de research sobre posture_alpha
      dbProposals.set("prop_update_alpha", {
        id: "prop_update_alpha",
        person_id: candidateId,
        action: "UPDATE",
        target_id: "posture_alpha",
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
        proposed_data: {
          tipo: "ECONOMIA",
          titulo: "Postura Alfa Actualizada con Nueva Evidencia",
          descripcion: "Descripción enriquecida tras debate legislativo",
          fuente: "RPP",
          fuente_url: "https://rpp.pe/alfa-update",
          fecha: "2023-01-01",
        },
      });

      const res = await applyResearchFinding("prop_update_alpha");
      expect(res.success).toBe(true);

      const person = dbPersons.get(candidateId)!;
      expect(person.posturas).toHaveLength(2);

      const updatedAlfa = person.posturas.find((p) => p.id === "posture_alpha");
      expect(updatedAlfa?.title).toBe(
        "Postura Alfa Actualizada con Nueva Evidencia",
      );
      expect(updatedAlfa?.description).toBe(
        "Descripción enriquecida tras debate legislativo",
      );

      // Posture Beta debe permanecer 100% inmutable
      const untouchedBeta = person.posturas.find(
        (p) => p.id === "posture_beta",
      );
      expect(untouchedBeta?.title).toBe("Postura Original Beta");
      expect(untouchedBeta?.description).toBe("Resumen Beta");
    });
  });

  // ==========================================================================
  // INVARIANTE 3: PERSISTENCIA DE EDICIONES MANUALES DEL MODERADOR
  // ==========================================================================
  describe("Invariant 3: Moderation Edit Persistence", () => {
    it("debe persistir el texto editado tanto en el perfil como en el registro de la propuesta", async () => {
      dbProposals.set("prop_raw", {
        id: "prop_raw",
        person_id: candidateId,
        action: "INSERT",
        target_id: null,
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
        proposed_data: {
          tipo: "NOTICIA",
          titulo: "Texto crudo generado por IA con errores",
          descripcion: "Descripcion preliminar con errata",
          fuente: "Web",
          fuente_url: "https://noticia.pe/1",
          fecha: "2024-01-01",
        },
      });

      const customModerationData = {
        tipo: "INSTITUCIONALIDAD",
        type: "INSTITUCIONALIDAD",
        titulo: "Título corregido y verificado por revisor humano",
        title: "Título corregido y verificado por revisor humano",
        descripcion: "Redacción final pulida sin sesgo",
        summary: "Redacción final pulida sin sesgo",
        fuente: "Agencia Andina",
        source: "Agencia Andina",
        fuente_url: "https://noticia.pe/1-oficial",
        source_url: "https://noticia.pe/1-oficial",
        fecha: "2024-01-15",
        publication_date: "2024-01-15",
      };

      const res = await applyResearchFinding("prop_raw", customModerationData);
      expect(res.success).toBe(true);

      // 1. Verificación en person.posturas
      const candidate = dbPersons.get(candidateId)!;
      expect(candidate.posturas).toHaveLength(1);
      const postura = candidate.posturas[0];
      expect(postura.title).toBe(
        "Título corregido y verificado por revisor humano",
      );
      expect(postura.description).toBe("Redacción final pulida sin sesgo");
      expect(postura.date).toBe("2024-01-15");

      // 2. Verificación en research_proposals.proposed_data (para que la bandeja mantenga el cambio al recargar)
      const proposalInDb = dbProposals.get("prop_raw")!;
      expect(proposalInDb.status).toBe("APPROVED");
      expect(proposalInDb.proposed_data).toEqual(customModerationData);
      expect(proposalInDb.target_id).toBe(postura.id);
    });

    it("debe permitir editar y guardar cambios en un card que ya se encontraba aprobado", async () => {
      const existingId = "posture_already_approved";
      dbPersons.get(candidateId)!.posturas = [
        {
          id: existingId,
          title: "Versión Aprobada 1",
          type: "GESTION",
          date: "2024-02-01",
          description: "Texto inicial",
          source: "RPP",
          source_url: "https://rpp.pe/nota",
        },
      ];

      dbProposals.set("prop_approved", {
        id: "prop_approved",
        person_id: candidateId,
        action: "INSERT",
        target_id: existingId,
        status: "APPROVED",
        reviewed_at: new Date(),
        reviewed_by: "editor@votabien.pe",
        proposed_data: {
          tipo: "GESTION",
          titulo: "Versión Aprobada 1",
          descripcion: "Texto inicial",
          fuente: "RPP",
          fuente_url: "https://rpp.pe/nota",
          fecha: "2024-02-01",
        },
      });

      const updatedPayload = {
        tipo: "GESTION",
        type: "GESTION",
        titulo: "Versión Aprobada y Luego Corregida",
        title: "Versión Aprobada y Luego Corregida",
        descripcion: "Texto corregido posteriormente",
        summary: "Texto corregido posteriormente",
        fuente: "RPP",
        source: "RPP",
        fuente_url: "https://rpp.pe/nota",
        source_url: "https://rpp.pe/nota",
        fecha: "2024-02-01",
        publication_date: "2024-02-01",
      };

      const res = await applyResearchFinding("prop_approved", updatedPayload);
      expect(res.success).toBe(true);

      const person = dbPersons.get(candidateId)!;
      expect(person.posturas).toHaveLength(1);
      expect(person.posturas[0].title).toBe(
        "Versión Aprobada y Luego Corregida",
      );
      expect(person.posturas[0].description).toBe(
        "Texto corregido posteriormente",
      );
    });
  });

  // ==========================================================================
  // INVARIANTE 4: REVERSIBILIDAD BIDIRECCIONAL LIMPIA (Transición a PENDING)
  // ==========================================================================
  describe("Invariant 4: Reversible State Transitions", () => {
    it("debe retirar la postura y resetear target_id a null al revertir una propuesta INSERT", async () => {
      // 1. Aprobar propuesta nueva
      dbProposals.set("prop_insert_rev", {
        id: "prop_insert_rev",
        person_id: candidateId,
        action: "INSERT",
        target_id: null,
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
        proposed_data: {
          tipo: "DERECHOS",
          titulo: "Compromiso por la Amazonía",
          descripcion: "Firma de pacto ambiental",
          fuente: "Andina",
          fuente_url: "https://andina.pe/pacto",
          fecha: "2020-01-01",
        },
      });

      await applyResearchFinding("prop_insert_rev");
      expect(dbPersons.get(candidateId)!.posturas).toHaveLength(1);
      expect(dbProposals.get("prop_insert_rev")!.status).toBe("APPROVED");
      const assignedTargetId = dbProposals.get("prop_insert_rev")!.target_id;
      expect(assignedTargetId).toBeTruthy();

      // 2. Revertir la propuesta
      const revRes = await revertResearchFinding("prop_insert_rev");
      expect(revRes.success).toBe(true);

      // Verificaciones:
      // a) La postura fue removida del candidato
      expect(dbPersons.get(candidateId)!.posturas).toHaveLength(0);

      // b) La propuesta volvió a PENDING con target_id null para quedar limpia
      const propAfterRevert = dbProposals.get("prop_insert_rev")!;
      expect(propAfterRevert.status).toBe("PENDING");
      expect(propAfterRevert.target_id).toBeNull();
      expect(propAfterRevert.reviewed_at).toBeNull();
      expect(propAfterRevert.reviewed_by).toBeNull();
    });

    it("revertir una propuesta no debe afectar otras posturas que compartan su misma URL", async () => {
      // Simular candidato con dos noticias de La República
      const lrUrl = "https://larepublica.pe/politica/declaraciones-candidato";
      dbPersons.get(candidateId)!.posturas = [
        {
          id: "pos_1",
          title: "Noticia Uno",
          type: "CONTROVERSIA",
          date: "2024-06-01",
          description: "Detalle uno",
          source: "La República",
          source_url: lrUrl,
        },
        {
          id: "pos_2",
          title: "Noticia Dos",
          type: "INSTITUCIONALIDAD",
          date: "2024-06-01",
          description: "Detalle dos",
          source: "La República",
          source_url: lrUrl,
        },
      ];

      dbProposals.set("prop_for_pos1", {
        id: "prop_for_pos1",
        person_id: candidateId,
        action: "INSERT",
        target_id: "pos_1",
        status: "APPROVED",
        reviewed_at: new Date(),
        reviewed_by: "reviewer",
        proposed_data: {
          tipo: "CONTROVERSIA",
          titulo: "Noticia Uno",
          descripcion: "Detalle uno",
          fuente: "La República",
          fuente_url: lrUrl,
          fecha: "2024-06-01",
        },
      });

      // Revertir solo prop_for_pos1
      const res = await revertResearchFinding("prop_for_pos1");
      expect(res.success).toBe(true);

      // pos_1 se fue, pero pos_2 (misma URL) permanece intacta
      const remaining = dbPersons.get(candidateId)!.posturas;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("pos_2");
      expect(remaining[0].title).toBe("Noticia Dos");
    });

    it("debe permitir revertir un hallazgo REJECTED de vuelta a PENDING sin arrojar error", async () => {
      dbProposals.set("prop_rejected", {
        id: "prop_rejected",
        person_id: candidateId,
        action: "INSERT",
        target_id: null,
        status: "REJECTED",
        reviewed_at: new Date(),
        reviewed_by: "reviewer",
        proposed_data: {
          tipo: "CAMPAÑA",
          titulo: "Rechazado por error",
          descripcion: "Hecho verídico",
          fuente: "El Comercio",
          fuente_url: "https://elcomercio.pe/nota",
          fecha: "2024-01-01",
        },
      });

      const res = await revertResearchFinding("prop_rejected");
      expect(res.success).toBe(true);

      const prop = dbProposals.get("prop_rejected")!;
      expect(prop.status).toBe("PENDING");
      expect(prop.reviewed_at).toBeNull();
      expect(prop.reviewed_by).toBeNull();
    });
  });

  // ==========================================================================
  // INVARIANTE 5: CÁLCULO DE FLAGS PENALES Y ANTECEDENTES
  // ==========================================================================
  describe("Invariant 5: Background Processing & Person Flag Recalculation", () => {
    it("debe crear antecedente penal y encender los flags correspondientes en la persona", async () => {
      dbProposals.set("prop_penal", {
        id: "prop_penal",
        person_id: candidateId,
        action: "INSERT",
        target_id: null,
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
        proposed_data: {
          tipo: "PENAL",
          type: "PENAL",
          estado: "EN_INVESTIGACION",
          status: "EN_INVESTIGACION",
          titulo: "Investigación preparatoria por colusión",
          title: "Investigación preparatoria por colusión",
          descripcion: "Fiscalía anticorrupción abre diligencias.",
          summary: "Fiscalía anticorrupción abre diligencias.",
          fuente: "Poder Judicial",
          fecha: "2023-08-01",
        },
      });

      const res = await applyResearchFinding("prop_penal");
      expect(res.success).toBe(true);

      expect(dbBackgrounds.size).toBe(1);
      const bg = Array.from(dbBackgrounds.values())[0];
      expect(bg.type).toBe("PENAL");
      expect(bg.status).toBe("EN_INVESTIGACION");

      // Verificación de flags recalculados en la persona
      const person = dbPersons.get(candidateId)!;
      expect(person.has_criminal_record).toBe(true);
      expect(person.is_under_investigation).toBe(true);
      expect(person.has_penal_sentence).toBe(false);
    });

    it("al revertir un antecedente debe retirar el registro y apagar los flags penales", async () => {
      const bgId = "bg_sentenciado_1";
      dbBackgrounds.set(bgId, {
        id: bgId,
        person_id: candidateId,
        title: "Sentencia por peculado",
        summary: "Sentencia condenatoria",
        type: "PENAL",
        status: "SENTENCIADO",
        publication_date: "2022-01-01",
        sanction: "4 años suspendida",
        source: "Corte Superior",
        source_url: null,
      });

      dbPersons.get(candidateId)!.has_criminal_record = true;
      dbPersons.get(candidateId)!.has_penal_sentence = true;

      dbProposals.set("prop_penal_sent", {
        id: "prop_penal_sent",
        person_id: candidateId,
        action: "INSERT",
        target_id: bgId,
        status: "APPROVED",
        reviewed_at: new Date(),
        reviewed_by: "editor",
        proposed_data: {
          tipo: "PENAL",
          type: "PENAL",
          estado: "SENTENCIADO",
          status: "SENTENCIADO",
          titulo: "Sentencia por peculado",
          descripcion: "Sentencia condenatoria",
          fuente: "Corte Superior",
        },
      });

      const res = await revertResearchFinding("prop_penal_sent");
      expect(res.success).toBe(true);

      expect(dbBackgrounds.size).toBe(0);
      const person = dbPersons.get(candidateId)!;
      expect(person.has_criminal_record).toBe(false);
      expect(person.has_penal_sentence).toBe(false);
    });
  });

  // ==========================================================================
  // INVARIANTE 6: FRONTERA DE SEGURIDAD (RBAC)
  // ==========================================================================
  describe("Invariant 6: Security and Role Boundaries", () => {
    it("debe bloquear la aplicación de hallazgos si el usuario no tiene permisos de revisor", async () => {
      mockUser = null; // Usuario no autenticado

      dbProposals.set("prop_sec", {
        id: "prop_sec",
        person_id: candidateId,
        action: "INSERT",
        target_id: null,
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
        proposed_data: {
          tipo: "CAMPAÑA",
          titulo: "Test de seguridad",
        },
      });

      await expect(applyResearchFinding("prop_sec")).rejects.toThrow(
        "No autorizado",
      );

      // La base de datos debe permanecer intacta
      expect(dbPersons.get(candidateId)!.posturas).toHaveLength(0);
      expect(dbProposals.get("prop_sec")!.status).toBe("PENDING");
    });
  });

  // ==========================================================================
  // INVARIANTE 7: APROBACIÓN MASIVA SECUENCIAL SIN COLISIONES
  // ==========================================================================
  describe("Invariant 7: Bulk Approval Sequential Integrity", () => {
    it("debe aplicar múltiples hallazgos masivamente sin generar colisiones ni sobreescrituras", async () => {
      const ids: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const id = `bulk_prop_${i}`;
        ids.push(id);
        dbProposals.set(id, {
          id,
          person_id: candidateId,
          action: "INSERT",
          target_id: null,
          status: "PENDING",
          reviewed_at: null,
          reviewed_by: null,
          proposed_data: {
            tipo: "NOTICIA",
            titulo: `Noticia Masiva ${i}`,
            descripcion: `Contenido del hecho número ${i}`,
            fuente: "El Comercio",
            fuente_url: sharedNewsUrl, // Mismo URL para probar que masivamente tampoco colisionan
            fecha: `2024-0${i}-01`,
          },
        });
      }

      const res = await bulkApplyFindings(ids);
      expect(res.success).toBe(true);
      expect(res.count).toBe(3);

      const candidate = dbPersons.get(candidateId)!;
      expect(candidate.posturas).toHaveLength(3);

      const titles = candidate.posturas.map((p) => p.title);
      expect(titles).toContain("Noticia Masiva 1");
      expect(titles).toContain("Noticia Masiva 2");
      expect(titles).toContain("Noticia Masiva 3");
    });
  });
});
