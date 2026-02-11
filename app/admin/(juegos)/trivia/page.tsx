import { ContentLayout } from "@/components/admin/content-layout";
import { CreateTriviaButton } from "./_components/buttons";
import { TriviaList } from "./_components/trivia-list";
import { getTrivias } from "./_lib/data";

export default async function TriviaPage() {
  const [trivias] = await Promise.all([getTrivias()]);
  const maxIndex =
    trivias.length > 0 ? Math.max(...trivias.map((t) => t.global_index)) : 0;

  const nextAvailableIndex = maxIndex + 1;
  console.log("nextAvailableIndex", nextAvailableIndex);

  return (
    <ContentLayout title="Trivia">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Banco de Preguntas
          </h2>
          <CreateTriviaButton nextOrderIndex={nextAvailableIndex} />
        </div>

        <TriviaList trivias={trivias} nextOrderIndex={nextAvailableIndex} />
      </div>
    </ContentLayout>
  );
}
