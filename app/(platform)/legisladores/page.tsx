import Link from "next/link";
import { Suspense } from "react";
import { getDistritos } from "@/queries/public/electoral-districts";
import { getParliamentaryGroups } from "@/queries/public/parliamentary-groups";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

// Importamos el nuevo panel y el Stream
import { FilterPanelLegisladores } from "@/components/ui/filter-panel-legislators";
import { LegisladoresStream } from "./_components/legisladores-stream";

// Si aún no tienes un skeleton, puedes usar un div simple temporal o crear uno similar al de candidatos
import { LegisladoresListSkeleton } from "./_components/legisladores-list-skeleton";
import { getActiveLegislativePeriod } from "@/queries/public/legislators";

export default async function LegisladoresPage() {
  try {
    // 4. AQUÍ SOLO CARGAMOS DATOS PARA LOS FILTROS
    // La carga de los legisladores (getLegisladoresCards) ahora la hace el Stream
    const [distritos, parliamentaryGroups, activePeriod] = await Promise.all([
      getDistritos(),
      getParliamentaryGroups(true),
      getActiveLegislativePeriod(),
    ]);

    const filteredDistricts = distritos.filter(
      (d) => !d.name.toUpperCase().includes("NACIONAL"),
    );

    return (
      <ContentPlatformLayout>
        <section className="px-4 md:px-0 pt-4 container mx-auto pb-20 lg:pb-0">
          <div className="sticky top-0 z-30 space-y-2 mb-4 bg-background border border-border/50 rounded-2xl p-2 lg:bg-background/80 lg:backdrop-blur-xl shadow-sm">
            <FilterPanelLegisladores
              currentChamber="all"
              currentSearch=""
              currentGroup=""
              currentDistrict=""
              distritos={filteredDistricts}
              bancadas={parliamentaryGroups}
            />
          </div>

          {/* ── ENVOLVEMOS EN SUSPENSE ── */}
          <Suspense fallback={<LegisladoresListSkeleton />}>
            <LegisladoresStream
              distritos={filteredDistricts}
              bancadas={parliamentaryGroups}
              activePeriodId={activePeriod?.id}
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
