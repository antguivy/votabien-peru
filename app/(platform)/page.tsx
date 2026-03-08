import ErrorLanding from "@/components/landing/error-landing";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import PhotoStory from "@/components/landing/photo-history";
import { getHitos } from "@/queries/public/hito";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import HeroDualSplit from "@/components/landing/hero-dual-split";
import Image from "next/image";
import PeruReadinessSection from "@/components/landing/peru-readiness-section";
// import PeruReadinessSection from "@/components/landing/peru-readiness-section";

export default async function VotaBienPage() {
  try {
    const [hitos, proceso_electoral] = await Promise.all([
      getHitos(),
      getElectoralProcess(true),
    ]);

    return (
      <ContentPlatformLayout>
        <HeroDualSplit proceso_electoral={proceso_electoral[0]} />
        {/* Encabezado de sección */}
        {/* <div className=" pt-10 pb-2 max-w-lg md:max-w-none px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
            El equipo que hizo posible el proyecto
          </h2>
          <div className="h-1 w-16 bg-brand rounded-full mt-4" />
        </div> */}
        {/* <PhotoStory hitos={hitos} /> */}
        <PeruReadinessSection />
        <Footer />
      </ContentPlatformLayout>
    );
  } catch (error) {
    console.error("Error cargando datos de landing:", error);
    return <ErrorLanding />;
  }
}
