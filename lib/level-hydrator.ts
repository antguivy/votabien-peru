// lib/level-hydrator.ts
// Groups raw API questions into GameLevel objects.
// 4 questions per level — every 5th level is a "boss" level.
// Status derives from highestUnlockedLevel + persisted levelsProgress.

import { getRegionByLevel } from "@/constants/regions-data";
import {
  GameLevel,
  LevelProgress,
  LevelStatus,
  QuestionCategory,
  TriviaQuestion,
} from "@/interfaces/game-types";

const QUESTIONS_PER_LEVEL = 4;

// Descriptive titles per category mix (used as fallback if no title from API)
const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  PROPUESTA: "Propuestas",
  POLEMICO: "Lo Polémico",
  HISTORICO: "Historia",
  CORRUPCION: "Corrupción",
};

function buildLevelTitle(levelId: number, questions: TriviaQuestion[]): string {
  // Use the most-common category in this level's questions as the title hint
  const freq: Partial<Record<QuestionCategory, number>> = {};
  for (const q of questions) {
    freq[q.category] = (freq[q.category] ?? 0) + 1;
  }
  const top = (Object.entries(freq) as [QuestionCategory, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const region = getRegionByLevel(levelId);
  if (!top) return `Nivel ${levelId}`;

  return `${region.name}: ${CATEGORY_LABELS[top[0]]}`;
}

function buildLevelDescription(levelId: number): string {
  const isBoss = levelId % 5 === 0;
  if (isBoss) {
    return "¡Nivel jefe! Demuestra todo lo que aprendiste en esta etapa.";
  }
  return "Responde correctamente para avanzar al siguiente nivel.";
}

export function hydrateLevelsWithQuestions(
  rawQuestions: TriviaQuestion[],
  highestUnlockedLevel: number,
  levelsProgress: Record<number, LevelProgress>,
): GameLevel[] {
  if (!rawQuestions || rawQuestions.length === 0) return [];

  // Sort by global_index so level grouping is deterministic
  const sorted = [...rawQuestions].sort(
    (a, b) => a.global_index - b.global_index,
  );

  // Group into chunks of QUESTIONS_PER_LEVEL
  const groups: TriviaQuestion[][] = [];
  for (let i = 0; i < sorted.length; i += QUESTIONS_PER_LEVEL) {
    groups.push(sorted.slice(i, i + QUESTIONS_PER_LEVEL));
  }

  return groups.map((questions, idx) => {
    const levelId = idx + 1;
    const region = getRegionByLevel(levelId).id;
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
      title: buildLevelTitle(levelId, questions),
      description: buildLevelDescription(levelId),
      region,
      status,
      stars: progress?.stars ?? 0,
      required_xp: (levelId - 1) * 50,
      is_boss: isBoss,
      questions,
    } satisfies GameLevel;
  });
}
