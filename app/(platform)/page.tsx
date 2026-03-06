import ErrorLanding from "@/components/landing/error-landing";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import PhotoStory from "@/components/landing/photo-history";
import { getHitos } from "@/queries/public/hito";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import HeroDualSplit from "@/components/landing/hero-dual-split";
// import PeruReadinessSection from "@/components/landing/peru-readiness-section";

export default async function VotaBienPage() {
  try {
    const [hitos, proceso_electoral] = await Promise.all([
      getHitos(),
      getElectoralProcess(true),
    ]);

    return (
      <>
        <ContentPlatformLayout>
          <HeroDualSplit proceso_electoral={proceso_electoral[0]} />
          <PhotoStory hitos={hitos} />
          {/* <PeruReadinessSection /> */}
        </ContentPlatformLayout>
        <Footer />
      </>
    );
  } catch (error) {
    console.error("Error cargando datos de landing:", error);
    return <ErrorLanding />;
  }
}
