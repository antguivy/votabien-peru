import { questionsService } from "@/services/questions";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import TriviaMapClient from "./_components/trivia-map-client";

export default async function TriviaPage() {
  const questions = await questionsService.getQuestions();

  return (
    <ContentPlatformLayout>
      <div className="flex justify-center bg-background h-dvh lg:h-[calc(100dvh-56px)]">
        <div className="w-full" style={{ maxWidth: 480 }}>
          <TriviaMapClient initialQuestions={questions} />
        </div>
      </div>
    </ContentPlatformLayout>
  );
}
