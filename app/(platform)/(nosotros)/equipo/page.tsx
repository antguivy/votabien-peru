import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import TeamList from "@/app/(platform)/(nosotros)/equipo/_components/team-list";
import { getTeam, type TeamMember } from "@/queries/public/team";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

export default async function TeamPage() {
  let team: TeamMember[] = [];
  try {
    team = await getTeam();
  } catch (error) {
    console.error("Error al obtener el equipo:", error);
  }

  return (
    <ContentPlatformLayout>
      <section className="pt-4 container mx-auto pb-20 lg:pb-0">
        {/* Header */}
        <header className="border-b border-border bg-card relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 pointer-events-none" />
          <div className="container mx-auto p-4 max-w-5xl relative">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-foreground">
                ¿Quiénes lo hacemos posible?
              </h1>
              <p className="text-xl text-muted-foreground max-w-5xl">
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
        <section className="py-12 md:py-16 bg-muted/20">
          <div className="container mx-auto px-4 max-w-5xl">
            <TeamList members={team} />
          </div>
        </section>

        <Footer />
      </section>
    </ContentPlatformLayout>
  );
}
