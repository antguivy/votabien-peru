import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { TriviaHubClient } from "./_components/trivia-hub-client";
import {
  getPlayableTopics,
  getPlayableAudiences,
  getPlayableQuestions,
} from "./_lib/data";
import { getRegiones } from "@/queries/public/electoral-districts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trivia Cívica & Electoral | VotaBien Perú",
  description:
    "Aprende sobre la Constitución, instituciones democráticas y elecciones de manera interactiva.",
};

export default async function TriviaPage() {
  const [topics, audiences, questions, regions] = await Promise.all([
    getPlayableTopics(),
    getPlayableAudiences(),
    getPlayableQuestions(),
    getRegiones(),
  ]);

  return (
    <ContentPlatformLayout>
      <TriviaHubClient
        initialTopics={topics}
        initialAudiences={audiences}
        initialQuestions={questions}
        initialRegions={regions}
      />
    </ContentPlatformLayout>
  );
}
