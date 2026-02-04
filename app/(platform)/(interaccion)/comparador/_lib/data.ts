"use server";

import { EntityType, SearchableEntity } from "@/interfaces/ui-types";
import {
  ComparatorParamsSchema,
  isCandidateMode,
  extractCandidacyType,
} from "./validation";
import { adaptLegislatorFromSearch, adaptCandidateFromSearch } from "./helpers";
import { ComparisonResponse } from "@/interfaces/comparator";
import { getLegisladoresCards } from "@/queries/public/legislators";
import {
  getCandidatesComparison,
  getLegislatorsComparison,
} from "@/queries/public/compare";
import { getCandidatesCards } from "@/queries/public/candidacies";

export async function getEntitiesByIds(
  ids: string[],
  mode: EntityType,
): Promise<SearchableEntity[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  try {
    if (mode === "legislator") {
      const response = await getLegisladoresCards({
        ids: ids,
        limit: ids.length,
      });

      if (!Array.isArray(response)) {
        console.error("Invalid legislator response");
        return [];
      }

      return response.map(adaptLegislatorFromSearch);
    }

    if (isCandidateMode(mode)) {
      const candidacyType = extractCandidacyType(mode);

      const response = await getCandidatesCards({
        ids: ids,
        type: candidacyType || undefined,
        limit: ids.length,
      });

      if (!Array.isArray(response)) {
        console.error("Invalid candidate response");
        return [];
      }

      return response.map((cand) => adaptCandidateFromSearch(cand, mode));
    }

    console.warn(`Unsupported mode: ${mode}`);
    return [];
  } catch (error) {
    console.error(`Error in getEntitiesByIds (${mode}):`, error);
    return [];
  }
}

export async function getComparisonData(
  params: ComparatorParamsSchema,
): Promise<ComparisonResponse | null> {
  if (params.dnis.length < 2) {
    return null;
  }

  try {
    if (!isCandidateMode(params.mode)) {
      return await getLegislatorsComparison(params.dnis);
    }

    const result = await getCandidatesComparison(params.dnis);

    return result;
  } catch (error) {
    console.error(`Error fetching comparison:`, error);
    return null;
  }
}
