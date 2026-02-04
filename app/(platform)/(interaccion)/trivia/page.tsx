import { getPlayableTrivias } from "./_lib/data";
import { TriviaGameEngine } from "./_components/trivia-game-engine";

export default async function TriviaPage() {
  const questions = await getPlayableTrivias();

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
      <TriviaGameEngine questions={questions} />
    </div>
  );
}
