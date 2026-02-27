import { ComparisonDataStatus } from "./comparator";
import { PersonBase, PersonBasicInfo } from "./person";
import {
  CandidacyStatus,
  CandidacyType,
  ElectoralDistrictBase,
  ElectoralDistrictBasic,
  ElectoralProcess,
  PoliticalPartyBase,
} from "./politics";

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

// export interface CandidateMetrics {
//   [key: string]: number | boolean | string | null | undefined;
//   candidate_id: string;

//   // Formación académica
//   max_academic_level_score: number;
//   has_postgraduate: boolean;

//   // Experiencia política
//   political_experience_years: number;
//   times_elected: number;
//   total_parties_belonged: number;

//   // Transparencia patrimonial
//   declared_income_annual: number;
//   declared_assets_value: number;

//   // Antecedentes legales
//   has_penal_sentences: boolean;
//   has_alimentary_debts: boolean;
//   total_legal_records: number;

//   last_updated: string;
// }

// export interface CandidateWithMetrics {
//   candidate: CandidateBasicInfo;
//   metrics: CandidateMetrics;
// }

// export interface CandidateCompareItem {
//   candidate_id: string;
//   candidate_name: string | null;
//   status: ComparisonDataStatus;
//   data: CandidateWithMetrics | null;
//   message: string | null;
// }

// export interface CandidateComparison {
//   total_requested: number;
//   total_available: number;
//   comparison_date: string;
//   items: CandidateCompareItem[];
// }

export interface CreateCandidatePeriodRequest extends CandidateBase {
  person_id: string;
}

export interface UpdateCandidatePeriodRequest extends Partial<CandidateBase> {
  person_id: string;
  id: string;
}
