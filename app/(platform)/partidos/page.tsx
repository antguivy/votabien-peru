import Link from "next/link";
import PartidosListPaginated from "@/components/politics/partidos-list-paginated";
import { getPartidosList } from "@/queries/public/parties";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { cn } from "@/lib/utils";

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

  const activeApiValue =
    params.active === "all"
      ? undefined
      : params.active === "false"
        ? false
        : true;

  const activeFilterValue = params.active || "true";

  const apiParams = {
    active: activeApiValue,
    search: params.search || undefined,
    limit,
    offset,
  };

  const currentFilters = {
    search: params.search || "",
    active: activeFilterValue,
    limit,
    offset,
  };

  try {
    const partidos = await getPartidosList(apiParams);

    return (
      <ContentPlatformLayout>
        <section className="pt-4 container mx-auto pb-20 lg:pb-0">
          <PartidosListPaginated
            partidos={partidos}
            currentFilters={currentFilters}
          />
        </section>
      </ContentPlatformLayout>
    );
  } catch (error) {
    console.error("Error cargando partidos:", error);

    return (
      <ContentPlatformLayout>
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
      </ContentPlatformLayout>
    );
  }
}
