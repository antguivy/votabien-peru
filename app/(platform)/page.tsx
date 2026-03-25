import ErrorLanding from "@/components/landing/error-landing";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { getHitos } from "@/queries/public/hito";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import HeroDualSplit from "@/components/landing/hero-dual-split";
import PodcastSection from "@/components/landing/podcast";

export default async function VotaBienPage() {
  try {
    const [hitos, proceso_electoral] = await Promise.all([
      getHitos(),
      getElectoralProcess(true),
    ]);

    return (
      <ContentPlatformLayout>
        {/* 1 — Hero: gancho emocional + countdown + quick filters */}
        <HeroDualSplit proceso_electoral={proceso_electoral[0]} />
        <PodcastSection spotifyShowId="71ik7vUl8kN0g23hX4gl18" />
        <Footer />
      </ContentPlatformLayout>
    );
  } catch (error) {
    console.error("Error cargando datos de landing:", error);
    return <ErrorLanding />;
  }
}
