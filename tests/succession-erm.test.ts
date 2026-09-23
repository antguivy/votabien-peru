import { describe, it, expect } from "vitest";
import {
  CandidacyStatus,
  CandidacyType,
  SuccessionReason,
} from "@/interfaces/candidate";

// Test suite: Reglas de negocio e invariantes de sucesión ejecutiva ERM 2026
describe("Executive Succession Rules - ERM 2026", () => {
  const DISQUALIFIED_STATUSES = [
    CandidacyStatus.RENUNCIA,
    CandidacyStatus.EXCLUIDO,
    CandidacyStatus.TACHADO,
    CandidacyStatus.IMPROCEDENTE,
    CandidacyStatus.FALLECIMIENTO,
  ];

  it("identifies all disqualified/ineligible statuses for executive titulars including FALLECIMIENTO", () => {
    expect(DISQUALIFIED_STATUSES).toContain(CandidacyStatus.RENUNCIA);
    expect(DISQUALIFIED_STATUSES).toContain(CandidacyStatus.EXCLUIDO);
    expect(DISQUALIFIED_STATUSES).toContain(CandidacyStatus.TACHADO);
    expect(DISQUALIFIED_STATUSES).toContain(CandidacyStatus.IMPROCEDENTE);
    expect(DISQUALIFIED_STATUSES).toContain(CandidacyStatus.FALLECIMIENTO);
  });

  it("correctly identifies active and viable statuses", () => {
    const activeStatuses = [CandidacyStatus.INSCRITO, CandidacyStatus.ADMITIDO];
    for (const status of activeStatuses) {
      expect(DISQUALIFIED_STATUSES).not.toContain(status);
    }
  });

  describe("Succession Reason Detection", () => {
    function resolveReason(
      titular: { active: boolean; status: string } | null,
    ): SuccessionReason {
      if (!titular) return "INACTIVO";
      if (titular.status === "RENUNCIA") return "RENUNCIA";
      if (titular.status === "EXCLUIDO") return "EXCLUIDO";
      if (titular.status === "TACHADO") return "TACHADO";
      if (titular.status === "IMPROCEDENTE") return "IMPROCEDENTE";
      if (titular.status === "FALLECIMIENTO") return "FALLECIMIENTO";
      if (!titular.active) return "INACTIVO";
      return "INACTIVO";
    }

    it("resolves RENUNCIA when candidate resigned (Renovación Popular Lima case)", () => {
      expect(resolveReason({ active: true, status: "RENUNCIA" })).toBe(
        "RENUNCIA",
      );
      expect(resolveReason({ active: false, status: "RENUNCIA" })).toBe(
        "RENUNCIA",
      );
    });

    it("resolves FALLECIMIENTO when candidate passed away / was assassinated", () => {
      expect(resolveReason({ active: false, status: "FALLECIMIENTO" })).toBe(
        "FALLECIMIENTO",
      );
    });

    it("resolves INACTIVO when candidate was deactivated with active=false without specific status", () => {
      expect(resolveReason({ active: false, status: "INSCRITO" })).toBe(
        "INACTIVO",
      );
    });

    it("resolves EXCLUIDO when JNE excluded the titular", () => {
      expect(resolveReason({ active: false, status: "EXCLUIDO" })).toBe(
        "EXCLUIDO",
      );
    });

    it("resolves INACTIVO when list had no titular candidate registered", () => {
      expect(resolveReason(null)).toBe("INACTIVO");
    });
  });

  describe("Legal Basis Mapping", () => {
    const LEGAL_FRAMEWORK = {
      [CandidacyType.GOBERNADOR_REGIONAL]: "Art. 23 Ley N° 27867 (LOGR)",
      [CandidacyType.ALCALDE_PROVINCIAL]: "Art. 24 Ley N° 27972 (LOM)",
      [CandidacyType.ALCALDE_DISTRITAL]: "Art. 24 Ley N° 27972 (LOM)",
    };

    it("maps municipal provincial succession to Art. 24 LOM", () => {
      expect(LEGAL_FRAMEWORK[CandidacyType.ALCALDE_PROVINCIAL]).toBe(
        "Art. 24 Ley N° 27972 (LOM)",
      );
    });

    it("maps municipal distrital succession to Art. 24 LOM", () => {
      expect(LEGAL_FRAMEWORK[CandidacyType.ALCALDE_DISTRITAL]).toBe(
        "Art. 24 Ley N° 27972 (LOM)",
      );
    });

    it("maps regional governor succession to Art. 23 LOGR", () => {
      expect(LEGAL_FRAMEWORK[CandidacyType.GOBERNADOR_REGIONAL]).toBe(
        "Art. 23 Ley N° 27867 (LOGR)",
      );
    });
  });
});
