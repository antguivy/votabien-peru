import { GameRegion } from "@/interfaces/game-types";

export interface RegionTheme {
  id: GameRegion;
  name: string;
  avatarEmoji: string;
  avatarName: string;
  colors: {
    backgroundTop: string;
    backgroundBottom: string;
    primary: string;
    accent: string;
  };
  minLevel: number;
  maxLevel: number;
}

export const REGIONS_CONFIG: Record<GameRegion, RegionTheme> = {
  costa: {
    id: "costa",
    name: "Costa Peruana",
    avatarEmoji: "🐦",
    avatarName: "Gallito Novato",
    colors: {
      backgroundTop: "#60a5fa",
      backgroundBottom: "#fde68a",
      primary: "#ea580c",
      accent: "#f59e0b",
    },
    minLevel: 1,
    maxLevel: 10,
  },
  sierra: {
    id: "sierra",
    name: "Sierra Andina",
    avatarEmoji: "🦙",
    avatarName: "Llama Caminante",
    colors: {
      backgroundTop: "#3b82f6",
      backgroundBottom: "#166534",
      primary: "#be123c",
      accent: "#fbbf24",
    },
    minLevel: 11,
    maxLevel: 20,
  },
  selva: {
    id: "selva",
    name: "Amazonía",
    avatarEmoji: "🐆",
    avatarName: "Jaguar Guerrero",
    colors: {
      backgroundTop: "#10b981",
      backgroundBottom: "#064e3b",
      primary: "#d97706",
      accent: "#fcd34d",
    },
    minLevel: 21,
    maxLevel: 30,
  },
  hanan_pacha: {
    id: "hanan_pacha",
    name: "Hanan Pacha",
    avatarEmoji: "🦅",
    avatarName: "Cóndor Sabio",
    colors: {
      backgroundTop: "#1e1b4b",
      backgroundBottom: "#4c1d95",
      primary: "#ffd700",
      accent: "#ffffff",
    },
    minLevel: 31,
    maxLevel: 999,
  },
};

export const getRegionByLevel = (levelId: number): RegionTheme => {
  if (levelId >= 31) return REGIONS_CONFIG.hanan_pacha;
  if (levelId >= 21) return REGIONS_CONFIG.selva;
  if (levelId >= 11) return REGIONS_CONFIG.sierra;
  return REGIONS_CONFIG.costa;
};

export const REGION_START_LEVELS = Object.values(REGIONS_CONFIG)
  .map((r) => r.minLevel)
  .filter((lvl) => lvl > 1)
  .sort((a, b) => a - b); // → [11, 21, 31]
