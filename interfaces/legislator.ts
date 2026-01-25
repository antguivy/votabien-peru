import { Attendance } from "./attendance";
import { BillBasic } from "./bill";
import {
  ParliamentaryGroupBasic,
  ParliamentaryMembershipWithGroup,
} from "./parliamentary-membership";
import { PersonBasicInfo } from "./person";
import {
  ChamberType,
  ElectoralDistrictBase,
  ElectoralDistrictBasic,
  LegislatorCondition,
  PoliticalPartyBase,
} from "./politics";

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
}

export interface LegislatorInSeat {
  id: string;
  person_id: string;
  chamber: ChamberType;
  condition: LegislatorCondition;
  active: boolean;
  elected_by_party: PoliticalPartyBase;
  current_parliamentary_group: ParliamentaryGroupBasic | null;
}

export interface LegislatorCard {
  id: string;
  chamber: ChamberType;
  condition: LegislatorCondition;
  current_parliamentary_group: ParliamentaryGroupBasic | null;
  active: boolean;
  start_date: string;
  end_date: string;
  person: PersonBasicInfo;
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
  start_date: string;
  end_date: string | null;
  active: boolean;
  institutional_email?: string;
  parliamentary_group?: string;
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
