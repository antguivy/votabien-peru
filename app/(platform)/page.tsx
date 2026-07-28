import ErrorLanding from "@/components/landing/error-landing";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { getHitos } from "@/queries/public/hito";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import HeroModern from "@/components/landing/hero-modern";
// import PodcastSection from "@/components/landing/podcast";
import SocialProof from "@/components/landing/social-proof";
import LandingMobileHeader from "@/components/landing/mobile-header";
import HemicileLegislator from "@/components/landing/hemicicle";
import { getSeatParliamentary } from "@/queries/public/seats";
import { ChamberType } from "@/interfaces/politics";

export default async function VotaBienPage() {
  try {
    const [hitos, proceso_electoral, seatsDiputados, seatsSenado] =
      await Promise.all([
        getHitos(),
        getElectoralProcess({ active: true }),
        getSeatParliamentary(ChamberType.DIPUTADOS),
        getSeatParliamentary(ChamberType.SENADO),
      ]);
    const currentProcess =
      proceso_electoral && proceso_electoral.length > 0
        ? proceso_electoral[0]
        : null;

    // Si diputados está vacío pero hay datos en el CONGRESO (legacy), usamos ese
    const fallbackSeats =
      seatsDiputados.length > 0
        ? []
        : await getSeatParliamentary(ChamberType.CONGRESO);

    const finalSeats =
      seatsDiputados.length > 0
        ? [...seatsDiputados, ...seatsSenado]
        : fallbackSeats;

    return (
      <>
        {/* Mobile Header (sticky top) solo para la landing en mobile */}
        <LandingMobileHeader />

        <ContentPlatformLayout>
          {/* 1 — Hero: Estado actual (conteo / 2da vuelta) */}
          <HeroModern />

          {/* Componente del Hemiciclo */}
          {finalSeats && finalSeats.length > 0 && (
            <div className="mt-8 mb-16 px-4 md:px-0">
              <HemicileLegislator seatsData={finalSeats} />
            </div>
          )}

          {/*<PodcastSection spotifyShowId="71ik7vUl8kN0g23hX4gl18" />*/}
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
