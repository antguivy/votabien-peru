import { Attendance } from "./attendance";
import { BackgroundBase } from "./background";
import { BillBasic } from "./bill";
import {
  ElectoralDistrictBase,
  ElectoralDistrictBasic,
} from "./electoral-district";
import {
  ParliamentaryGroupBasic,
  ParliamentaryMembershipWithGroup,
} from "./parliamentary-membership";
import { PersonBase, PersonBasicInfo, RnasSanction } from "./person";
import { PoliticalPartyBase } from "./political-party";
import { ChamberType, LegislatorCondition } from "./politics";

export interface LegislatorBasicInfo {
  id: string;
  chamber: ChamberType;
  condition: LegislatorCondition;
  active: boolean;
  person: PersonBasicInfo;
  electoral_district: ElectoralDistrictBasic;
  current_parliamentary_group: ParliamentaryGroupBasic | null;
}
export interface LegislatorBase {
  id: string;
  chamber: ChamberType;
  condition: LegislatorCondition;
  start_date: string;
  end_date: string | null;
  active: boolean;
  institutional_email: string | null;
}

export interface LegislatorDetail extends LegislatorBase {
  elected_by_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrictBase;
  bill_authorships: BillBasic[];
  attendances: Attendance[];
  parliamentary_memberships: ParliamentaryMembershipWithGroup[];
}

export interface LegislatorMetricsBasic {
  legislator_id: string;
  total_bills: number;
  bills_presentado: number;
  bills_en_comision: number;
  bills_aprobado: number;
  bills_rechazado: number;
  bills_retirado_por_autor: number;
  bills_en_proceso: number;
  approval_rate: number | null;
  total_sessions: number;
  sessions_present: number;
  sessions_absent: number;
  sessions_justified: number;
  sessions_license: number;
  attendance_rate: number | null;
  total_party_changes: number;
  days_in_current_group: number | null;
  is_defector: boolean;
  total_legal_records: number;
  penal_records: number;
  ethical_records: number;
  civil_records: number;
  administrative_records: number;
  total_motions: number;
  motions_greeting: number;
  motions_interpellation: number;
  motions_censure: number;
  total_information_requests: number;
  last_updated: string | Date;
}

export interface MotionBasic {
  id: string;
  number: string;
  chamber: ChamberType;
  period?: string | null;
  legislative_session?: string | null;
  submission_date: string | Date;
  motion_type: string;
  is_greeting: boolean;
  purpose?: string | null;
  procedural_status?: string | null;
  summary: string;
  observations?: string | null;
  document_url?: string | null;
}

export interface InformationRequestBasic {
  id: string;
  number: string;
  chamber: ChamberType;
  period?: string | null;
  document_code?: string | null;
  document_date?: string | Date | null;
  summary: string;
  target_entity: string;
  target_position?: string | null;
  target_person?: string | null;
  reception_date?: string | Date | null;
  due_date?: string | Date | null;
  document_url?: string | null;
}

export interface LegislatorDetailWithPerson extends LegislatorDetail {
  legislatormetrics?: LegislatorMetricsBasic | null;
  motions?: MotionBasic[];
  information_requests?: InformationRequestBasic[];
  person: PersonBase & {
    backgrounds: BackgroundBase[];
    facebook_url: string | null;
    twitter_url: string | null;
    instagram_url: string | null;
    tiktok_url: string | null;
  };
}

export interface LegislatorInSeat {
  id: string;
  person_id: string;
  chamber: ChamberType;
  condition: LegislatorCondition;
  active: boolean;
  elected_by_party: PoliticalPartyBase;
  current_parliamentary_group: ParliamentaryGroupBasic | null;
  person?: {
    name: string;
    lastname: string;
    image_url: string | null;
    image_candidate_url: string | null;
  };
}

export interface LegislatorCard {
  id: string;
  chamber: ChamberType;
  condition: LegislatorCondition;
  current_parliamentary_group: ParliamentaryGroupBasic | null;
  active: boolean;
  start_date: string;
  end_date: string;
  person: PersonBasicInfo & {
    has_sanction: boolean;
    has_penal_sentence: boolean;
    is_incumbent: boolean | null;
    rnas_sanctions: RnasSanction[] | null;
  };
  elected_by_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrictBase;
  has_metrics: boolean;
}

export interface AdminLegislator {
  id: string;
  person_id: string;
  fullname: string;
  elected_by_party_id: string;
  electoral_district_id: string;
  chamber: ChamberType;
  condition: LegislatorCondition;
  start_date: string;
  end_date: string | null;
  active: boolean;
  institutional_email?: string | null;
  current_parliamentary_group: ParliamentaryGroupBasic | null;
  parliamentary_memberships: ParliamentaryMembershipWithGroup[] | undefined;
  legislative_period?: { id: string; name: string } | null;
  created_at: string;
  // Relaciones populadas
  person: PersonBasicInfo | null;
  elected_by_party: PoliticalPartyBase | null;
  electoral_district: ElectoralDistrictBase | null;
}

export interface CreateLegislatorPeriodRequest {
  person_id: string;
  elected_by_party_id: string;
  electoral_district_id: string;
  chamber: ChamberType;
  condition: LegislatorCondition;
  start_date: string | Date;
  end_date?: string | Date | null;
  active: boolean;
  institutional_email?: string;
  parliamentary_group?: string;
  legislative_period_id?: string;
  image_url?: string | null;
}
export interface LegislatorTableRow {
  id: string;
  fullname: string;
  chamber: ChamberType;
  party: string;
  district: string;
  parliamentary_group?: string;
  active: boolean;
  start_date: string;
  end_date: string;
  person_id: string;
}

export interface UpdateLegislatorPeriodRequest
  extends Partial<CreateLegislatorPeriodRequest> {
  id: string;
}

export interface FiltersLegislators {
  active_only?: boolean;
  chamber?: ChamberType | string;
  groups?: string | string[];
  districts?: string | string[];
  search?: string;
  skip?: number;
  limit?: number;
  [key: string]: unknown;
}
