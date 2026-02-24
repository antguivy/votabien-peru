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
        <header className="border-b border-border bg-card relative overflow-hidden">
          {/* Decoración de fondo con color brand */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-primary/5 pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-brand" />

          <div className="container mx-auto p-6 md:p-8 max-w-5xl relative">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                El equipo
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                ¿Quiénes lo hacemos posible?
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
                Proyecto colaborativo impulsado por ciudadanos voluntarios de
                diferentes regiones del Perú y el extranjero. Estudiantes y
                profesionales de diversas carreras dedicamos nuestro tiempo
                libre a promover la transparencia política y democratizar el
                acceso a información confiable sobre nuestros representantes.
              </p>
            </div>
          </div>
        </header>

        {/* Equipo */}
        <section className="py-8 md:py-10">
          <div className="container mx-auto px-4 max-w-5xl">
            <TeamListV2 members={team} />
          </div>
        </section>
      </ContentPlatformLayout>
      <Footer />
    </>
  );
}
