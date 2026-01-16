import { AdminLegislator } from "@/interfaces/legislator";
import { PersonBase } from "@/interfaces/person";
import {
  ChamberType,
  ElectoralDistrictBase,
  LegislatorCondition,
  PoliticalPartyBase,
} from "@/interfaces/politics";

// Legislator
export interface LegislatorResponse {
  id: string;
  person: PersonBase;
  chamber: ChamberType;
  condition: LegislatorCondition;
  electoral_district: ElectoralDistrictBase;
  current_party: PoliticalPartyBase | null;
  original_party: PoliticalPartyBase;
  start_date: string;
  end_date: string;
  active: boolean;
  parliamentary_group: string | null;
  institutional_email: string | null;
  created_at: string;
}

// Paginated Response
export interface PaginatedLegislatorsResponse {
  data: AdminLegislator[];
  total: number;
  page: number;
  page_size: number;
}

// Chamber Counts
export interface ChamberCounts {
  [key: string]: number;
}

export interface ConditionCounts {
  [key: string]: number;
}

// District Counts
export interface DistrictCount {
  name: string;
  count: number;
}

export interface DistrictCounts {
  [districtId: string]: DistrictCount;
}

export interface BulkUpdateLegislatorsRequest {
  ids: string[];
  active: boolean;
}

export interface BulkUpdateLegislatorsResponse {
  count: number;
  message: string;
}
