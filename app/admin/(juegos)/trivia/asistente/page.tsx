import { ContentLayout } from "@/components/admin/content-layout";
import { getTopics, getAudiences, getTrivias } from "../_lib/data";
import { getRegiones } from "@/queries/public/electoral-districts";
import { serverGetUser } from "@/lib/auth-actions";
import { TriviaAssistantClient } from "./_components/trivia-assistant-client";

import { getWorkflowByType } from "@/app/admin/workflows/_lib/actions";

export default async function TriviaAssistantPage() {
  const [{ user }, topics, audiences, regiones, triviaWorkflow, trivias] =
    await Promise.all([
      serverGetUser(),
      getTopics(),
      getAudiences(),
      getRegiones(),
      getWorkflowByType("TRIVIA_EJE5"),
      getTrivias(),
    ]);

  const canPublishDirectly = Boolean(
    user?.role &&
      ["lead", "editor", "admin", "super_admin"].includes(user.role),
  );

  const maxIndex =
    trivias.length > 0
      ? Math.max(
          0,
          ...trivias
            .map((t) => Number(t.global_index))
            .filter((n) => !isNaN(n) && n < 900),
        )
      : 0;
  const nextAvailableIndex = (maxIndex > 0 ? maxIndex : trivias.length) + 1;

  return (
    <ContentLayout title="Copiloto de Trivia">
      <TriviaAssistantClient
        topics={topics}
        audiences={audiences.filter((a) => a.is_active)}
        regions={regiones}
        canPublishDirectly={canPublishDirectly}
        activeWorkflow={triviaWorkflow}
        nextOrderIndex={nextAvailableIndex}
      />
    </ContentLayout>
  );
}
