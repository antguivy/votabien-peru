"use server";

import { prisma } from "@/lib/prisma";

export interface TriviaQuestion {
  id: number;
  quote: string | null;
  category: string | null;
  difficulty: string | null;
  correct_answer_id: string | null;
  options: {
    option_id: string;
    name: string;
    image_candidate_url?: string | null;
  }[];
}

export async function getPlayableTrivias(): Promise<TriviaQuestion[]> {
  try {
    const data = await prisma.triviagame.findMany({
      take: 20,
    });

    const questions: TriviaQuestion[] = data.map((item) => {
      const correctId = item.person_id || item.political_party_id;

      let parsedOptions: TriviaQuestion["options"] = [];
      try {
        parsedOptions =
          typeof item.options === "string"
            ? JSON.parse(item.options)
            : Array.isArray(item.options)
              ? item.options
              : [];
      } catch (_e) {
        console.error("Error parsing options for trivia", item.id);
      }

      return {
        id: Number(item.id),
        quote: item.quote,
        category: item.category,
        difficulty: item.difficulty,
        correct_answer_id: correctId,
        options: parsedOptions,
      };
    });

    return questions.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Error fetching trivia:", error);
    return [];
  }
}
