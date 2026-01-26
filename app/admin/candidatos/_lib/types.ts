import { AdminCandidate } from "@/interfaces/candidate";
import { PersonBase } from "@/interfaces/person";
import {
  CandidacyStatus,
  CandidacyType,
  ElectoralDistrictBase,
  ElectoralProcess,
  PoliticalPartyBase,
} from "@/interfaces/politics";

// Legislator
export interface CandidateResponse {
  id: string;
  person: PersonBase;
  type: CandidacyType;
  status: CandidacyStatus;
  list_number: number | null;
  active: boolean;
  electoral_district: ElectoralDistrictBase;
  political_party: PoliticalPartyBase;
  electoral_process: ElectoralProcess;
  created_at: string;
}

// Paginated Response
export interface PaginatedCandidatesResponse {
  data: AdminCandidate[];
  total: number;
  page: number;
  page_size: number;
}

// Type Counts
export interface TypeCounts {
  [key: string]: number;
}

export interface StatusCounts {
  [key: string]: number;
}

// District Counts
export interface PartyCount {
  name: string;
  count: number;
}

export interface PartyCounts {
  [partyId: string]: PartyCount;
}

export interface BulkUpdateCandidatesRequest {
  ids: string[];
  active: boolean;
}

export interface BulkUpdateCandidatesResponse {
  count: number;
  message: string;
}
