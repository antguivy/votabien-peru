"use client";

import { getRegionByLevel } from "@/constants/regions-data";
import {
  hydrateLevelsWithQuestions,
  QUESTIONS_PER_LEVEL,
} from "@/lib/level-hydrator";
import {
  GameLevel,
  GameRegion,
  LevelProgress,
  TriviaQuestion,
} from "@/interfaces/game-types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface GameState {
  rawQuestions: TriviaQuestion[];
  levelsProgress: Record<number, LevelProgress>;
  userXp: number;
  highestUnlockedLevel: number;

  getLevels: () => GameLevel[];
  getCurrentRegion: () => GameRegion;

  setQuestions: (questions: TriviaQuestion[]) => void;
  completeLevel: (
    levelId: number,
    stars: 0 | 1 | 2 | 3,
    xpGained: number,
  ) => void;
  resetProgress: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      rawQuestions: [],
      levelsProgress: {},
      highestUnlockedLevel: 1,
      userXp: 0,

      getLevels: () => {
        const { rawQuestions, highestUnlockedLevel, levelsProgress } = get();
        return hydrateLevelsWithQuestions(
          rawQuestions,
          highestUnlockedLevel,
          levelsProgress,
        );
      },

      getCurrentRegion: () => {
        return getRegionByLevel(get().highestUnlockedLevel).id;
      },

      setQuestions: (questions) => {
        set({ rawQuestions: questions });
      },

      completeLevel: (levelId, stars, xpGained) => {
        set((state) => {
          const current = state.levelsProgress[levelId] ?? {
            stars: 0,
            status: "unlocked",
          };
          const newStars = Math.max(current.stars, stars) as 0 | 1 | 2 | 3;
          const newProgress = {
            ...state.levelsProgress,
            [levelId]: { stars: newStars, status: "completed" as const },
          };

          // Tope: no superar el último nivel disponible con las preguntas actuales
          const totalLevels = Math.floor(
            state.rawQuestions.length / QUESTIONS_PER_LEVEL,
          );
          const newHighest =
            levelId === state.highestUnlockedLevel
              ? Math.min(state.highestUnlockedLevel + 1, totalLevels)
              : state.highestUnlockedLevel;

          return {
            levelsProgress: newProgress,
            userXp: state.userXp + xpGained,
            highestUnlockedLevel: newHighest,
          };
        });
      },

      resetProgress: () =>
        set({
          levelsProgress: {},
          userXp: 0,
          highestUnlockedLevel: 1,
          rawQuestions: [],
        }),
    }),
    {
      name: "votabien-game-storage",
      version: 4, // bump de versión — resetea progreso de usuarios con storage viejo
      migrate: (persistedState: unknown, fromVersion: number) => {
        // Versiones anteriores usaban el nombre "votabien-game-storage-v3"
        // por lo que este store arrancará limpio para todos — comportamiento correcto
        if (fromVersion < 4) {
          return {
            levelsProgress: {},
            userXp: 0,
            highestUnlockedLevel: 1,
          };
        }
        return persistedState;
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
        levelsProgress: state.levelsProgress,
        userXp: state.userXp,
        highestUnlockedLevel: state.highestUnlockedLevel,
      }),
    },
  ),
);
