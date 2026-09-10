import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { TriviaHubClient } from "./_components/trivia-hub-client";
import {
  getPlayableTopics,
  getPlayableAudiences,
  getPlayableQuestions,
} from "./_lib/data";
import UnderConstruction from "@/components/under-construction";
import { serverGetUser } from "@/lib/auth-actions";

export const metadata = {
  title: "Trivia Cívica & Electoral | VotaBien Perú",
  description:
    "Aprende sobre la Constitución, instituciones democráticas y elecciones de manera interactiva.",
};

export default async function TriviaPage() {
  const { user } = await serverGetUser();

  if (!user) {
    return (
      <ContentPlatformLayout>
        <UnderConstruction feature="trivia" isTeam />
      </ContentPlatformLayout>
    );
  }

  const [topics, audiences, questions] = await Promise.all([
    getPlayableTopics(),
    getPlayableAudiences(),
    getPlayableQuestions(),
  ]);

  return (
    <ContentPlatformLayout>
      <TriviaHubClient
        initialTopics={topics}
        initialAudiences={audiences}
        initialQuestions={questions}
      />
    </ContentPlatformLayout>
  );
}
