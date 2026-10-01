import { ReconciliationResult, TallyItem } from "./types";

const FIXED_TALLY_ROWS: { id: string; label: string }[] = [
  { id: "tally-fixed-white", label: "Votos en blanco" },
  { id: "tally-fixed-null", label: "Votos nulos" },
  { id: "tally-fixed-impugned", label: "Votos impugnados" },
];

const FIXED_TALLY_IDS = new Set(FIXED_TALLY_ROWS.map((row) => row.id));

export function isFixedTallyId(id: string): boolean {
  return FIXED_TALLY_IDS.has(id);
}

function tallyLabelKey(label?: string): string {
  return (label ?? "").trim().toLowerCase();
}

/** Parties stay on top. Blancos, nulos and impugnados always close the sheet. */
export function normalizeTallies(items: TallyItem[] = []): TallyItem[] {
  const consumed = new Set<string>();
  const fixed = FIXED_TALLY_ROWS.map((row) => {
    const match = items.find((item) => {
      if (consumed.has(item.id)) return false;
      return (
        item.id === row.id ||
        tallyLabelKey(item.label) === tallyLabelKey(row.label)
      );
    });
    if (match) consumed.add(match.id);
    return {
      id: row.id,
      label: row.label,
      value: Math.max(0, Number(match?.value) || 0),
    };
  });

  const parties = items.filter(
    (item) => !consumed.has(item.id) && !isFixedTallyId(item.id),
  );
  return [...parties, ...fixed];
}

export function emptyTallySheet(): TallyItem[] {
  return normalizeTallies([]);
}

export function calculateTallyTotal(items: TallyItem[] = []): number {
  return normalizeTallies(items).reduce(
    (acc, it) => acc + Math.max(0, Number(it.value) || 0),
    0,
  );
}

export function reconcileElection(
  totalCounted: number,
  targetVoters: number,
): ReconciliationResult {
  if (!targetVoters || targetVoters <= 0) {
    return {
      totalBallotsCounted: totalCounted,
      targetVoters: 0,
      difference: 0,
      status: "pending",
      message:
        "Ingresa el Total de Ciudadanos que Votaron (del Acta de Sufragio) para verificar el cuadre.",
    };
  }

  const diff = totalCounted - targetVoters;

  if (diff === 0) {
    return {
      totalBallotsCounted: totalCounted,
      targetVoters,
      difference: 0,
      status: "match",
      message:
        "¡CUADRE PERFECTO! El Total de Votos Emitidos coincide exactamente con el Total de Ciudadanos que Votaron del Acta de Sufragio.",
    };
  }

  if (diff > 0) {
    return {
      totalBallotsCounted: totalCounted,
      targetVoters,
      difference: diff,
      status: "surplus",
      message: `¡ALERTA DE DESCUADRE! Sobran ${diff} voto(s). Hay ${totalCounted} votos contados en la Hoja Borrador para ${targetVoters} ciudadanos que votaron. Recontar cédulas y marcas.`,
    };
  }

  return {
    totalBallotsCounted: totalCounted,
    targetVoters,
    difference: diff,
    status: "deficit",
    message: `¡ALERTA DE DESCUADRE! Faltan ${Math.abs(diff)} voto(s). Hay ${totalCounted} votos contados en la Hoja Borrador de los ${targetVoters} ciudadanos que votaron. Recontar cédulas y marcas.`,
  };
}
