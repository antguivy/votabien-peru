import { GroupChangeReason } from "./politics";

export interface ParliamentaryGroupBasic {
  id: string;
  name: string;
  acronym: string | null;
  color_hex: string | null;
  logo_url: string | null;
}

export interface ParliamentaryMembershipBase {
  parliamentary_group_id: string;
  start_date: string;
  end_date: string | null;
  change_reason: GroupChangeReason;
  source_url: string | null;
}

export interface ParliamentaryMembershipBasic
  extends ParliamentaryMembershipBase {
  id: string;
}

export interface ParliamentaryMembershipWithGroup
  extends ParliamentaryMembershipBasic {
  parliamentary_group?: ParliamentaryGroupBasic;
}

export type CreateParliamentaryMembership = ParliamentaryMembershipBase;

export interface UpdateParliamentaryMembership
  extends ParliamentaryMembershipBase {
  id: string;
}

export interface CreateParliamentaryMembershipResult {
  created: ParliamentaryMembershipWithGroup;
  updated?: ParliamentaryMembershipWithGroup | null;
}
