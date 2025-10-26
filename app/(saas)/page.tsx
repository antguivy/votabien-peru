import { publicApi } from "@/lib/public-api";
import LegisladoresList from "@/components/politics/legisladores-list";
import PartidosList from "@/components/politics/partidos-list";
import ProcesosElectoralesBanner from "@/components/politics/procesos-banner";
import Hero from "@/components/landing/hero";
import Stats from "@/components/landing/stats";
import Footer from "@/components/landing/footer";
import ErrorLanding from "@/components/landing/error-landing";
import {
  PartidoDetail,
  PersonaList,
  ProcesoElectoral,
} from "@/interfaces/politics";
import Link from "next/link";
import HeroDualSplit from "@/components/landing/hero-dual-split";
// import ComparadorVelada from "@/components/vs-destacado";

const SaasPage = async () => {
  try {
    // Obtener datos en paralelo
    const [personas, partidos, procesosElectorales] = await Promise.all([
      publicApi.getPersonas({
        es_legislador_activo: true,
        limit: 10,
      }) as Promise<PersonaList[]>,
      publicApi.getPartidos(true) as Promise<PartidoDetail[]>,
      publicApi.getProcesosElectorales(true) as Promise<ProcesoElectoral[]>,
    ]);

    // Calcular estadísticas
    const stats = {
      totalLegisladores: personas.length,
      totalPartidos: partidos.length,
      legisladoresSuspendidos: 0,
      proyectosEnCurso: 0,
    };
    const legislador = personas.map((p) => p.periodo_activo);
    const asistencia = legislador.map((l) => l.asistencias);
    const denuncias = legislador.map((l) => l.denuncias);

    console.log("asistencias", asistencia);
    console.log("denuncias", denuncias);
    return (
      <div className="min-h-screen">
        {/* Hero Dual Split */}
        <HeroDualSplit />
        {/* <ComparadorVelada legisladores={personas}/> */}

        {/* Partidos Políticos */}
        <section className="bg-muted/30 py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 md:mb-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    Partidos Políticos
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                    Conoce las agrupaciones políticas representadas en el
                    Congreso
                  </p>
                </div>
                <Link
                  href="/partidos"
                  className="hidden md:inline-flex items-center text-primary hover:text-primary/80 font-medium text-sm transition-colors group"
                >
                  Ver todos
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            <PartidosList partidos={partidos} />

            {/* CTA móvil */}
            <div className="text-center mt-6 md:mt-8">
              <Link
                href="/partidos"
                className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-3.5 bg-card border-2 border-border text-foreground font-semibold rounded-lg md:rounded-xl hover:bg-accent hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Ver todos los partidos
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("Error cargando datos de landing:", error);
    return <ErrorLanding />;
  }
};

export default SaasPage;
