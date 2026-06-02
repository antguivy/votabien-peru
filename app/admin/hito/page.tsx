import { ContentLayout } from "@/components/admin/content-layout";
import { CreateTeamPhotoButton } from "./_components/buttons";
import { HitosList } from "./_components/hito-list";
import { prisma } from "@/lib/prisma";
import { HitoBasic } from "@/interfaces/hito";

export default async function TeamPhotoPage() {
  const data = await prisma.hito.findMany({
    orderBy: { date: "desc" },
  });

  const hitos = data.map((d) => ({
    ...d,
    id: Number(d.id),
    index: d.index ? Number(d.index) : null,
  })) as unknown as HitoBasic[];

  return (
    <ContentLayout title="Gestión de Eventos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Eventos e Hitos</h2>
          <CreateTeamPhotoButton />
        </div>

        <HitosList hitos={hitos} />
      </div>
    </ContentLayout>
  );
}
