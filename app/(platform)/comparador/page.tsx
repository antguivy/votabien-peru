import { SearchParams } from "nuqs";
import {
  searchParamsCache,
  isCandidateMode,
  ComparatorParamsSchema,
} from "./_lib/validation";
import { getComparisonData, getEntitiesByIds } from "./_lib/data";
import { extractEntitiesFromComparison } from "./_lib/helpers";
import { searchEntities } from "./_lib/actions";
import { ComparatorProvider } from "@/components/context/comparator";
import ComparatorLayout from "./_components/comparator-layout";
import { SearchableEntity } from "@/interfaces/ui-types";
import { ComparisonResponse } from "@/interfaces/comparator";
import getDistritos from "@/queries/public/electoral-districts";
import { getPartidosListSimple } from "@/queries/public/parties";
import { ChamberType } from "@/interfaces/politics";
import { SearchContext } from "./_components/selector";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

interface SearchExtras {
  chamber?: ChamberType;
  candidacy_type?: string;
  parties?: string[];
  districts?: string[];
  has_metrics_only: boolean;
}

export default async function ComparatorPage(props: PageProps) {
  const resolvedParams = await props.searchParams;
  const search = searchParamsCache.parse(
    resolvedParams,
  ) as ComparatorParamsSchema;
  const currentMode = search.mode;

  let initialEntities: SearchableEntity[] = [];
  let comparisonData: ComparisonResponse = null;

  if (search.dnis.length > 0) {
    if (search.dnis.length >= 2) {
      comparisonData = await getComparisonData(search);
      if (comparisonData) {
        initialEntities = extractEntitiesFromComparison(
          comparisonData,
          currentMode,
        );
      } else {
        initialEntities = await getEntitiesByIds(search.dnis, currentMode);
      }
    } else {
      initialEntities = await getEntitiesByIds(search.dnis, currentMode);
    }
  }

  async function performSearch(
    query: string,
    context?: SearchContext,
  ): Promise<SearchableEntity[]> {
    "use server";
    try {
      const extras: SearchExtras = { has_metrics_only: false };

      if (currentMode === "legislator") {
        extras.chamber = (context?.chamber || search.chamber) as
          | ChamberType
          | undefined;
        extras.parties = context?.party ? [context.party] : search.parties;
        extras.districts = context?.district
          ? [context.district]
          : search.districts;
      } else if (isCandidateMode(currentMode)) {
        const typeToUse = context?.type || search.type || search.candidacy_type;

        extras.candidacy_type = typeToUse;
        extras.parties = context?.party ? [context.party] : search.parties;
        extras.districts = context?.district
          ? [context.district]
          : search.districts;
      }

      return await searchEntities(query, currentMode, extras);
    } catch (error) {
      console.error("Search Action Error:", error);
      return [];
    }
  }

  const [districts, parties] = await Promise.all([
    getDistritos(),
    getPartidosListSimple({ active: true }),
  ]);

  return (
    <ComparatorProvider
      initialEntities={initialEntities}
      districts={districts}
      parties={parties}
      mode={currentMode}
      selectedIds={search.dnis}
    >
      <ComparatorLayout data={comparisonData} searchAction={performSearch} />
    </ComparatorProvider>
  );
}
