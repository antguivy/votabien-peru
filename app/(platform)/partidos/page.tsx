import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import UnderConstruction from "@/components/under-construction";

export default async function PartidosPage() {
  return (
    <ContentPlatformLayout>
      <UnderConstruction feature="partidos" isTeam />
    </ContentPlatformLayout>
  );
}
