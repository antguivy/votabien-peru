// comparador/_lib/actions.ts
"use server";

import { EntityType, SearchableEntity } from "@/interfaces/ui-types";
import { publicApi } from "@/lib/public-api";
import { isCandidateMode, extractCandidacyType } from "./validation";
import { adaptLegislatorFromSearch, adaptCandidateFromSearch } from "./helpers";
import { ChamberType, ElectoralProcess } from "@/interfaces/politics";
import { getLegisladoresCards } from "@/queries/public/legislators";
import { getElectoralProcess } from "@/queries/public/electoral-process";

// ============================================
// BÚSQUEDA PRINCIPAL
// ============================================

interface SearchExtras {
  // Para legisladores
  chamber?: ChamberType;
  // active_only?: boolean;

  // Para candidatos
  // process_id?: string;
  candidacy_type?: string;
  parties?: string[];
  districts?: string[];

  // Filtro universal
  has_metrics_only?: boolean;
}

export async function searchEntities(
  query: string,
  mode: EntityType,
  extras?: SearchExtras,
): Promise<SearchableEntity[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim();
  const hasMetricsOnly = extras?.has_metrics_only ?? false;

  try {
    if (mode === "legislator") {
      const response = await getLegisladoresCards({
        search: searchTerm,
        chamber: extras?.chamber || undefined,
        districts: extras?.districts || [],
        // active_only: extras?.active_only ?? true,
        limit: 30,
      });

      if (!Array.isArray(response)) {
        return [];
      }

      const adapted = response.map(adaptLegislatorFromSearch); // 🔥 Adapter correcto

      return hasMetricsOnly
        ? adapted.filter((entity) => entity.has_metrics)
        : adapted;
    }

    if (isCandidateMode(mode)) {
      const candidacyType = extractCandidacyType(mode);

      // if (!extras?.process_id) {
      //   return [];
      // }
      const procesosActivos = (await getElectoralProcess(
        true,
      )) as ElectoralProcess[];
      const procesoActivo = procesosActivos[0];

      const response = await publicApi.getCandidaturas({
        search: searchTerm,
        electoral_process_id: procesoActivo.id,
        candidacy_type: candidacyType || undefined,
        party: extras?.parties || undefined,
        district: extras?.districts || undefined,
        limit: 30,
      });

      if (!Array.isArray(response)) {
        return [];
      }

      const adapted = response.map((cand) =>
        adaptCandidateFromSearch(cand, mode),
      ); // 🔥 Adapter correcto

      return hasMetricsOnly
        ? adapted.filter((entity) => entity.has_metrics)
        : adapted;
    }

    return [];
  } catch (error) {
    console.error(`💥 Error searching ${mode}:`, error);
    return [];
  }
}
