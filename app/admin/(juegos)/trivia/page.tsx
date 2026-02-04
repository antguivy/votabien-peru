import { ContentLayout } from "@/components/admin/content-layout";
import { CreateTriviaButton } from "./_components/buttons";
import { TriviaList } from "./_components/trivia-list";
import { getTrivias } from "./_lib/data";

export default async function TriviaPage() {
  const [trivias] = await Promise.all([getTrivias()]);

  return (
    <ContentLayout title="Trivia">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Banco de Preguntas
          </h2>
          <CreateTriviaButton />
        </div>

        <TriviaList trivias={trivias} />
      </div>
    </ContentLayout>
  );
}
