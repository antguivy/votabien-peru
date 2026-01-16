// comparador/_lib/validation.ts
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsBoolean,
} from "nuqs/server";
import { EntityType } from "@/interfaces/ui-types";
import { CandidacyType, ChamberType } from "@/interfaces/politics";

const parseAsEntityType = parseAsString.withDefault("legislator");

export const searchParamsCache = createSearchParamsCache({
  mode: parseAsEntityType,
  ids: parseAsArrayOf(parseAsString).withDefault([]),
  q: parseAsString.withDefault(""),
  chamber: parseAsString.withDefault(""),
  districts: parseAsArrayOf(parseAsString).withDefault([]),
  parliamentary_group: parseAsString.withDefault(""),
  // active_only: parseAsBoolean.withDefault(true),
  // process_id: parseAsString.withDefault(""),
  candidacy_type: parseAsString.withDefault(""),
  parties: parseAsArrayOf(parseAsString).withDefault([]),
  has_metrics_only: parseAsBoolean.withDefault(true),
});

// 🔥 SIMPLIFICADO: Tipo básico sin Promise
export type ComparatorParamsSchema = {
  mode: EntityType;
  ids: string[];
  q: string;
  chamber: ChamberType;
  districts: string[];
  parties: string[];
  parliamentary_group: string;
  // active_only: boolean;
  // process_id: string;
  candidacy_type: string;
  has_metrics_only: boolean;
};

export function isCandidateMode(mode: string | EntityType): boolean {
  return mode.includes("candidate");
}

export function extractCandidacyType(
  mode: string | EntityType,
): CandidacyType | null {
  if (mode === "senator-candidate") return CandidacyType.SENADOR;
  if (mode === "deputy-candidate") return CandidacyType.DIPUTADO;
  if (mode === "president-candidate") return CandidacyType.PRESIDENTE;
  if (mode === "vicepresident-candidate") return CandidacyType.VICEPRESIDENTE;
  return null;
}
