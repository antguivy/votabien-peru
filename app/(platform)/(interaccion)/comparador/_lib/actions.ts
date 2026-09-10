"use server";

import { SearchableEntity } from "@/interfaces/ui-types";
import { adaptCandidateFromSearch } from "./helpers";
import { ElectoralProcess } from "@/interfaces/politics";
import { getElectoralProcess } from "@/queries/public/electoral-process";
import { getCandidatesCards } from "@/queries/public/candidacies";
import { CandidacyType } from "@/interfaces/candidate";

interface SearchExtras {
  parties?: string[];
}

export async function searchPresidentialCandidates(
  query: string,
  extras?: SearchExtras,
): Promise<SearchableEntity[]> {
  try {
    // Buscamos el proceso de Elecciones Generales (incluso si está inactivo)
    const procesos = (await getElectoralProcess()) as ElectoralProcess[];
    const procesoGenerales =
      procesos.find((p) => p.name.toLowerCase().includes("generales")) ??
      procesos.find((p) => p.id === "dclcgoqihesl49kyjgnjcf9a");
    const procesoId = procesoGenerales?.id ?? "dclcgoqihesl49kyjgnjcf9a";

    const response = await getCandidatesCards({
      search: query.trim() || undefined, // undefined = sin filtro de texto = todos
      electoral_process_id: procesoId,
      type: CandidacyType.PRESIDENTE,
      parties: extras?.parties,
      active: false,
      limit: 60,
      pageSize: 60,
    });

    if (!Array.isArray(response)) return [];
    return response.map(adaptCandidateFromSearch);
  } catch (error) {
    console.error("Error searching presidential candidates:", error);
    return [];
  }
}
