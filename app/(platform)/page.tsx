import ErrorLanding from "@/components/landing/error-landing";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { getHitos } from "@/queries/public/hito";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import HeroModern from "@/components/landing/hero-modern";
import PodcastSection from "@/components/landing/podcast";
import SocialProof from "@/components/landing/social-proof";
import LandingMobileHeader from "@/components/landing/mobile-header";

export default async function VotaBienPage() {
  try {
    const [hitos, proceso_electoral] = await Promise.all([
      getHitos(),
      getElectoralProcess({ active: true }),
    ]);
    const currentProcess =
      proceso_electoral && proceso_electoral.length > 0
        ? proceso_electoral[0]
        : null;
    return (
      <>
        {/* Mobile Header (sticky top) solo para la landing en mobile */}
        <LandingMobileHeader />

        <ContentPlatformLayout>
          {/* 1 — Hero: Estado actual (conteo / 2da vuelta) */}
          {currentProcess && <HeroModern proceso_electoral={currentProcess} />}
          <PodcastSection spotifyShowId="71ik7vUl8kN0g23hX4gl18" />
          {/* 2 — Social Proof: fotos destacadas */}
          <SocialProof hitos={hitos} />

          {/* 3 — Footer */}
          <Footer />
        </ContentPlatformLayout>
      </>
    );
  } catch (error) {
    console.error("Error cargando datos de landing:", error);
    return <ErrorLanding />;
  }
}
