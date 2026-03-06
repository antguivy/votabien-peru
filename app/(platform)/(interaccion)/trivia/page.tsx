import { questionsService } from "@/services/questions";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import TriviaMapClient from "./_components/trivia-map-client";
import UnderConstruction from "@/components/under-construction";

export default async function TriviaPage() {
  const questions = await questionsService.getQuestions();

  return (
    <ContentPlatformLayout>
      {/* <div
        className="flex justify-center bg-background"
        style={{ height: "100dvh" }}
      >
        <div className="w-full" style={{ maxWidth: 480 }}>
          <TriviaMapClient initialQuestions={questions} />
        </div>
      </div> */}
      <UnderConstruction title="Disponible a partir desde el 08 de marzo" />;
    </ContentPlatformLayout>
  );
}
