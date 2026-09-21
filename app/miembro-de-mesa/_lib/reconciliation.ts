import {
  ElectionSheetState,
  ElectionType,
  ReconciliationResult,
} from "./types";

export function createInitialElectionSheet(
  type: ElectionType,
  title: string,
  subtitle: string,
): ElectionSheetState {
  return {
    type,
    title,
    subtitle,
    options: [
      { id: "opt-1", name: "Organización Política 1", votes: 0 },
      { id: "opt-2", name: "Organización Política 2", votes: 0 },
      { id: "opt-3", name: "Organización Política 3", votes: 0 },
      { id: "opt-4", name: "Organización Política 4", votes: 0 },
    ],
    whiteVotes: 0,
    nullVotes: 0,
    impugnedVotes: 0,
  };
}

export function calculateElectionTotals(sheet: ElectionSheetState): {
  validVotes: number;
  totalVotes: number;
} {
  const validVotes = sheet.options.reduce(
    (acc, opt) => acc + Math.max(0, Number(opt.votes) || 0),
    0,
  );
  const white = Math.max(0, Number(sheet.whiteVotes) || 0);
  const nulled = Math.max(0, Number(sheet.nullVotes) || 0);
  const impugned = Math.max(0, Number(sheet.impugnedVotes) || 0);

  const totalVotes = validVotes + white + nulled + impugned;
  return { validVotes, totalVotes };
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
        "¡CUADRE PERFECTO! La suma de votos en la hoja borrador coincide exactamente con el padrón de electores.",
    };
  }

  if (diff > 0) {
    return {
      totalBallotsCounted: totalCounted,
      targetVoters,
      difference: diff,
      status: "surplus",
      message: `¡ALERTA DE DESCUADRE! Sobran ${diff} voto(s). Hay ${totalCounted} votos contados para ${targetVoters} electores. Recontar hojas borrador.`,
    };
  }

  return {
    totalBallotsCounted: totalCounted,
    targetVoters,
    difference: diff,
    status: "deficit",
    message: `¡ALERTA DE DESCUADRE! Faltan ${Math.abs(diff)} voto(s). Hay ${totalCounted} votos contados de los ${targetVoters} electores requeridos. Recontar hojas borrador.`,
  };
}
