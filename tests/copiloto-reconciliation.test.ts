import { describe, it, expect } from "vitest";
import {
  calculateElectionTotals,
  reconcileElection,
  createInitialElectionSheet,
} from "../app/miembro-de-mesa/_lib/reconciliation";
import { ElectionSheetState } from "../app/miembro-de-mesa/_lib/types";

describe("Copiloto Electoral — Reconciliación y Cuadre de Actas", () => {
  it("debe inicializar correctamente una hoja de votación", () => {
    const sheet = createInitialElectionSheet(
      "5A",
      "Gobernador",
      "Subtítulo de prueba",
    );

    expect(sheet.type).toBe("5A");
    expect(sheet.options.length).toBe(0);
    expect(sheet.whiteVotes).toBe(0);
    expect(sheet.nullVotes).toBe(0);
    expect(sheet.impugnedVotes).toBe(0);

    const { validVotes, totalVotes } = calculateElectionTotals(sheet);
    expect(validVotes).toBe(0);
    expect(totalVotes).toBe(0);
  });

  it("debe sumar correctamente los votos válidos de todos los partidos", () => {
    const sheet: ElectionSheetState = {
      type: "5A",
      title: "Gobernador",
      subtitle: "Prueba",
      options: [
        { id: "1", name: "Partido A", votes: 45 },
        { id: "2", name: "Partido B", votes: 60 },
        { id: "3", name: "Partido C", votes: 30 },
      ],
      whiteVotes: 0,
      nullVotes: 0,
      impugnedVotes: 0,
    };

    const { validVotes, totalVotes } = calculateElectionTotals(sheet);
    expect(validVotes).toBe(135);
    expect(totalVotes).toBe(135);
  });

  it("debe sumar votos en blanco, nulos e impugnados al total emitido", () => {
    const sheet: ElectionSheetState = {
      type: "5B",
      title: "Consejeros",
      subtitle: "Prueba",
      options: [
        { id: "1", name: "Partido A", votes: 100 },
        { id: "2", name: "Partido B", votes: 50 },
      ],
      whiteVotes: 12,
      nullVotes: 8,
      impugnedVotes: 2,
    };

    const { validVotes, totalVotes } = calculateElectionTotals(sheet);
    expect(validVotes).toBe(150);
    expect(totalVotes).toBe(172); // 150 + 12 + 8 + 2
  });

  it("debe ignorar valores negativos de forma defensiva", () => {
    const sheet: ElectionSheetState = {
      type: "5C",
      title: "Provincial",
      subtitle: "Prueba",
      options: [{ id: "1", name: "Partido A", votes: -10 }],
      whiteVotes: -5,
      nullVotes: 20,
      impugnedVotes: 0,
    };

    const { validVotes, totalVotes } = calculateElectionTotals(sheet);
    expect(validVotes).toBe(0);
    expect(totalVotes).toBe(20);
  });

  it("debe devolver estado 'pending' si el padrón base de votantes es 0 o negativo", () => {
    const res = reconcileElection(150, 0);
    expect(res.status).toBe("pending");
    expect(res.difference).toBe(0);
  });

  it("debe detectar un CUADRE PERFECTO cuando votos contados == votantes", () => {
    const res = reconcileElection(245, 245);
    expect(res.status).toBe("match");
    expect(res.difference).toBe(0);
    expect(res.message).toContain("CUADRE PERFECTO");
  });

  it("debe detectar SOBRANTE (surplus) cuando hay más votos que votantes", () => {
    const res = reconcileElection(248, 245);
    expect(res.status).toBe("surplus");
    expect(res.difference).toBe(3);
    expect(res.message).toContain("Sobran 3 voto(s)");
  });

  it("debe detectar FALTANTE (deficit) cuando hay menos votos que votantes", () => {
    const res = reconcileElection(240, 245);
    expect(res.status).toBe("deficit");
    expect(res.difference).toBe(-5);
    expect(res.message).toContain("Faltan 5 voto(s)");
  });
});
