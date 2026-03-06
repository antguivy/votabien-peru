import { QuestionsResponse, TriviaQuestion } from "@/interfaces/game-types";
import { apiClient } from "./api";

const LETTERS = ["A", "B", "C", "D"] as const;

function addLettersToOptions(questions: TriviaQuestion[]): TriviaQuestion[] {
  return questions.map((question) => ({
    ...question,
    options: question.options.map((option, index) => ({
      ...option,
      letter: LETTERS[index] as "A" | "B" | "C" | "D",
    })),
  }));
}

export const questionsService = {
  async getQuestions(): Promise<TriviaQuestion[]> {
    const response = await apiClient<QuestionsResponse>(
      "/api/v1/triviagame/questions",
    );
    // console.log("response_1", response.questions);
    // console.log("response_2", response.questions[1].options);

    return addLettersToOptions(response.questions);
  },
};
