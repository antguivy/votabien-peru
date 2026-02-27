import { getTeam } from "@/queries/public/team";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import TeamListV2 from "./_components/team-list-v2";

export default async function TeamPage() {
  const [team] = await Promise.all([getTeam()]);

  return (
    <>
      <ContentPlatformLayout>
        {/* Header */}
        <div className="max-w-5xl mx-auto">
          <div className="container mx-auto p-6 md:p-8 max-w-5xl relative space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">
              El equipo
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              ¿Quiénes lo hacemos posible?
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed pt-1">
              Proyecto colaborativo impulsado por ciudadanos voluntarios de
              diferentes regiones del Perú y el extranjero. Estudiantes y
              profesionales de diversas carreras dedicamos nuestro tiempo libre
              a promover la transparencia política y democratizar el acceso a
              información confiable sobre nuestros representantes.
            </p>
          </div>
        </div>

        {/* Equipo */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto max-w-5xl px-4">
            <TeamListV2 members={team} />
          </div>
        </section>
      </ContentPlatformLayout>
      <Footer />
    </>
  );
}
