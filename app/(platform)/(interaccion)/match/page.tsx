import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import MatchScreen from "./_components/match-screen";
import getDistritos from "@/queries/public/electoral-districts";

export default async function MatchPage() {
  const [districts] = await Promise.all([getDistritos()]);

  return (
    <ContentPlatformLayout fullHeight>
      <div
        className="flex justify-center bg-background"
        style={{ height: "100dvh" }}
      >
        <div className="w-full" style={{ maxWidth: 480 }}>
          <MatchScreen districts={districts} />
        </div>
      </div>
    </ContentPlatformLayout>
  );
}
