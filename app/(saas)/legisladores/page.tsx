import { publicApi } from "@/lib/public-api";
import LegisladoresList from "@/components/politics/legisladores-list";
import { serverGetUser } from "@/lib/auth-actions";
import AdminActions from "@/components/admin/admin-actions";
import { DistritoElectoral, PartidoPoliticoBase, PersonaList } from "@/interfaces/politics";
import Link from "next/link";

interface PageProps {
  searchParams: {
    camara?: string;
    search?: string;
    partidos?: string | string[];
    distritos?: string | string[]
  };
}

export default async function LegisladoresPage({ searchParams }: PageProps) {
  // Verificar si es admin
  const params = await searchParams;
  const userResult = await serverGetUser();
  const isAdmin = userResult.success && userResult.user?.is_admin;

  // Parsear parámetros

  const limit = 10;

  const apiParams = {
    es_legislador_activo: true, // Asegúrate que esto esté presente
    camara: params.camara && params.camara !== "all" ? params.camara : undefined,
    search: params.search || undefined,
    partidos: params.partidos && params.partidos !== "all" ? params.partidos : undefined,
    distritos: params.distritos && params.distritos !== "all" ? params.distritos : undefined,
    skip: 0,
    limit: limit,
  };

  const currentParams = {
    search: params.search || "",
    camara: params.camara || "all",
    partidos: params.partidos || [],
    distritos: params.distritos || [],
    skip: 0,
    limit,
  };

  try {
    // Obtener datos en paralelo
    const [initialLegisladores, partidos, distritos] = await Promise.all([
      publicApi.getPersonas(apiParams) as Promise<PersonaList[]>,
      publicApi.getPartidos(true) as Promise<PartidoPoliticoBase[]>,
      publicApi.getDistritos() as Promise<DistritoElectoral[]>,
    ]);
    console.log("legisladores", initialLegisladores)
    return (
      <div className="container mx-auto px-4">
        {/* Admin Actions */}
        {isAdmin && (
          <AdminActions
            actions={[
              {
                label: "Nuevo Congresista",
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
        <LegisladoresList
          legisladores={initialLegisladores}
          partidos={partidos}
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
