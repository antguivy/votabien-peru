import { ContentLayout } from "@/components/admin/content-layout";
import { CreateTeamPhotoButton } from "./_components/buttons";
import { HitosList } from "./_components/hito-list";
import { getHitos } from "@/queries/public/hito";

export default async function TeamPhotoPage() {
  const hitos = await getHitos();

  return (
    <ContentLayout title="Fotos del Equipo">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Hitos del Equipo
          </h2>
          <CreateTeamPhotoButton />
        </div>

        <HitosList hitos={hitos} />
      </div>
    </ContentLayout>
  );
}
