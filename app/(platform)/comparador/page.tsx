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

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// ============================================
// TIPOS PARA EXTRAS DE BÚSQUEDA
// ============================================

interface LegislatorSearchExtras {
  has_metrics_only: boolean;
  chamber?: ChamberType;
  parties?: string[];
  districts?: string[];
  // active_only?: boolean;
}

interface CandidateSearchExtras {
  has_metrics_only: boolean;
  // process_id: string;
  candidacy_type?: string;
  parties?: string[];
  districts?: string[];
}

type SearchExtras = LegislatorSearchExtras | CandidateSearchExtras;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default async function ComparatorPage(props: PageProps) {
  const resolvedParams = await props.searchParams;
  const search = searchParamsCache.parse(
    resolvedParams,
  ) as ComparatorParamsSchema;

  const currentMode = search.mode;

  // ============================================
  // CARGA DE DATOS PRINCIPAL
  // ============================================

  let initialEntities: SearchableEntity[] = [];
  let comparisonData: ComparisonResponse = null;

  // CASO 1: Hay IDs para comparar (2+)
  if (search.ids.length >= 2) {
    comparisonData = await getComparisonData(search);

    if (comparisonData) {
      initialEntities = extractEntitiesFromComparison(
        comparisonData,
        currentMode,
      );
    } else {
      initialEntities = await getEntitiesByIds(search.ids, currentMode);
    }
  }
  // CASO 2: Solo 1 ID (vista previa)
  else if (search.ids.length === 1) {
    initialEntities = await getEntitiesByIds(search.ids, currentMode);
  }
  // CASO 3: Sin IDs (página vacía)
  else {
    initialEntities = [];
  }

  // 🔥 VALIDACIÓN FINAL: Filtrar entidades sin métricas
  if (search.has_metrics_only) {
    const beforeCount = initialEntities.length;
    initialEntities = initialEntities.filter((e) => e.has_metrics);
    const afterCount = initialEntities.length;

    if (beforeCount > afterCount) {
      console.warn(
        `⚠️ Filtered out ${beforeCount - afterCount} entities without metrics`,
      );
    }
  }

  // ============================================
  // SERVER ACTION PARA BÚSQUEDA
  // ============================================

  async function performSearch(query: string): Promise<SearchableEntity[]> {
    "use server";

    try {
      let extras: SearchExtras;

      // Construir extras según el modo
      if (currentMode === "legislator") {
        const legislatorExtras: LegislatorSearchExtras = {
          has_metrics_only: false,
        };

        if (search.chamber) {
          legislatorExtras.chamber = search.chamber;
        }
        if (search.parties) {
          legislatorExtras.parties = search.parties;
        }
        if (search.districts) {
          legislatorExtras.districts = search.districts;
        }
        // if (search.active_only !== undefined) {
        //   legislatorExtras.active_only = search.active_only;
        // }

        extras = legislatorExtras;
      } else if (isCandidateMode(currentMode)) {
        // if (!search.process_id) {
        //   console.error("❌ process_id required for candidate search");
        //   return [];
        // }

        const candidateExtras: CandidateSearchExtras = {
          has_metrics_only: false,
          // process_id: search.process_id,
          candidacy_type: search.candidacy_type,
          parties: search.parties || [], // ✅ Desde URL
          districts: search.districts || [], // ✅ Desde URL
        };

        if (search.candidacy_type) {
          candidateExtras.candidacy_type = search.candidacy_type;
        }
        if (search.parties) {
          candidateExtras.parties = search.parties;
        }
        if (search.districts) {
          candidateExtras.districts = search.districts;
        }

        extras = candidateExtras;
      } else {
        console.error("❌ Invalid mode:", currentMode);
        return [];
      }

      const results = await searchEntities(query, currentMode, extras);
      return results;
    } catch (error) {
      console.error("💥 Server search error:", error);
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
      selectedIds={search.ids}
    >
      <ComparatorLayout data={comparisonData} searchAction={performSearch} />
    </ComparatorProvider>
  );
}
