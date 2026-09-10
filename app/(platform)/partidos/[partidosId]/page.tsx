import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import UnderConstruction from "@/components/under-construction";

export default async function PartidoDetailPage() {
  return (
    <ContentPlatformLayout>
      <UnderConstruction feature="partidos" backHref="/partidos" isTeam />
    </ContentPlatformLayout>
  );
}
