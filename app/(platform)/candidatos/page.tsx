import { publicApi } from "@/lib/public-api";
import CandidatosList from "@/components/politics/candidatos-list";
import { ElectoralDistrictBase, ElectoralProcess } from "@/interfaces/politics";
import Link from "next/link";
import StickyElectoralBanner from "@/components/sticky-banner";
import { CandidateCard } from "@/interfaces/candidate";
import {
  getCandidatesCards,
  getAllCandidates,
} from "@/queries/public/candidacies";
import getDistritos from "@/queries/public/electoral-districts";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    districts?: string[];
  }>;
}

const CandidatosPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const limit = 30;

  const currentParams = {
    search: params.search || "",
    type: params.type || "all",
    districts: params.districts || [],
    skip: 0,
    limit,
  };
  try {
    const procesosActivos = (await publicApi.getProcesosElectorales(
      true,
    )) as ElectoralProcess[];

    console.log("Procesos activos:", procesosActivos);

    if (!procesosActivos || procesosActivos.length === 0) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <svg
                  className="w-10 h-10 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                No hay proceso electoral activo
              </h1>
              <p className="text-muted-foreground mb-8">
                Actualmente no hay ningún proceso electoral en curso. Los
                candidatos se mostrarán cuando se inicie un nuevo proceso.
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const procesoActivo = procesosActivos[0];
    const apiParams = {
      search: params.search || undefined,
      electoral_process_id: procesoActivo.id,
      type: params.type && params.type !== "all" ? params.type : undefined,
      districts:
        params.districts && params.districts.length > 0
          ? params.districts
          : undefined,
      skip: 0,
      limit: limit,
    };
    const [candidaturas, distritos, allCandidatos] = await Promise.all([
      getCandidatesCards(apiParams),
      getDistritos(),
      getAllCandidates(),
    ]);

    console.log("todos los candidatos obtenidos:", allCandidatos);

    const fechaElecciones = new Date(procesoActivo.election_date);
    const fechaFormateada = fechaElecciones.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Días restantes
    const hoy = new Date();
    const diasRestantes = Math.ceil(
      (fechaElecciones.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (
      <div className="min-h-screen bg-background">
        <StickyElectoralBanner
          processName={procesoActivo.name}
          electionDate={fechaFormateada}
          daysRemaining={diasRestantes}
        />

        <section className="container mx-auto p-4">
          <CandidatosList
            candidaturas={candidaturas}
            distritos={distritos}
            procesoId={procesoActivo.id}
            currentFilters={currentParams}
          />
        </section>
      </div>
    );
  } catch (error) {
    console.error("Error cargando candidatos:", error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
            <svg
              className="w-10 h-10 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Error al cargar candidatos
          </h2>
          <p className="text-muted-foreground mb-6">
            Hubo un problema al cargar la información. Por favor, intenta
            nuevamente.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }
};

export default CandidatosPage;
