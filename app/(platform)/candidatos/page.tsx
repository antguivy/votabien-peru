import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import UnderConstruction from "@/components/under-construction";

export default function CandidatosPage() {
  return (
    <ContentPlatformLayout fullHeight>
      <UnderConstruction
        title="La herramienta ya no está disponible"
        description="VotaBien Perú"
      />
    </ContentPlatformLayout>
  );
}
