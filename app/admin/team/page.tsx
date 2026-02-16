import { ContentLayout } from "@/components/admin/content-layout";
import { CreateTeamButton } from "./_components/buttons";
import { TeamList } from "./_components/team-list";
import { getTeam } from "@/queries/public/team";

export default async function TeamPage() {
  const [team] = await Promise.all([getTeam()]);

  return (
    <ContentLayout title="Equipo">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Lista de Colaboradores
          </h2>
          <CreateTeamButton />
        </div>

        <TeamList team={team} />
      </div>
    </ContentLayout>
  );
}
