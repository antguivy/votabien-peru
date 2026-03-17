"use server";

import { SearchableEntity } from "@/interfaces/ui-types";
import { ComparatorParamsSchema } from "./validation";
import { adaptCandidateFromSearch } from "./helpers";
import { ComparisonResponse } from "@/interfaces/comparator";
import { getCandidatesCards } from "@/queries/public/candidacies";
import { getPresidentialFormulasComparison } from "@/queries/public/compare";
import { CandidacyType } from "@/interfaces/candidate";

export async function getEntitiesByIds(
  ids: string[],
): Promise<SearchableEntity[]> {
  if (!ids || ids.length === 0) return [];
  try {
    const response = await getCandidatesCards({
      ids,
      type: CandidacyType.PRESIDENTE,
      limit: ids.length,
    });
    if (!Array.isArray(response)) return [];
    return response.map(adaptCandidateFromSearch);
  } catch (error) {
    console.error("Error in getEntitiesByIds:", error);
    return [];
  }
}

export async function getComparisonData(
  params: ComparatorParamsSchema,
): Promise<ComparisonResponse> {
  if (params.ids.length < 2) return null;
  try {
    return await getPresidentialFormulasComparison(params.ids);
  } catch (error) {
    console.error("Error fetching formula comparison:", error);
    return null;
  }
}
