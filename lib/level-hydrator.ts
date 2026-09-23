import { getRegionByLevel } from "@/constants/regions-data";
import {
  GameLevel,
  LevelProgress,
  LevelStatus,
  TriviaQuestion,
} from "@/interfaces/game-types";
import { TriviaTopic } from "@/interfaces/trivia";

// Exportado para que game-store pueda calcular el tope de niveles
export const QUESTIONS_PER_LEVEL = 3;

function buildLevelDescription(levelId: number): string {
  const isBoss = levelId % 5 === 0;
  if (isBoss) {
    return "¡Nivel jefe!";
  }
  return "Responde correctamente para avanzar al siguiente nivel.";
}

/**
 * Agrupa y balancea las preguntas para el Modo Mapa estructurando cada nivel en 3 slots:
 * - Slot 1: Eje 1 (Competencias de autoridades / Introducción)
 * - Slot 2: Eje 3 (Gestión pública / Funciones / Fiscalización)
 * - Slot 3: Eje 5 (Debates territoriales con video y propuestas locales)
 *
 * El ordenamiento se basa en el índice relativo dentro de cada eje (ordenado por global_index),
 * tolerando huecos, saltos o discontinuidades en los índices de la base de datos.
 */
export function buildStratifiedMapQuestions(
  allQuestions: TriviaQuestion[],
  topics: TriviaTopic[] = [],
  selectedRegionId?: string | null,
): TriviaQuestion[] {
  if (!allQuestions || allQuestions.length === 0) return [];

  // Cuando hay una región seleccionada, se acota el universo estrictamente a:
  // 1. Preguntas generales sin distrito electoral (Ejes 1 y 3)
  // 2. Preguntas de la región seleccionada (Eje 5 territorial)
  // Se excluyen las preguntas de otras regiones para no inflar artificialmente los niveles.
  const eligibleQuestions = selectedRegionId
    ? allQuestions.filter(
        (q) =>
          !q.electoral_district_id ||
          q.electoral_district_id === selectedRegionId,
      )
    : allQuestions;

  // 1. Identificar tópico de debate / multimedia
  const debateTopic = topics.find(
    (t) =>
      t.is_regional ||
      t.has_factcheck ||
      t.slug.includes("camara") ||
      t.slug.includes("debate") ||
      t.slug.includes("video"),
  );

  // Tópicos teóricos / generales
  const generalTopics = topics
    .filter((t) => t.id !== debateTopic?.id && t.slug !== debateTopic?.slug)
    .sort((a, b) => a.order_index - b.order_index);

  // 2. Clasificar pool de debates sobre las preguntas elegibles
  const allDebateQuestions = eligibleQuestions.filter(
    (q) =>
      (debateTopic && q.topic_id === debateTopic.id) ||
      q.display_type === "PERSON" ||
      q.display_type === "PARTY" ||
      Boolean(q.electoral_district_id) ||
      Boolean(q.secondary_sources && q.secondary_sources.length > 0) ||
      Boolean(
        q.source_url &&
          (q.source_url.includes("youtube") || q.source_url.includes("tiktok")),
      ),
  );

  let regionalDebates: TriviaQuestion[] = [];
  let otherDebates: TriviaQuestion[] = [];

  if (selectedRegionId) {
    regionalDebates = allDebateQuestions
      .filter((q) => q.electoral_district_id === selectedRegionId)
      .sort((a, b) => a.global_index - b.global_index);
    // Debates generales neutros (sin distrito electoral asignado)
    otherDebates = allDebateQuestions
      .filter((q) => !q.electoral_district_id)
      .sort((a, b) => a.global_index - b.global_index);
  } else {
    regionalDebates = allDebateQuestions.sort(
      (a, b) => a.global_index - b.global_index,
    );
  }

  // Lista unificada de debates
  const debatePool = [...regionalDebates, ...otherDebates];

  // 3. Agrupar preguntas generales por eje temático en orden de order_index
  const nonDebateQuestions = eligibleQuestions.filter(
    (q) => !allDebateQuestions.some((d) => d.id === q.id),
  );

  const generalPools: TriviaQuestion[][] = generalTopics
    .map((t) =>
      nonDebateQuestions
        .filter((q) => q.topic_id === t.id)
        .sort((a, b) => a.global_index - b.global_index),
    )
    .filter((pool) => pool.length > 0);

  // Si hay preguntas no-debate huérfanas (sin topic_id coincidente con generalTopics), se agregan como pool adicional
  const unassignedGeneral = nonDebateQuestions
    .filter((q) => !generalTopics.some((t) => t.id === q.topic_id))
    .sort((a, b) => a.global_index - b.global_index);
  if (unassignedGeneral.length > 0) {
    generalPools.push(unassignedGeneral);
  }

  // Fallback si no hay pools generales clasificados pero sí preguntas no-debate
  if (generalPools.length === 0 && nonDebateQuestions.length > 0) {
    generalPools.push(
      nonDebateQuestions.sort((a, b) => a.global_index - b.global_index),
    );
  }

  // Punteros para cada pool general y cursor de rotación Round-Robin
  const poolPointers: number[] = new Array(generalPools.length).fill(0);
  let currentPoolIdx = 0;

  const usedIds = new Set<number>();
  const markUsed = (q?: TriviaQuestion) => {
    if (q) usedIds.add(q.id);
  };

  const getNextGeneralQuestion = (): TriviaQuestion | undefined => {
    if (generalPools.length === 0) return undefined;
    const totalPools = generalPools.length;
    for (let attempt = 0; attempt < totalPools; attempt++) {
      const pIdx = currentPoolIdx;
      // Rotamos el cursor para la siguiente invocación
      currentPoolIdx = (currentPoolIdx + 1) % totalPools;

      const pool = generalPools[pIdx];
      while (poolPointers[pIdx] < pool.length) {
        const candidate = pool[poolPointers[pIdx]++];
        if (!usedIds.has(candidate.id)) {
          return candidate;
        }
      }
    }
    return undefined;
  };

  const totalGeneralQuestions = generalPools.reduce(
    (acc, p) => acc + p.length,
    0,
  );
  const maxRounds = Math.max(
    Math.ceil(totalGeneralQuestions / 2),
    debatePool.length,
    Math.ceil(eligibleQuestions.length / 3),
  );

  const stratified: TriviaQuestion[] = [];
  let debIdx = 0;

  for (let round = 0; round < maxRounds; round++) {
    // Slot 1: Round-Robin sobre ejes generales
    let q1: TriviaQuestion | undefined = getNextGeneralQuestion();
    if (!q1) {
      q1 = eligibleQuestions.find((q) => !usedIds.has(q.id));
    }
    if (q1) {
      markUsed(q1);
      stratified.push(q1);
    }

    // Slot 2: Round-Robin sobre ejes generales
    let q2: TriviaQuestion | undefined = getNextGeneralQuestion();
    if (!q2) {
      q2 = eligibleQuestions.find((q) => !usedIds.has(q.id));
    }
    if (q2) {
      markUsed(q2);
      stratified.push(q2);
    }

    // Slot 3: Debate territorial (por posición en el array ordenado)
    let q3: TriviaQuestion | undefined = debatePool[debIdx++];
    while (q3 && usedIds.has(q3.id)) {
      q3 = debatePool[debIdx++];
    }
    if (!q3) {
      q3 = eligibleQuestions.find((q) => !usedIds.has(q.id));
    }
    if (q3) {
      markUsed(q3);
      stratified.push(q3);
    }

    if (!q1 && !q2 && !q3) {
      break;
    }
  }

  // Agregar preguntas restantes elegibles si hubiera alguna
  for (const q of eligibleQuestions) {
    if (!usedIds.has(q.id)) {
      usedIds.add(q.id);
      stratified.push(q);
    }
  }

  return stratified;
}

export function hydrateLevelsWithQuestions(
  rawQuestions: TriviaQuestion[],
  highestUnlockedLevel: number,
  levelsProgress: Record<number, LevelProgress>,
): GameLevel[] {
  if (!rawQuestions || rawQuestions.length === 0) return [];

  // Mantiene el orden curado y estratificado recibido
  const groups: TriviaQuestion[][] = [];
  for (let i = 0; i < rawQuestions.length; i += QUESTIONS_PER_LEVEL) {
    groups.push(rawQuestions.slice(i, i + QUESTIONS_PER_LEVEL));
  }

  return groups.map((questions, idx) => {
    const levelId = idx + 1;
    const region = getRegionByLevel(levelId);
    const progress = levelsProgress[levelId];
    const isBoss = levelId % 5 === 0;

    let status: LevelStatus;
    if (progress?.status === "completed") {
      status = "completed";
    } else if (levelId <= highestUnlockedLevel) {
      status = "unlocked";
    } else {
      status = "locked";
    }

    return {
      id: levelId,
      title: `${region.name} · Nivel ${levelId}`,
      description: buildLevelDescription(levelId),
      region: region.id,
      status,
      stars: progress?.stars ?? 0,
      required_xp: (levelId - 1) * 50,
      is_boss: isBoss,
      questions,
    } satisfies GameLevel;
  });
}
