import { SearchParams } from "nuqs";
import { searchParamsCache, ComparatorParamsSchema } from "./_lib/validation";
import { getComparisonData, getEntitiesByIds } from "./_lib/data";
import { extractEntitiesFromComparison } from "./_lib/helpers";
import { searchPresidentialCandidates } from "./_lib/actions";
import { ComparatorProvider } from "@/components/context/comparator";
import ComparatorLayout from "./_components/comparator-layout";
import { SearchableEntity } from "@/interfaces/ui-types";
import { ComparisonResponse } from "@/interfaces/comparator";
import { getPartidosListSimple } from "@/queries/public/parties";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
// import UnderConstruction from "@/components/under-construction";
// import { serverGetUser } from "@/lib/auth-actions";

export const metadata = {
  title: "Comparador de Fórmulas y Planes | VotaBien Perú",
  description:
    "Contraste temático cara a cara de propuestas electorales y fórmulas políticas.",
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ComparatorPage(props: PageProps) {
  // Habilitado para demostración a aliados / Fundación BBVA
  // const { user } = await serverGetUser();
  // if (!user) {
  //   return (
  //     <ContentPlatformLayout>
  //       <UnderConstruction feature="comparador" isTeam />
  //     </ContentPlatformLayout>
  //   );
  // }

  const resolvedParams = await props.searchParams;
  const search = searchParamsCache.parse(
    resolvedParams,
  ) as ComparatorParamsSchema;

  let initialEntities: SearchableEntity[] = [];
  let comparisonData: ComparisonResponse = null;

  if (search.ids.length >= 2) {
    comparisonData = await getComparisonData(search);
    initialEntities = comparisonData
      ? extractEntitiesFromComparison(comparisonData)
      : await getEntitiesByIds(search.ids);
  } else if (search.ids.length === 1) {
    initialEntities = await getEntitiesByIds(search.ids);
  }

  async function performSearch(query: string): Promise<SearchableEntity[]> {
    "use server";
    try {
      return await searchPresidentialCandidates(query, {
        parties: search.parties,
      });
    } catch {
      return [];
    }
  }

  const parties = await getPartidosListSimple({ active: true });

  return (
    <ComparatorProvider
      initialEntities={initialEntities}
      parties={parties}
      selectedIds={search.ids}
    >
      <ContentPlatformLayout>
        <section className="container px-4 pt-4 mx-auto pb-20 lg:pb-0">
          <ComparatorLayout
            data={comparisonData}
            searchAction={performSearch}
          />
        </section>
      </ContentPlatformLayout>
    </ComparatorProvider>
  );
}
