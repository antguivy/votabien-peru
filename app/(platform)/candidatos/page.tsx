import Link from "next/link";
import FixedElectoralBanner from "@/components/sticky-banner";
import { getCandidatesCards } from "@/queries/public/candidacies";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { getPartidosList } from "@/queries/public/parties";
import { Suspense } from "react";
import { CandidatosStream } from "@/app/(platform)/candidatos/_components/candidatos-stream";
import { CandidatosListSkeleton } from "./_components/candidatos-list-skeleton";
import { TypeBar } from "@/components/politics/type-bar";
import { NewFilterPanel } from "@/components/ui/filter-panel-candidates";
import { getDistritos } from "@/queries/public/electoral-districts";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    parties?: string | string[];
    districts?: string | string[];
    alerts?: string | string[];
    no_sentencias?: string;
    min_work?: string;
    education?: string;
  }>;
}

const CandidatosPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const limit = 40;

  // Normalizar parties → string[]
  let partiesArray: string[] = [];
  if (params.parties) {
    if (typeof params.parties === "string") {
      partiesArray = params.parties
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
    } else if (Array.isArray(params.parties)) {
      partiesArray = params.parties;
    }
  }

  // Normalizar districts → string[]
  let districtsArray: string[] = [];
  if (params.districts) {
    if (typeof params.districts === "string") {
      districtsArray = params.districts
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
    } else if (Array.isArray(params.districts)) {
      districtsArray = params.districts;
    }
  }

  const noSentencias = params.no_sentencias === "true";
  const minWork = params.min_work ? parseInt(params.min_work, 10) : 0;
  const education =
    typeof params.education === "string" ? params.education : "";

  // Filtros para el componente cliente
  const currentParams = {
    search: params.search || "",
    type: params.type || "GOBERNADOR_REGIONAL",
    parties: partiesArray,
    districts: districtsArray,
    no_sentencias: noSentencias,
    min_work: minWork,
    education: education,
  };

  // ── Proceso electoral activo ──
  const procesosActivos = await getElectoralProcess({ active: true });

  if (!procesosActivos || procesosActivos.length === 0) {
    return (
      <ContentPlatformLayout>
        <div className="text-center max-w-2xl mx-auto py-20">
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
            Actualmente no hay ningún proceso electoral en curso. Los candidatos
            se mostrarán cuando se inicie un nuevo proceso.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </ContentPlatformLayout>
    );
  }

  // Seleccionar el proceso ERM 2026 activo
  const procesoActivo =
    procesosActivos.find(
      (p) =>
        p.name.toUpperCase().includes("REGIONAL") ||
        p.name.toUpperCase().includes("MUNICIPAL") ||
        p.name.toUpperCase().includes("ERM"),
    ) || procesosActivos[0];

  // ── Parámetros para la query ──
  const apiParams = {
    search: params.search || undefined,
    electoral_process_id: procesoActivo.id,
    type: currentParams.type,
    parties: partiesArray.length > 0 ? partiesArray : undefined,
    districts: districtsArray.length > 0 ? districtsArray : undefined,
    no_sentencias: noSentencias,
    min_work: minWork,
    education: education,
    page: 1,
    pageSize: limit,
  };

  // ── Fetching en paralelo ──
  const distritosPromise = getDistritos();
  const partiesPromise = getPartidosList({ active: true, limit: 120 });
  const candidaturasPromise = getCandidatesCards(apiParams);

  const [distritos, partiesData] = await Promise.all([
    distritosPromise,
    partiesPromise,
  ]);

  const filteredDistricts = distritos.filter(
    (d) => !d.name.toUpperCase().includes("NACIONAL"),
  );

  // ── Banner electoral ──
  const fechaElecciones = new Date(procesoActivo.election_date);
  const fechaFormateada = fechaElecciones.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const hoy = new Date();
  const diasRestantes = Math.ceil(
    (fechaElecciones.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <ContentPlatformLayout>
      <FixedElectoralBanner
        processName={procesoActivo.name}
        electionDate={fechaFormateada}
        daysRemaining={diasRestantes}
      />
      <section className="px-4 md:px-0 pt-4 container mx-auto pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 space-y-2 mb-4 bg-background border border-brand/20 rounded-2xl p-2 shadow-sm">
          <TypeBar currentType={currentParams.type} />
          <NewFilterPanel
            currentType={currentParams.type}
            currentSearch={currentParams.search}
            currentParty={currentParams.parties[0] ?? ""}
            currentDistrict={currentParams.districts[0] ?? ""}
            currentNoSentencias={noSentencias}
            currentMinWork={minWork}
            currentEducation={education}
            distritos={filteredDistricts}
            parties={partiesData.items}
          />
        </div>
        <Suspense
          key={`${currentParams.type}-${currentParams.search}-${partiesArray.join(",")}-${districtsArray.join(",")}-${noSentencias}-${minWork}-${education}`}
          fallback={<CandidatosListSkeleton />}
        >
          <CandidatosStream
            candidaturasPromise={candidaturasPromise}
            distritos={filteredDistricts}
            parties={partiesData.items}
            procesoId={procesoActivo.id}
            currentFilters={currentParams}
          />
        </Suspense>
      </section>
    </ContentPlatformLayout>
  );
};

export default CandidatosPage;
