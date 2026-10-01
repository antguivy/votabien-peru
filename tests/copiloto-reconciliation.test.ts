import { describe, it, expect } from "vitest";
import { reconcileElection } from "../app/miembro-de-mesa/_lib/reconciliation";

describe("Copiloto Electoral — Reconciliación y Cuadre de Actas", () => {
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
