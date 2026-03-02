import { PoliticalPartyBase } from "./politics";

export type EntityType = "president-candidate";

export interface EntityMetadata {
  party_id?: string;
  process_id?: string;
}

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
