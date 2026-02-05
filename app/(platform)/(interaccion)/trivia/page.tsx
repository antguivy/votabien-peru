import { getPlayableTrivias } from "./_lib/data";
import { TriviaGameEngine } from "./_components/trivia-game-engine";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

export default async function TriviaPage() {
  const questions = await getPlayableTrivias();

  return (
    <ContentPlatformLayout>
      <section className="pt-4 container mx-auto pb-20 lg:pb-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
        <TriviaGameEngine questions={questions} />
      </section>
    </ContentPlatformLayout>
  );
}
