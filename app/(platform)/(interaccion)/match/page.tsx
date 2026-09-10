import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import MatchScreen from "./_components/match-screen";
import UnderConstruction from "@/components/under-construction";
import { getDistritos } from "@/queries/public/electoral-districts";
import { getPartidosListSimple } from "@/queries/public/parties";
import { serverGetUser } from "@/lib/auth-actions";

export const metadata = {
  title: "Mi Candidato | VotaBien Perú",
  description: "Descubre afinidad con candidatos y propuestas electorales.",
};

export default async function MatchPage() {
  const { user } = await serverGetUser();

  if (!user) {
    return (
      <ContentPlatformLayout fullHeight>
        <UnderConstruction feature="match" isTeam />
      </ContentPlatformLayout>
    );
  }

  const [districts, parties] = await Promise.all([
    getDistritos(),
    getPartidosListSimple({ active: true }),
  ]);

  const filteredDistricts = districts.filter(
    (d) => !d.name.toUpperCase().includes("NACIONAL"),
  );

  return (
    <ContentPlatformLayout fullHeight>
      <div className="h-full overflow-hidden flex justify-center bg-background px-4 pt-4">
        <div className="w-full max-w-[480px] flex flex-col min-h-0 h-full">
          <MatchScreen districts={filteredDistricts} parties={parties} />
        </div>
      </div>
    </ContentPlatformLayout>
  );
}
