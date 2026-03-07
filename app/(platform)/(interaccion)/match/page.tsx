import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import MatchScreen from "./_components/match-screen";
import getDistritos from "@/queries/public/electoral-districts";

export default async function MatchPage() {
  const [districts] = await Promise.all([getDistritos()]);

  return (
    <ContentPlatformLayout fullHeight>
      <div className="h-dvh flex justify-center bg-background pb-20">
        <div className="w-full max-w-[480px] flex flex-col min-h-0">
          <MatchScreen districts={districts} />
        </div>
      </div>
    </ContentPlatformLayout>
  );
}
