export interface TriviaOption {
  option_id: string;
  name: string;
  image_url?: string | null;
  image_candidate_url?: string | null;
  logo_url?: string | null;
}

export interface TriviaBasic {
  id: number;
  created_at: string;
  quote: string;
  category: "POLEMICO" | "HISTORIA" | "PROPUESTA" | "CORRUPCION";
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
  person_id: string | null;
  political_party_id: string | null;
  options: TriviaOption[];
}
