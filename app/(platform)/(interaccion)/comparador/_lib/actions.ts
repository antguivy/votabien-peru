"use server";

import { SearchableEntity } from "@/interfaces/ui-types";
import { adaptCandidateFromSearch } from "./helpers";
import { CandidacyType, ElectoralProcess } from "@/interfaces/politics";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import { getCandidatesCards } from "@/queries/public/candidacies";

interface SearchExtras {
  parties?: string[];
}

export async function searchPresidentialCandidates(
  query: string,
  extras?: SearchExtras,
): Promise<SearchableEntity[]> {
  try {
    const procesos = (await getElectoralProcess(true)) as ElectoralProcess[];
    const procesoId = procesos[0]?.id;

    const response = await getCandidatesCards({
      search: query.trim() || undefined, // undefined = sin filtro de texto = todos
      electoral_process_id: procesoId,
      type: CandidacyType.PRESIDENTE,
      parties: extras?.parties,
      limit: 60,
      pageSize: 40,
    });

    if (!Array.isArray(response)) return [];
    return response.map(adaptCandidateFromSearch);
  } catch (error) {
    console.error("Error searching presidential candidates:", error);
    return [];
  }
}
