// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { questionsService } from "@/services/questions";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import TriviaMapClient from "./_components/trivia-map-client";
import UnderConstruction from "@/components/under-construction";

export default async function TriviaPage() {
  // const questions = await questionsService.getQuestions();

  return (
    <ContentPlatformLayout>
      {/* <div className="flex justify-center bg-background h-dvh lg:h-[calc(100dvh-56px)]">
        <div className="w-full" style={{ maxWidth: 480 }}>
          <TriviaMapClient initialQuestions={questions} />
        </div>
      </div> */}
      <UnderConstruction
        title="La herramienta ya no está disponible"
        description="VotaBien Perú"
      />
    </ContentPlatformLayout>
  );
}
