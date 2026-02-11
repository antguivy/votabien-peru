export interface TriviaOption {
  option_id: string;
  name: string;
  image_url?: string | null;
}

export interface TriviaBasic {
  id: number;
  created_at: string;
  quote: string;
  category: "POLEMICO" | "HISTORIA" | "PROPUESTA" | "CORRUPCION";
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
  global_index: number;
  explanation: string | null;
  source_url: string | null;

  person_id: string | null;
  political_party_id: string | null;
  options: TriviaOption[];
}
