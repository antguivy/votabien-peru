// interfaces/ui-types.ts

import { CandidacyType, ChamberType } from "./politics";

/** Tipos permitidos para cualquier entidad buscable o comparable */
export type EntityType = "legislator" | "candidate";

export type CandidateConfigKeys = CandidacyType;

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

  group_name: string;
  group_color: string | null;
  group_image?: string | null;

  description: string;
  type: EntityType;
  has_metrics: boolean;

  metadata?: EntityMetadata;
}

// /** Filtros para legisladores */
// export interface LegislatorFilters {
//   chamber?: "Congreso" | "Senado" | "Diputados";
//   district?: string;
//   parliamentary_group?: string;
//   active_only?: boolean;
// }

// /** Filtros para candidatos */
// export interface CandidateFilters {
//   process_id: string;
//   candidacy_type?: CandidacyType;
//   district?: string;
//   party?: string;
//   has_metrics_only?: boolean;
// }

// /** Resultado genérico de comparación */
// export interface ComparisonResult<M = unknown> {
//   mode: EntityType;
//   entities: SearchableEntity[];
//   metrics: Record<string, M>;
//   timestamp: string;
// }
