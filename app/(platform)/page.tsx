import ErrorLanding from "@/components/landing/error-landing";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
// import { getHitos } from "@/queries/public/hito";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import HeroModern from "@/components/landing/hero-modern";
import PodcastSection from "@/components/landing/podcast";
import SocialProof from "@/components/landing/social-proof";
import LandingMobileHeader from "@/components/landing/mobile-header";

export default async function VotaBienPage() {
  try {
    // const [hitos, proceso_electoral] = await Promise.all([
    //   getHitos(),
    //   getElectoralProcess(true),
    // ]);
    const [proceso_electoral] = await Promise.all([getElectoralProcess(true)]);
    return (
      <>
        {/* Mobile Header (sticky top) solo para la landing en mobile */}
        <LandingMobileHeader />

        <ContentPlatformLayout>
          {/* 1 — Hero: Estado actual (conteo / 2da vuelta) */}
          <HeroModern proceso_electoral={proceso_electoral[0]} />

          {/* 2 — Social Proof: fotos destacadas (marquee comentado) */}
          {/* <SocialProof hitos={hitos} /> */}

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
