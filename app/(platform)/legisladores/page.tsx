import LegisladoresList from "@/components/politics/legisladores-list";
import Link from "next/link";
import { getLegisladoresCards } from "@/queries/public/legislators";
import getDistritos from "@/queries/public/electoral-districts";
import { getParliamentaryGroups } from "@/queries/public/parliamentary-groups";
import { ChamberType } from "@/interfaces/politics";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

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

  let groupsArray: string[] = [];
  if (params.groups) {
    if (typeof params.groups === "string") {
      groupsArray = params.groups.split(",").map((d) => d.trim());
    } else if (Array.isArray(params.groups)) {
      groupsArray = params.groups;
    }
  }

  let districtsArray: string[] = [];
  if (params.districts) {
    if (typeof params.districts === "string") {
      districtsArray = params.districts.split(",").map((d) => d.trim());
    } else if (Array.isArray(params.districts)) {
      districtsArray = params.districts;
    }
  }

  // 2. PARAMS PARA LA API (Arrays limpios)
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
  // Nota: groupsArray ya es string[], perfecto para tu componente
  const currentParams = {
    search: params.search || "",
    chamber: params.chamber || "all",
    groups: groupsArray,
    districts: districtsArray,
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
      <ContentPlatformLayout>
        <section className="pt-4 container mx-auto pb-20 lg:pb-0">
          <LegisladoresList
            legisladores={initialLegisladores}
            bancadas={parliamentaryGroups}
            distritos={distritos}
            currentFilters={currentParams}
          />
        </section>
      </ContentPlatformLayout>
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
