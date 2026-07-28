import { ContentPlatformLayout } from "@/components/navbar/content-layout";
// import MatchScreen from "./_components/match-screen";
import UnderConstruction from "@/components/under-construction";
// import { getDistritos } from "@/queries/public/electoral-districts";
// import { getPartidos } from "@/queries/public/parties";

export default async function MatchPage() {
  // const [districts] = await Promise.all([getDistritos()]);
  // const [parties] = await Promise.all([getPartidos()]);

  // const filteredDistricts = districts.filter(
  //   (d) => !d.name.toUpperCase().includes("NACIONAL"),
  // );
  return (
    <ContentPlatformLayout fullHeight>
      {/* <div className="h-full overflow-hidden flex justify-center bg-background px-4 pt-4">
        <div className="w-full max-w-[480px] flex flex-col min-h-0 h-full">
          <MatchScreen districts={filteredDistricts} parties={parties}/>
        </div>
      </div> */}
      <UnderConstruction
        title="La herramienta ya no está disponible"
        description="VotaBien Perú"
      />
    </ContentPlatformLayout>
  );
}
