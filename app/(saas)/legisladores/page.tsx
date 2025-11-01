import { publicApi } from "@/lib/public-api";
import LegisladoresList from "@/components/politics/legisladores-list";
import { serverGetUser } from "@/lib/auth-actions";
import AdminActions from "@/components/admin/admin-actions";
import { ElectoralDistrict, PersonList } from "@/interfaces/politics";
import Link from "next/link";

interface PageProps {
  searchParams: {
    chamber?: string;
    search?: string;
    groups?: string | string[];
    districts?: string | string[];
  };
}

export default async function LegisladoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const userResult = await serverGetUser();
  const isAdmin = userResult.success && userResult.user?.is_admin;

  const limit = 30;

  const apiParams = {
    is_legislator_active: true,
    chamber:
      params.chamber && params.chamber !== "all" ? params.chamber : undefined,
    search: params.search || undefined,
    groups:
      params.groups && params.groups !== "all" ? params.groups : undefined,
    districts:
      params.districts && params.districts !== "all"
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
        publicApi.getPersonas(apiParams) as Promise<PersonList[]>,
        publicApi.getDistritos() as Promise<ElectoralDistrict[]>,
        publicApi.getParliamentaryGroups() as Promise<string[]>,
      ]);
    return (
      <div className="container mx-auto px-4">
        {/* Admin Actions */}
        {isAdmin && (
          <AdminActions
            actions={[
              {
                label: "Nuevo Legislador",
                href: "/admin/legisladores/nuevo",
                icon: "plus",
              },
              {
                label: "Importar Excel",
                href: "/admin/legisladores/importar",
                icon: "upload",
              },
              {
                label: "Exportar Datos",
                href: "/api/admin/legisladores/export",
                icon: "download",
              },
            ]}
          />
        )}

        {/* Resultados */}
        <div className="py-4">
          <LegisladoresList
            legisladores={initialLegisladores}
            bancadas={parliamentaryGroups}
            distritos={distritos}
            currentFilters={currentParams}
          />
        </div>
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
