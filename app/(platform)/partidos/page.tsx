import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import UnderConstruction from "@/components/under-construction";

export default async function PartidosPage() {
  return (
    <ContentPlatformLayout>
      <UnderConstruction
        title="Sección en Actualización"
        description="Estamos adaptando y consolidando la información de las organizaciones políticas para el proceso electoral."
      />
    </ContentPlatformLayout>
  );
}
