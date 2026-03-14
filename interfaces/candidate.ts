import {
  ElectoralDistrictBase,
  ElectoralDistrictBasic,
} from "./electoral-district";
import { PersonBasicInfo, PersonWithBackground } from "./person";
import { PoliticalPartyBase } from "./political-party";
import { CandidacyStatus, CandidacyType, ElectoralProcess } from "./politics";

export interface AllianceBase {
  id?: string | number;
  name: string;
  acronym?: string | null;
  color_hex: string | null;
  logo_url?: string | null;
}

export interface CandidateBase {
  id: string;
  active: boolean;
  electoral_process_id: string;
  political_party_id: string;
  electoral_district_id: string;
  type: CandidacyType;
  list_number: number | null;
  status: CandidacyStatus;
}

export interface AdminCandidate {
  id: string;
  person_id: string;
  fullname: string;
  electoral_process_id: string;
  type: CandidacyType;
  political_party_id: string;
  electoral_district_id: string | null;
  status: CandidacyStatus;
  list_number: number | null;
  active: boolean;
  created_at: string;

  // Relaciones populadas
  person: PersonBasicInfo | null;
  political_party: PoliticalPartyBase | null;
  electoral_district: ElectoralDistrictBase | null;
  electoral_process: ElectoralProcess | null;
}

export interface CandidateToPerson extends CandidateBase {
  political_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrictBase | null;
  electoral_process: ElectoralProcess;
}
export interface CandidateBasicInfo {
  id: string;
  person: PersonBasicInfo;
  political_party: PoliticalPartyBase | null;
  alliance: AllianceBase | null;
  electoral_district: ElectoralDistrictBase | null;
  electoral_process_id: string | number;
}

export interface CandidateCard extends CandidateBase {
  person: PersonBasicInfo;
  political_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrictBasic | null;
  has_metrics: boolean;
}

export interface CandidatePresidentials {
  id: string;
  person: PersonBasicInfo;
  type: CandidacyType;
}

export interface CandidateDetail extends CandidateBase {
  person: PersonWithBackground;
  political_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrictBasic | null;
}

export interface CreateCandidatePeriodRequest extends CandidateBase {
  person_id: string;
}

export interface UpdateCandidatePeriodRequest extends Partial<CandidateBase> {
  person_id: string;
  id: string;
}
