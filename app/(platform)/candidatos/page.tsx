import CandidatosList from "@/components/politics/candidatos-list";
import Link from "next/link";
import StickyElectoralBanner from "@/components/sticky-banner";
import { getCandidatesCards } from "@/queries/public/candidacies";
import getDistritos from "@/queries/public/electoral-districts";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { getPartidosList } from "@/queries/public/parties";
import { Suspense } from "react";
import { CandidatosStream } from "@/app/(platform)/candidatos/_components/candidatos-stream";
import { CandidatosListSkeleton } from "./_components/candidatos-list-skeleton";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    parties?: string | string[];
    districts?: string | string[];
    districtType?: "unico" | "multiple";
  }>;
}

const CandidatosPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const limit = 30;
  let districtsArray: string[] = [];
  let partiesArray: string[] = [];

  if (params.districts) {
    if (typeof params.districts === "string") {
      // String → Array
      districtsArray = params.districts.split(",").map((d) => d.trim());
    } else if (Array.isArray(params.districts)) {
      // Ya es array
      districtsArray = params.districts;
    }
  }
  if (params.parties) {
    if (typeof params.parties === "string") {
      // String → Array
      partiesArray = params.parties.split(",").map((d) => d.trim());
    } else if (Array.isArray(params.parties)) {
      // Ya es array
      partiesArray = params.parties;
    }
  }
  const currentParams = {
    search: params.search || "",
    type: params.type || "PRESIDENTE",
    parties: partiesArray,
    districts: districtsArray,
    districtType: params.districtType || undefined,
    skip: 0,
    limit,
  };

  const procesosActivos = await getElectoralProcess(true);

  if (!procesosActivos || procesosActivos.length === 0) {
    return (
      <ContentPlatformLayout>
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

  const procesoActivo = procesosActivos[0];
  const apiParams = {
    search: params.search || undefined,
    electoral_process_id: procesoActivo.id,
    type: params.type && params.type !== "all" ? params.type : "PRESIDENTE",
    districtType: params.districtType || undefined,
    parties: partiesArray.length > 0 ? partiesArray : undefined,
    districts: districtsArray.length > 0 ? districtsArray : undefined,
    skip: 0,
    limit: limit,
  };
  const distritosPromise = getDistritos();
  const partiesPromise = getPartidosList({ active: true, limit: 60 });
  const candidaturasPromise = getCandidatesCards(apiParams);

  const [distritos, parties] = await Promise.all([
    distritosPromise,
    partiesPromise,
  ]);

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
      <StickyElectoralBanner
        processName={procesoActivo.name}
        electionDate={fechaFormateada}
        daysRemaining={diasRestantes}
      />
      <section className="px-4 pt-4 container mx-auto pb-20 lg:pb-0">
        <Suspense fallback={<CandidatosListSkeleton />}>
          <CandidatosStream
            key={`${params.type ?? "PRESIDENTE"}-${params.search ?? ""}-${partiesArray.join(",")}-${districtsArray.join(",")}-${params.districtType ?? ""}`}
            candidaturasPromise={candidaturasPromise}
            distritos={distritos}
            parties={parties.items}
            procesoId={procesoActivo.id}
            currentFilters={currentParams}
          />
        </Suspense>
      </section>
    </ContentPlatformLayout>
  );
};

export default CandidatosPage;
