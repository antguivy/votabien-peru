import { SearchableEntity } from "@/interfaces/ui-types";
import { FormulaCompareItem } from "@/interfaces/comparator";
import { CandidateCard } from "@/interfaces/candidate";

export function adaptCandidateFromSearch(
  cand: CandidateCard,
): SearchableEntity {
  return {
    id: cand.id, // candidate.id — usado en URL, no PII
    dni: cand.person.dni, // guardado internamente pero NO en URL
    fullname: cand.person.fullname,
    image_url: cand.person.image_url,
    image_candidate_url: cand.person.image_candidate_url,
    group_name: cand.political_party?.name || "Independiente",
    group_color: cand.political_party?.color_hex || null,
    group_image: cand.political_party?.logo_url,
    description: "Candidato a Presidente",
    type: "president-candidate",
    has_metrics: true,
    metadata: {
      party_id: cand.political_party_id ?? undefined,
      process_id: cand.electoral_process_id,
    },
  };
}

export function extractEntitiesFromComparison(
  data: NonNullable<import("@/interfaces/comparator").ComparisonResponse>,
): SearchableEntity[] {
  return data.items
    .filter(
      (item): item is FormulaCompareItem & { status: "available" } =>
        item.status === "available" && item.data !== null,
    )
    .map((item) => ({
      id: item.president_id,
      dni: item.data!.president.person.dni,
      fullname: item.president_name ?? "",
      image_url: item.data!.president.person.image_url,
      image_candidate_url: item.data!.president.person.image_candidate_url,
      group_name: item.data!.political_party?.name || "Independiente",
      group_color: item.data!.political_party?.color_hex || null,
      group_image: item.data!.political_party?.logo_url,
      description: "Candidato a Presidente",
      type: "president-candidate" as const,
      has_metrics: true,
      metadata: {
        party_id: item.data!.political_party?.id,
      },
    }));
}
