"use server";

import { EntityType, SearchableEntity } from "@/interfaces/ui-types";
import { isCandidateMode, extractCandidacyType } from "./validation";
import { adaptLegislatorFromSearch, adaptCandidateFromSearch } from "./helpers";
import { ChamberType, ElectoralProcess } from "@/interfaces/politics";
import { getLegisladoresCards } from "@/queries/public/legislators";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import { getCandidatesCards } from "@/queries/public/candidacies";

interface SearchExtras {
  chamber?: ChamberType;
  candidacy_type?: string;
  parties?: string[];
  districts?: string[];
  has_metrics_only?: boolean;
}

export async function searchEntities(
  query: string,
  mode: EntityType,
  extras?: SearchExtras,
): Promise<SearchableEntity[]> {
  if (!query || query.trim().length < 2) return [];
  const searchTerm = query.trim();

  try {
    if (mode === "legislator") {
      const response = await getLegisladoresCards({
        search: searchTerm,
        chamber: extras?.chamber,
        districts: extras?.districts || [],
        limit: 30,
      });

      if (!Array.isArray(response)) return [];
      const adapted = response.map(adaptLegislatorFromSearch);
      return extras?.has_metrics_only
        ? adapted.filter((e) => e.has_metrics)
        : adapted;
    }

    if (isCandidateMode(mode)) {
      const procesos = (await getElectoralProcess(true)) as ElectoralProcess[];
      const procesoId = procesos[0]?.id;

      const typeToSearch = extras?.candidacy_type || extractCandidacyType(mode);

      const response = await getCandidatesCards({
        search: searchTerm,
        electoral_process_id: procesoId,
        type: typeToSearch || undefined,
        parties: extras?.parties,
        districts: extras?.districts,
        limit: 30,
      });

      if (!Array.isArray(response)) return [];
      const adapted = response.map((c) => adaptCandidateFromSearch(c, mode));
      return extras?.has_metrics_only
        ? adapted.filter((e) => e.has_metrics)
        : adapted;
    }

    return [];
  } catch (error) {
    console.error(`Error searching ${mode}:`, error);
    return [];
  }
}
