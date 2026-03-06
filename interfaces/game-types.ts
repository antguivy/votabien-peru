// src/types/game-types.ts

export type GameRegion = "costa" | "sierra" | "selva" | "hanan_pacha";

export type LevelStatus = "locked" | "unlocked" | "completed";

export type QuestionCategory =
  | "PROPUESTA" // ← faltaba, está en el JSON real
  | "POLEMICO"
  | "HISTORICO"
  | "CORRUPCION";

export type QuestionDifficulty = "FACIL" | "MEDIO" | "DIFICIL";

export interface TriviaOption {
  name: string;
  option_id: string;
  image_url?: string | null;
  letter?: "A" | "B" | "C" | "D";
}

export interface TriviaQuestion {
  id: number;
  global_index: number;
  quote: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  correct_answer_id: string;
  explanation?: string;
  source_url?: string | null;
  options: TriviaOption[];
  person_id?: string | null;
  political_party_id?: string | null;
}

export interface QuestionsResponse {
  questions: TriviaQuestion[];
  total: number;
}

export interface GameLevel {
  id: number;
  title: string;
  description: string;
  region: GameRegion;
  status: LevelStatus;
  stars: 0 | 1 | 2 | 3;
  required_xp: number;
  is_boss: boolean;
  questions: TriviaQuestion[];
}

export interface LevelProgress {
  stars: 0 | 1 | 2 | 3;
  status: LevelStatus;
}
