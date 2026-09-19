"use client";

import { getRegionByLevel } from "@/constants/regions-data";
import { hydrateLevelsWithQuestions } from "@/lib/level-hydrator";
import {
  GameLevel,
  GameRegion,
  LevelProgress,
  TriviaQuestion,
  GamePlayMode,
} from "@/interfaces/game-types";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface TopicProgress {
  highestUnlockedLevel: number;
  levelsProgress: Record<number, LevelProgress>;
  topicXp: number;
  quizzesCompleted: number;
}

interface GameState {
  currentTopic: TriviaTopic | null;
  currentAudience: TriviaAudience | null;
  currentMode: GamePlayMode;

  rawQuestions: TriviaQuestion[];
  userXp: number;

  // Progreso particionado por slug de tema (o "general" como default)
  progressByTopic: Record<string, TopicProgress>;

  // State properties
  highestUnlockedLevel: number;
  levelsProgress: Record<number, LevelProgress>;

  // Functions & Queries
  getLevels: (topicSlug?: string) => GameLevel[];
  getCurrentRegion: (topicSlug?: string) => GameRegion;
  getTopicProgress: (topicSlug?: string) => TopicProgress;

  // Setters
  setCurrentTopic: (topic: TriviaTopic | null) => void;
  setCurrentAudience: (audience: TriviaAudience | null) => void;
  setMode: (mode: GamePlayMode) => void;
  setQuestions: (questions: TriviaQuestion[]) => void;

  completeLevel: (
    levelId: number,
    stars: 0 | 1 | 2 | 3,
    xpGained: number,
    topicSlug?: string,
  ) => void;

  recordQuizResult: (
    score: number,
    correctCount: number,
    total: number,
    topicSlug?: string,
  ) => void;

  resetProgress: (topicSlug?: string) => void;
}

const DEFAULT_TOPIC_PROGRESS: TopicProgress = {
  highestUnlockedLevel: 1,
  levelsProgress: {},
  topicXp: 0,
  quizzesCompleted: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentTopic: null,
      currentAudience: null,
      currentMode: "MAP",
      rawQuestions: [],
      userXp: 0,
      progressByTopic: {},
      highestUnlockedLevel: 1,
      levelsProgress: {},

      getTopicProgress: (topicSlug) => {
        const slug = topicSlug || get().currentTopic?.slug || "general";
        return (
          get().progressByTopic[slug] ??
          get().progressByTopic["map_campaign"] ?? {
            ...DEFAULT_TOPIC_PROGRESS,
          }
        );
      },

      getLevels: (topicSlug) => {
        const {
          rawQuestions,
          progressByTopic,
          currentTopic,
          highestUnlockedLevel,
          levelsProgress,
        } = get();
        const slug = topicSlug || currentTopic?.slug || "general";
        const topicProg = progressByTopic[slug] ??
          progressByTopic["map_campaign"] ?? {
            ...DEFAULT_TOPIC_PROGRESS,
          };

        const effectiveHighest = Math.max(
          highestUnlockedLevel || 1,
          topicProg.highestUnlockedLevel || 1,
          progressByTopic["map_campaign"]?.highestUnlockedLevel || 1,
        );

        const effectiveLevelsProgress: Record<number, LevelProgress> = {
          ...(progressByTopic["map_campaign"]?.levelsProgress || {}),
          ...(topicProg.levelsProgress || {}),
          ...(levelsProgress || {}),
        };

        return hydrateLevelsWithQuestions(
          rawQuestions,
          effectiveHighest,
          effectiveLevelsProgress,
        );
      },

      getCurrentRegion: (topicSlug) => {
        const slug = topicSlug || get().currentTopic?.slug || "general";
        const highest =
          get().highestUnlockedLevel ||
          get().progressByTopic[slug]?.highestUnlockedLevel ||
          get().progressByTopic["map_campaign"]?.highestUnlockedLevel ||
          1;
        return getRegionByLevel(highest).id;
      },

      setCurrentTopic: (topic) => {
        set((state) => {
          const slug = topic?.slug || "general";
          const prog =
            state.progressByTopic[slug] ||
            state.progressByTopic["map_campaign"] ||
            DEFAULT_TOPIC_PROGRESS;
          const mergedProgress = {
            ...(state.progressByTopic["map_campaign"]?.levelsProgress || {}),
            ...(prog.levelsProgress || {}),
            ...(state.levelsProgress || {}),
          };
          const highest = Math.max(
            prog.highestUnlockedLevel || 1,
            state.progressByTopic["map_campaign"]?.highestUnlockedLevel || 1,
            state.highestUnlockedLevel || 1,
          );
          return {
            currentTopic: topic,
            highestUnlockedLevel: highest,
            levelsProgress: mergedProgress,
          };
        });
      },

      setCurrentAudience: (audience) => {
        set({ currentAudience: audience });
      },

      setMode: (mode) => {
        set({ currentMode: mode });
      },

      setQuestions: (questions) => {
        set({ rawQuestions: questions });
      },

      completeLevel: (levelId, stars, xpGained, topicSlug) => {
        set((state) => {
          const slug = topicSlug || state.currentTopic?.slug || "general";
          const currentProg = state.progressByTopic[slug] ?? {
            ...DEFAULT_TOPIC_PROGRESS,
          };
          const mapCampaignProg = state.progressByTopic["map_campaign"] ?? {
            ...DEFAULT_TOPIC_PROGRESS,
          };

          const currentLevelProg = currentProg.levelsProgress[levelId] ??
            mapCampaignProg.levelsProgress[levelId] ??
            state.levelsProgress[levelId] ?? {
              stars: 0,
              status: "unlocked",
            };

          const newStars = Math.max(currentLevelProg.stars, stars) as
            | 0
            | 1
            | 2
            | 3;

          // Regla clave: Mínimo 2 de 3 aciertos (stars >= 2) para aprobar y desbloquear
          const isPassed = stars >= 2;

          const newLevelsProgress = {
            ...mapCampaignProg.levelsProgress,
            ...currentProg.levelsProgress,
            ...state.levelsProgress,
            [levelId]: {
              stars: newStars,
              status: isPassed
                ? ("completed" as const)
                : currentLevelProg.status,
            },
          };

          const baseHighest = Math.max(
            currentProg.highestUnlockedLevel,
            mapCampaignProg.highestUnlockedLevel,
            state.highestUnlockedLevel || 1,
          );

          // Si aprobó con mínimo 2 estrellas, se desbloquea el siguiente nivel. Si no, se mantiene.
          const newHighest = isPassed
            ? Math.max(baseHighest, levelId + 1)
            : baseHighest;

          const updatedTopicProg: TopicProgress = {
            ...currentProg,
            highestUnlockedLevel: newHighest,
            levelsProgress: newLevelsProgress,
            topicXp: currentProg.topicXp + xpGained,
          };

          const updatedMapProg: TopicProgress = {
            ...mapCampaignProg,
            highestUnlockedLevel: newHighest,
            levelsProgress: newLevelsProgress,
            topicXp: mapCampaignProg.topicXp + xpGained,
          };

          return {
            progressByTopic: {
              ...state.progressByTopic,
              [slug]: updatedTopicProg,
              map_campaign: updatedMapProg,
            },
            highestUnlockedLevel: newHighest,
            levelsProgress: newLevelsProgress,
            userXp: state.userXp + xpGained,
          };
        });
      },

      recordQuizResult: (score, _correctCount, _total, topicSlug) => {
        set((state) => {
          const slug = topicSlug || state.currentTopic?.slug || "general";
          const currentProg = state.progressByTopic[slug] ?? {
            ...DEFAULT_TOPIC_PROGRESS,
          };

          const xpGained = Math.round(score * 0.5);

          const updatedTopicProg: TopicProgress = {
            ...currentProg,
            quizzesCompleted: currentProg.quizzesCompleted + 1,
            topicXp: currentProg.topicXp + xpGained,
          };

          return {
            progressByTopic: {
              ...state.progressByTopic,
              [slug]: updatedTopicProg,
            },
            userXp: state.userXp + xpGained,
          };
        });
      },

      resetProgress: (topicSlug) => {
        set((state) => {
          if (topicSlug) {
            const copy = { ...state.progressByTopic };
            delete copy[topicSlug];
            return { progressByTopic: copy };
          }
          return {
            progressByTopic: {},
            userXp: 0,
            highestUnlockedLevel: 1,
            levelsProgress: {},
            rawQuestions: [],
          };
        });
      },
    }),
    {
      name: "votabien-game-storage-v5",
      version: 5,
      migrate: (persistedState: unknown, fromVersion: number) => {
        if (fromVersion < 5) {
          return {
            progressByTopic: {},
            userXp: 0,
            currentMode: "MAP",
            highestUnlockedLevel: 1,
            levelsProgress: {},
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const allProgs = Object.values(state.progressByTopic || {});
          let maxHighest = state.highestUnlockedLevel || 1;
          const mergedProgress: Record<number, LevelProgress> = {
            ...(state.levelsProgress || {}),
          };

          for (const p of allProgs) {
            if (p.highestUnlockedLevel && p.highestUnlockedLevel > maxHighest) {
              maxHighest = p.highestUnlockedLevel;
            }
            if (p.levelsProgress) {
              Object.assign(mergedProgress, p.levelsProgress);
            }
          }

          // Auto-recuperación: Si el nivel N está completado con mínimo 2 estrellas,
          // el nivel desbloqueado debe ser al menos N + 1
          for (const [lvlStr, prog] of Object.entries(mergedProgress)) {
            const lvlNum = Number(lvlStr);
            if (
              prog?.status === "completed" &&
              (prog.stars ?? 0) >= 2 &&
              lvlNum >= maxHighest
            ) {
              maxHighest = lvlNum + 1;
            }
          }

          state.highestUnlockedLevel = maxHighest;
          state.levelsProgress = mergedProgress;
        }
      },
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        progressByTopic: state.progressByTopic,
        userXp: state.userXp,
        highestUnlockedLevel: state.highestUnlockedLevel,
        levelsProgress: state.levelsProgress,
      }),
    },
  ),
);
