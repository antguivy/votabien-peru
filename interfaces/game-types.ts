import type { OptionDisplayType, TriviaAudience, TriviaTopic } from "./trivia";
export type { OptionDisplayType, TriviaAudience, TriviaTopic };

export type GameRegion = "costa" | "sierra" | "selva" | "hanan_pacha";

export type LevelStatus = "locked" | "unlocked" | "completed";

export type QuestionCategory =
  | "CONSTITUCION"
  | "PODERES"
  | "DERECHOS"
  | "PROPUESTA"
  | "POLEMICO"
  | "HISTORICO"
  | "CORRUPCION"
  | string;

export type QuestionDifficulty = "FACIL" | "MEDIO" | "DIFICIL";

export type GamePlayMode = "MAP" | "QUICK_QUIZ" | "WORKSHOP";

export interface TriviaOption {
  name: string;
  option_id: string;
  subtitle?: string | null;
  image_url?: string | null;
  letter?: "A" | "B" | "C" | "D";
}

export interface TriviaQuestion {
  id: number;
  topic_id?: string | null;
  global_index: number;
  quote: string;
  title?: string | null;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  display_type: OptionDisplayType;
  correct_answer_id: string;
  explanation?: string | null;
  source_url?: string | null;
  image_url?: string | null;
  options: TriviaOption[];
  audiences?: TriviaAudience[];
  topic?: TriviaTopic | null;
  person_id?: string | null;
  political_party_id?: string | null;
}

export interface QuestionsResponse {
  questions: TriviaQuestion[];
  total: number;
  topic?: TriviaTopic | null;
  audience?: TriviaAudience | null;
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
