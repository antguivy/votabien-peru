"use server";

import { createClient } from "@/lib/supabase/server";

export interface TriviaQuestion {
  id: number;
  quote: string | null;
  category: string | null; //"POLEMICO" | "HISTORIA" | "PROPUESTA" | "CORRUPCION" |
  difficulty: string | null; // "FACIL" | "MEDIO" | "DIFICIL";
  correct_answer_id: string | null; // person_id o political_party_id
  options: {
    option_id: string;
    name: string;
    image_candidate_url?: string | null;
  }[];
}

export async function getPlayableTrivias(): Promise<TriviaQuestion[]> {
  const supabase = await createClient();

  // Obtenemos preguntas aleatorias
  const { data, error } = await supabase
    .from("triviagame")
    .select("*")
    .limit(20);

  if (error || !data) {
    console.error("Error fetching trivia:", error);
    return [];
  }

  // Mapeamos y limpiamos los datos
  const questions: TriviaQuestion[] = data.map((item) => {
    // 1. Determinar el ID correcto
    const correctId = item.person_id || item.political_party_id;

    // 2. Parsear las opciones que vienen como string JSON
    let parsedOptions = [];
    try {
      parsedOptions =
        typeof item.options === "string"
          ? JSON.parse(item.options)
          : item.options;
    } catch (e) {
      console.error("Error parsing options for trivia", item.id);
    }

    return {
      id: item.id,
      quote: item.quote,
      category: item.category,
      difficulty: item.difficulty,
      correct_answer_id: correctId,
      options: parsedOptions,
    };
  });

  // Barajar el array de preguntas (Fisher-Yates simple)
  return questions.sort(() => Math.random() - 0.5);
}
