import { getRegionByLevel } from "@/constants/regions-data";
import {
  GameLevel,
  LevelProgress,
  LevelStatus,
  TriviaQuestion,
} from "@/interfaces/game-types";

// Exportado para que game-store pueda calcular el tope de niveles
export const QUESTIONS_PER_LEVEL = 3;

function buildLevelDescription(levelId: number): string {
  const isBoss = levelId % 5 === 0;
  if (isBoss) {
    return "¡Nivel jefe!";
  }
  return "Responde correctamente para avanzar al siguiente nivel.";
}

export function hydrateLevelsWithQuestions(
  rawQuestions: TriviaQuestion[],
  highestUnlockedLevel: number,
  levelsProgress: Record<number, LevelProgress>,
): GameLevel[] {
  if (!rawQuestions || rawQuestions.length === 0) return [];

  const sorted = [...rawQuestions].sort(
    (a, b) => a.global_index - b.global_index,
  );

  const groups: TriviaQuestion[][] = [];
  for (let i = 0; i < sorted.length; i += QUESTIONS_PER_LEVEL) {
    groups.push(sorted.slice(i, i + QUESTIONS_PER_LEVEL));
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
