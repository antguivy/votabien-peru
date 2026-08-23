export type OptionDisplayType =
  | "TEXT_ONLY"
  | "PERSON"
  | "PARTY"
  | "INSTITUTION"
  | "TRUE_FALSE"
  | "IMAGE_CARD";

export interface TriviaAudience {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  emoji?: string | null;
  color?: string | null;
  is_active: boolean;
  order_index: number;
}

export interface TriviaTopic {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  badge_color?: string | null;
  banner_url?: string | null;
  is_active: boolean;
  order_index: number;
  audiences?: TriviaAudience[];
  questions_count?: number;
  total_questions?: number;
}

export interface TriviaOption {
  option_id: string;
  name: string;
  subtitle?: string | null;
  image_url?: string | null;
  letter?: "A" | "B" | "C" | "D";
}

export interface TriviaBasic {
  id: number;
  topic_id?: string | null;
  created_at: string;
  quote: string;
  title?: string | null;
  category: string;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
  display_type: OptionDisplayType;
  global_index: number;
  explanation: string | null;
  source_url: string | null;
  image_url?: string | null;
  is_published: boolean;

  correct_answer_id: string;
  options: TriviaOption[];

  topic?: {
    id: string;
    slug: string;
    title: string;
    icon?: string | null;
    badge_color?: string | null;
  } | null;

  audiences?: TriviaAudience[];

  person_id?: string | null;
  political_party_id?: string | null;
  person?: { id: string; fullname: string } | null;
  politicalparty?: { id: string; name: string } | null;
}
