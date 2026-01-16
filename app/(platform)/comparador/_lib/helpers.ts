import { ChamberType, CandidacyType } from "@/interfaces/politics"; // 🔥 Importa los tipos base
import { EntityType, SearchableEntity } from "@/interfaces/ui-types";
import { extractCandidacyType } from "./validation";
import {
  CandidateCompareItem,
  CandidateWithMetrics,
  ComparisonResponse,
  LegislatorCompareItem,
  LegislatorWithMetrics,
} from "@/interfaces/comparator";
import { LegislatorCard } from "@/interfaces/legislator";
import { CandidateCard } from "@/interfaces/candidate";

// ============================================
// ADAPTERS PARA BÚSQUEDA (objetos simples)
// ============================================

export function adaptLegislatorFromSearch(
  leg: LegislatorCard,
): SearchableEntity {
  return {
    id: leg.id,
    fullname: leg.person.fullname,
    image_url: leg.person.image_url,
    group_name: leg.current_parliamentary_group?.name || "Sin Bancada",
    group_color: leg.current_parliamentary_group?.color_hex || null,
    description: `${leg.chamber} • ${leg.electoral_district?.name || "Sin distrito"}`,
    type: "legislator",
    has_metrics: leg.has_metrics ?? false, // 🔥 Viene directo del endpoint
    metadata: {
      chamber: leg.chamber,
      district: leg.electoral_district?.name,
      is_active: leg.active,
    },
  };
}

export function adaptCandidateFromSearch(
  cand: CandidateCard,
  type: EntityType,
): SearchableEntity {
  const candidacyType = extractCandidacyType(type);

  const candidacyLabel: Record<CandidacyType, string> = {
    [CandidacyType.SENADOR]: "Senador",
    [CandidacyType.DIPUTADO]: "Diputado",
    [CandidacyType.PRESIDENTE]: "Presidente",
    [CandidacyType.VICEPRESIDENTE]: "Vicepresidente",
    [CandidacyType.CONGRESISTA]: "Congresista",
  };

  const label = candidacyType ? candidacyLabel[candidacyType] : "Candidato";

  return {
    id: cand.id,
    fullname: cand.person.fullname,
    image_url: cand.person.image_url,
    group_name: cand.political_party?.name || "Independiente",
    group_color: cand.political_party?.color_hex || null,
    group_image: cand.political_party?.logo_url,
    description: `Candidato a ${label} • ${cand.electoral_district?.name || "Nacional"}`,
    type: type,
    has_metrics: cand.has_metrics ?? false, // 🔥 Viene directo del endpoint
    metadata: {
      process_id: cand.electoral_process_id,
      candidacy_type: candidacyType || undefined,
      district: cand.electoral_district?.name,
      party_id: cand.political_party_id ?? undefined,
    },
  };
}

// ============================================
// ADAPTERS PARA COMPARACIÓN (objetos con métricas)
// ============================================

export function adaptLegislatorFromComparison(
  item: LegislatorWithMetrics,
): SearchableEntity {
  const leg = item.legislator;

  return {
    id: leg.id,
    fullname: leg.person.fullname,
    image_url: leg.person.image_url,
    group_name: leg.current_parliamentary_group?.name || "Sin Bancada",
    group_color: leg.current_parliamentary_group?.color_hex || null,
    description: `${leg.chamber} • ${leg.electoral_district?.name || "Sin distrito"}`,
    type: "legislator",
    has_metrics: true, // 🔥 Si está en comparación, siempre tiene métricas
    metadata: {
      chamber: leg.chamber as ChamberType,
      district: leg.electoral_district?.name,
      is_active: leg.active,
    },
  };
}

export function adaptCandidateFromComparison(
  item: CandidateWithMetrics,
  type: EntityType,
): SearchableEntity {
  const cand = item.candidate;
  const candidacyType = extractCandidacyType(type);

  const candidacyLabel: Record<CandidacyType, string> = {
    [CandidacyType.SENADOR]: "Senador",
    [CandidacyType.DIPUTADO]: "Diputado",
    [CandidacyType.PRESIDENTE]: "Presidente",
    [CandidacyType.VICEPRESIDENTE]: "Vicepresidente",
    [CandidacyType.CONGRESISTA]: "Congresista",
  };

  const label = candidacyType ? candidacyLabel[candidacyType] : "Candidato";

  return {
    id: cand.id,
    fullname: cand.person.fullname,
    image_url: cand.person.image_url,
    group_name:
      cand.political_party?.name || cand.alliance?.name || "Independiente",
    group_color:
      cand.political_party?.color_hex || cand.alliance?.color_hex || null,
    group_image: cand.political_party?.logo_url || cand.alliance?.logo_url,
    description: `Candidato a ${label} • ${cand.electoral_district?.name || "Nacional"}`,
    type: type,
    has_metrics: true, // 🔥 Si está en comparación, siempre tiene métricas
    metadata: {
      process_id: String(cand.electoral_process_id),
      candidacy_type: candidacyType || undefined,
      district: cand.electoral_district?.name,
      party_id: cand.political_party?.id
        ? String(cand.political_party.id)
        : undefined,
    },
  };
}

// ============================================
// EXTRACTOR ACTUALIZADO (usa adapters correctos)
// ============================================

export function extractEntitiesFromComparison(
  data: ComparisonResponse,
  mode: EntityType,
): SearchableEntity[] {
  if (!data || !data.items || !Array.isArray(data.items)) {
    return [];
  }

  // Procesar legisladores
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
      .map((item) => adaptLegislatorFromComparison(item.data)); // 🔥 Adapter específico
  }

  // Procesar candidatos
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
      .map((item) => adaptCandidateFromComparison(item.data, mode)); // 🔥 Adapter específico
  }

  return [];
}
