import { publicApi } from "@/lib/public-api";
import CandidatosList from "@/components/politics/candidatos-list";
import { Calendar, Timer } from "lucide-react";
import {
  CandidateDetail,
  ElectoralDistrict,
  PoliticalPartyBase,
  ElectoralProcess,
} from "@/interfaces/politics";
import Link from "next/link";

interface PageProps {
  searchParams: {
    search?: string;
    partidos?: string | string[];
    distritos?: string | string[];
    tipo?: string;
  };
}

const CandidatosPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const limit = 30;

  const apiParams = {
    es_legislador_activo: true,
    tipo: params.tipo && params.tipo !== "all" ? params.tipo : undefined,
    search: params.search || undefined,
    partidos:
      params.partidos && params.partidos !== "all"
        ? params.partidos
        : undefined,
    distritos:
      params.distritos && params.distritos !== "all"
        ? params.distritos
        : undefined,
    skip: 0,
    limit: limit,
  };

  try {
    const procesosActivos = (await publicApi.getProcesosElectorales(
      true,
    )) as ElectoralProcess[];

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

    const [candidaturas, partidos, distritos] = await Promise.all([
      publicApi.getCandidaturas(apiParams) as Promise<CandidateDetail[]>,
      publicApi.getPartidos(true) as Promise<PoliticalPartyBase[]>,
      publicApi.getDistritos() as Promise<ElectoralDistrict[]>,
    ]);

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
        {/* Header con información del proceso */}
        <section className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {procesoActivo.name}
              </h1>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-sm md:text-base">
                <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-primary-foreground/20">
                  <Calendar className="size-5" />
                  <span className="font-medium">{fechaFormateada}</span>
                </div>

                {diasRestantes > 0 && (
                  <div className="inline-flex items-center gap-2 bg-warning backdrop-blur-sm rounded-lg px-4 py-2 border border-warning/30">
                    <Timer className="size-5" />
                    <span className="font-bold">
                      {diasRestantes}{" "}
                      {diasRestantes === 1 ? "día" : "días restantes"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Lista de candidatos con filtros */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <CandidatosList
            candidaturas={candidaturas}
            partidos={partidos}
            distritos={distritos}
            procesoId={procesoActivo.id}
            currentFilters={{
              search: params.search || "",
              partidos: params.partidos || "all",
              distritos: params.distritos || "all",
              tipo: params.tipo || "all",
            }}
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
