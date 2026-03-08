import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CandidateCard } from "@/interfaces/candidate";

export type CategoryType =
  | "presidente"
  | "senador_nacional"
  | "senador_regional"
  | "diputado_regional";

export interface SavedMatchResult {
  id: string;
  savedAt: string;
  label: string;
  selections: Partial<Record<CategoryType, CandidateCard[]>>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

interface SavedResultsStore {
  savedResults: SavedMatchResult[];
  saveResults: (
    selections: Partial<Record<CategoryType, CandidateCard[]>>,
  ) => string;
  removeCandidate: (
    resultId: string,
    category: CategoryType,
    candidateId: string,
  ) => void;
  renameResult: (resultId: string, label: string) => void;
  deleteResult: (resultId: string) => void;
  importResult: (entry: Omit<SavedMatchResult, "id">) => string;
  clearAll: () => void;
}

const MAX_SAVED = 10;

export const useSavedResults = create<SavedResultsStore>()(
  persist(
    (set) => ({
      savedResults: [],

      saveResults: (selections) => {
        const newEntry: SavedMatchResult = {
          id: generateId(),
          savedAt: new Date().toISOString(),
          label: `Test del ${new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`,
          selections,
        };
        set((state) => ({
          savedResults: [newEntry, ...state.savedResults].slice(0, MAX_SAVED),
        }));
        return newEntry.id;
      },

      removeCandidate: (resultId, category, candidateId) =>
        set((state) => ({
          savedResults: state.savedResults.map((r) =>
            r.id !== resultId
              ? r
              : {
                  ...r,
                  selections: {
                    ...r.selections,
                    [category]: (r.selections[category] ?? []).filter(
                      (c) => c.id !== candidateId,
                    ),
                  },
                },
          ),
        })),

      renameResult: (resultId, label) =>
        set((state) => ({
          savedResults: state.savedResults.map((r) =>
            r.id === resultId ? { ...r, label } : r,
          ),
        })),

      deleteResult: (resultId) =>
        set((state) => ({
          savedResults: state.savedResults.filter((r) => r.id !== resultId),
        })),

      importResult: (entry) => {
        const newEntry: SavedMatchResult = {
          ...entry,
          id: generateId(),
          label: `Compartido — ${entry.label}`,
        };
        set((state) => ({
          savedResults: [newEntry, ...state.savedResults].slice(0, MAX_SAVED),
        }));
        return newEntry.id;
      },

      clearAll: () => set({ savedResults: [] }),
    }),
    {
      name: "votabien-match-results-v2", // misma key que tenías en localStorage
    },
  ),
);
