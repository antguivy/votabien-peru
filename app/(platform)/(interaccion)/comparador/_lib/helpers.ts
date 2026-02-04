import { ChamberType, CandidacyType } from "@/interfaces/politics";
import { EntityType, SearchableEntity } from "@/interfaces/ui-types";
import {
  CandidateCompareItem,
  CandidateWithMetrics,
  ComparisonResponse,
  LegislatorCompareItem,
  LegislatorWithMetrics,
} from "@/interfaces/comparator";
import { LegislatorCard } from "@/interfaces/legislator";
import { CandidateCard } from "@/interfaces/candidate";

export function adaptLegislatorFromSearch(
  leg: LegislatorCard,
): SearchableEntity {
  return {
    id: leg.id,
    dni: leg.person.dni,
    fullname: leg.person.fullname,
    image_url: leg.person.image_url,
    image_candidate_url: leg.person.image_candidate_url,
    group_name: leg.current_parliamentary_group?.name || "Sin Bancada",
    group_color: leg.current_parliamentary_group?.color_hex || null,
    description: `${leg.chamber} • ${leg.electoral_district?.name || "Sin distrito"}`,
    type: "legislator",
    has_metrics: leg.has_metrics ?? false,
    metadata: {
      chamber: leg.chamber,
      district: leg.electoral_district?.name,
      is_active: leg.active,
    },
  };
}

export function adaptCandidateFromSearch(
  cand: CandidateCard,
  mode: EntityType,
): SearchableEntity {
  const candidacyLabel: Record<string, string> = {
    [CandidacyType.SENADOR]: "Senador",
    [CandidacyType.DIPUTADO]: "Diputado",
    [CandidacyType.PRESIDENTE]: "Presidente",
    [CandidacyType.VICEPRESIDENTE_1]: "1er Vicepresidente",
    [CandidacyType.VICEPRESIDENTE_2]: "2do Vicepresidente",
  };

  const label = candidacyLabel[cand.type] || "Candidato";

  return {
    id: cand.id,
    dni: cand.person.dni,
    fullname: cand.person.fullname,
    image_url: cand.person.image_url,
    image_candidate_url: cand.person.image_candidate_url,
    group_name: cand.political_party?.name || "Independiente",
    group_color: cand.political_party?.color_hex || null,
    group_image: cand.political_party?.logo_url,
    description: `Candidato a ${label} • ${cand.electoral_district?.name || "Nacional"}`,
    type: "candidate",
    has_metrics: cand.has_metrics ?? false,
    metadata: {
      process_id: cand.electoral_process_id,
      candidacy_type: cand.type,
      district: cand.electoral_district?.name,
      party_id: cand.political_party_id ?? undefined,
    },
  };
}

export function adaptLegislatorFromComparison(
  item: LegislatorWithMetrics,
): SearchableEntity {
  const leg = item.legislator;

  return {
    id: leg.id,
    dni: leg.person.dni,
    fullname: leg.person.fullname,
    image_url: leg.person.image_url,
    image_candidate_url: leg.person.image_candidate_url,
    group_name: leg.current_parliamentary_group?.name || "Sin Bancada",
    group_color: leg.current_parliamentary_group?.color_hex || null,
    description: `${leg.chamber} • ${leg.electoral_district?.name || "Sin distrito"}`,
    type: "legislator",
    has_metrics: true,
    metadata: {
      chamber: leg.chamber as ChamberType,
      district: leg.electoral_district?.name,
      is_active: leg.active,
    },
  };
}

export function adaptCandidateFromComparison(
  item: CandidateWithMetrics,
): SearchableEntity {
  const cand = item.candidate;

  const label = "Candidato";

  return {
    id: cand.id,
    dni: cand.person.dni, // 🔥 CRÍTICO
    fullname: cand.person.fullname,
    image_url: cand.person.image_url,
    image_candidate_url: cand.person.image_candidate_url,
    group_name: cand.political_party?.name || "Independiente",
    group_color: cand.political_party?.id ? null : null,
    group_image: cand.political_party?.logo_url,
    description: `${label} • ${cand.electoral_district?.name || "Nacional"}`,
    type: "candidate",
    has_metrics: true,
    metadata: {
      district: cand.electoral_district?.name,
      party_id: cand.political_party?.id,
    },
  };
}

export function extractEntitiesFromComparison(
  data: ComparisonResponse,
  mode: EntityType,
): SearchableEntity[] {
  if (!data || !data.items || !Array.isArray(data.items)) {
    return [];
  }

  if (mode === "legislator") {
    return data.items
      .filter(
        (
          item,
        ): item is LegislatorCompareItem & {
          status: "available";
          data: LegislatorWithMetrics;
        } => item.status === "available" && item.data !== null,
      )
      .map((item) => adaptLegislatorFromComparison(item.data));
  }

  if (mode.includes("candidate")) {
    return data.items
      .filter(
        (
          item,
        ): item is CandidateCompareItem & {
          status: "available";
          data: CandidateWithMetrics;
        } => item.status === "available" && item.data !== null,
      )
      .map((item) => adaptCandidateFromComparison(item.data));
  }

  return [];
}
