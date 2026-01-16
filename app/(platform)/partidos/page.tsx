import Link from "next/link";
import PartidosListPaginated from "@/components/politics/partidos-list-paginated";
import { getPartidosList } from "@/queries/public/parties";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    active?: string;
    limit?: string;
    offset?: string;
  }>;
}

export default async function PartidosPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const limit = parseInt(params.limit || "30");
  const offset = parseInt(params.offset || "0");

  const queryParams = {
    active:
      params.active === "false"
        ? false
        : params.active === "true"
          ? true
          : undefined,
    search: params.search || undefined,
    limit,
    offset,
  };

  const currentFilters = {
    search: params.search || "",
    active: params.active || "all",
    limit,
    offset,
  };

  try {
    const partidos = await getPartidosList(queryParams);

    return (
      <div className="min-h-screen bg-background">
        <PartidosListPaginated
          partidos={partidos}
          currentFilters={currentFilters}
        />
      </div>
    );
  } catch (error) {
    console.error("Error cargando partidos:", error);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error al cargar datos
          </h1>
          <p className="text-gray-600 mb-4">
            No se pudieron cargar los partidos. Por favor, intenta nuevamente.
          </p>
          <Link
            href="/partidos?active=true"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
          >
            Reintentar
          </Link>
        </div>
      </div>
    );
  }
}
