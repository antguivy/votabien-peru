import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import MatchScreen from "./_components/match-screen";

export default async function MatchPage() {
  return (
    <ContentPlatformLayout fullHeight>
      <div
        className="flex justify-center bg-background"
        style={{ height: "100dvh" }}
      >
        <div className="w-full" style={{ maxWidth: 480 }}>
          <MatchScreen />
        </div>
      </div>
    </ContentPlatformLayout>
  );
}
