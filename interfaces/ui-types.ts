// interfaces/ui-types.ts

import { CandidacyType, ChamberType } from "./politics";

/** Tipos permitidos para cualquier entidad buscable o comparable */
export type EntityType = "legislator" | "candidate";

export type CandidateConfigKeys =
  | Exclude<CandidacyType, "VICEPRESIDENTE_1" | "VICEPRESIDENTE_2">
  | "VICEPRESIDENTE";

/** Información contextual opcional */
export interface EntityMetadata {
  chamber?: ChamberType;
  district?: string;
  process_id?: string;
  candidacy_type?: CandidacyType;
  party_id?: string;
  is_active?: boolean;
}

/** Entidad genérica que aparece en los resultados del buscador */
export interface SearchableEntity {
  id: string;
  fullname: string;
  image_url: string | null;
  image_candidate_url: string | null;
  dni: string | null;
  group_name: string;
  group_color: string | null;
  group_image?: string | null;

  description: string;
  type: EntityType;
  has_metrics: boolean;

  metadata?: EntityMetadata;
}
