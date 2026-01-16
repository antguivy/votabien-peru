import LegisladoresList from "@/components/politics/legisladores-list";
import Link from "next/link";
import { getLegisladoresCards } from "@/queries/public/legislators";
import getDistritos from "@/queries/public/electoral-districts";
import { getParliamentaryGroups } from "@/queries/public/parliamentary-groups";
import { ChamberType } from "@/interfaces/politics";

interface PageProps {
  searchParams: Promise<{
    chamber?: string;
    search?: string;
    groups?: string[];
    districts?: string[];
  }>;
}

export default async function LegisladoresPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const limit = 30;

  const apiParams = {
    active_only: true,
    chamber: (params.chamber && params.chamber !== "all"
      ? params.chamber
      : undefined) as ChamberType | undefined,
    search: params.search || undefined,
    groups:
      params.groups && params.groups.length > 0 ? params.groups : undefined,
    districts:
      params.districts && params.districts.length > 0
        ? params.districts
        : undefined,
    skip: 0,
    limit: limit,
  };

  const currentParams = {
    search: params.search || "",
    chamber: params.chamber || "all",
    groups: params.groups || [],
    districts: params.districts || [],
    skip: 0,
    limit,
  };

  try {
    const [initialLegisladores, distritos, parliamentaryGroups] =
      await Promise.all([
        getLegisladoresCards(apiParams),
        getDistritos(),
        getParliamentaryGroups(true),
      ]);
    return (
      <div className="container mx-auto p-4">
        {/* Resultados */}
        <LegisladoresList
          legisladores={initialLegisladores}
          bancadas={parliamentaryGroups}
          distritos={distritos}
          currentFilters={currentParams}
        />
      </div>
    );
  } catch (error) {
    console.error("Error cargando legisladores:", error);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error al cargar datos
          </h1>
          <p className="text-gray-600 mb-4">
            No se pudieron cargar los legisladores. Por favor, intenta
            nuevamente.
          </p>
          <Link
            href="/legisladores"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
          >
            Reintentar
          </Link>
        </div>
      </div>
    );
  }
}
