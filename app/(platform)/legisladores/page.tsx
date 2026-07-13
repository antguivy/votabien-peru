import Link from "next/link";
import { Suspense } from "react";
import { getDistritos } from "@/queries/public/electoral-districts";
import { getParliamentaryGroups } from "@/queries/public/parliamentary-groups";
import { ChamberType } from "@/interfaces/politics";
import { prisma } from "@/lib/prisma";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

// Importamos el nuevo panel y el Stream
import { FilterPanelLegisladores } from "@/components/ui/filter-panel-legislators";
import { LegisladoresStream } from "./_components/legisladores-stream";

// Si aún no tienes un skeleton, puedes usar un div simple temporal o crear uno similar al de candidatos
import { LegisladoresListSkeleton } from "./_components/legisladores-list-skeleton";

interface PageProps {
  searchParams: Promise<{
    chamber?: string;
    search?: string;
    groups?: string | string[];
    districts?: string | string[];
  }>;
}

export default async function LegisladoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const limit = 30;

  // 1. Normalizar arrays
  let groupsArray: string[] = [];
  if (params.groups) {
    if (typeof params.groups === "string") {
      groupsArray = params.groups
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
    } else if (Array.isArray(params.groups)) {
      groupsArray = params.groups;
    }
  }

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

  // 2. PARAMS PARA LA API (Se los pasaremos al Stream)
  const apiParams = {
    active_only: true,
    chamber: (params.chamber && params.chamber !== "all"
      ? params.chamber
      : undefined) as ChamberType | undefined,
    search: params.search || undefined,
    groups: groupsArray.length > 0 ? groupsArray : undefined,
    districts: districtsArray.length > 0 ? districtsArray : undefined,
    skip: 0,
    limit: limit,
  };

  // 3. PARAMS PARA EL CLIENTE (Para mantener el estado de filtros)
  const currentParams = {
    search: params.search || "",
    chamber: params.chamber || "all",
    groups: groupsArray,
    districts: districtsArray,
    skip: 0,
    limit,
  };

  try {
    // 4. AQUÍ SOLO CARGAMOS DATOS PARA LOS FILTROS
    // La carga de los legisladores (getLegisladoresCards) ahora la hace el Stream
    const [distritos, parliamentaryGroups, activePeriod] = await Promise.all([
      getDistritos(),
      getParliamentaryGroups(true),
      prisma.legislativeperiod.findFirst({
        where: { active: true },
        select: { id: true },
      }),
    ]);

    const filteredDistricts = distritos.filter(
      (d) => !d.name.toUpperCase().includes("NACIONAL"),
    );

    // Pasar el legislative_period_id activo si existe
    const apiParamsWithPeriod = {
      ...apiParams,
      legislative_period_id: activePeriod?.id,
    };

    return (
      <ContentPlatformLayout>
        <section className="px-4 md:px-0 pt-4 container mx-auto pb-20 lg:pb-0">
          {/* ── PANEL DE FILTROS (Carga instantánea) ── */}
          <div className="sticky top-0 z-30 space-y-2 mb-4 bg-background border border-border/50 rounded-2xl p-2 lg:bg-background/80 lg:backdrop-blur-xl shadow-sm">
            <FilterPanelLegisladores
              currentChamber={currentParams.chamber}
              currentSearch={currentParams.search}
              // Como la UI permite seleccionar uno por uno, tomamos el primero del array (o string vacío)
              currentGroup={currentParams.groups[0] ?? ""}
              currentDistrict={currentParams.districts[0] ?? ""}
              distritos={filteredDistricts}
              bancadas={parliamentaryGroups}
            />
          </div>

          {/* ── LISTA CON SUSPENSE (Carga asíncrona) ── */}
          <Suspense
            key={`leg-${currentParams.chamber}-${currentParams.search}-${groupsArray.join(",")}-${districtsArray.join(",")}`}
            fallback={<LegisladoresListSkeleton />}
          >
            <LegisladoresStream
              apiParams={apiParamsWithPeriod}
              bancadas={parliamentaryGroups}
              distritos={filteredDistricts}
              currentFilters={currentParams}
            />
          </Suspense>
        </section>
      </ContentPlatformLayout>
    );
  } catch (error) {
    console.error("Error cargando página de legisladores:", error);

    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Error al cargar datos
          </h1>
          <p className="text-muted-foreground mb-4">
            No se pudieron cargar los filtros. Por favor, intenta nuevamente.
          </p>
          <Link
            href="/legisladores"
            className="px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand/90 inline-block transition-all"
          >
            Reintentar
          </Link>
        </div>
      </div>
    );
  }
}
