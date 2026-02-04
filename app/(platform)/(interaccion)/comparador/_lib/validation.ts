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
  dnis: parseAsArrayOf(parseAsString).withDefault([]),
  q: parseAsString.withDefault(""),
  chamber: parseAsString.withDefault(""),
  districts: parseAsArrayOf(parseAsString).withDefault([]),
  parliamentary_group: parseAsString.withDefault(""),

  type: parseAsString.withDefault(""),

  parties: parseAsArrayOf(parseAsString).withDefault([]),
  has_metrics_only: parseAsBoolean.withDefault(true),

  candidacy_type: parseAsString.withDefault(""),
});

export type ComparatorParamsSchema = {
  mode: EntityType;
  dnis: string[];
  q: string;
  chamber: ChamberType;
  districts: string[];
  parties: string[];
  parliamentary_group: string;
  type: string;
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
  if (mode.includes("vicepresident")) return CandidacyType.VICEPRESIDENTE_1;
  return null;
}
