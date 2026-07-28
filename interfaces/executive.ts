import { ExecutiveRole, LegislativePeriod } from "./politics";
import { PersonBasicInfo } from "./person";

export interface AdminExecutive {
  id: string;
  person_id: string;
  fullname: string;
  role: ExecutiveRole;
  ministry: string | null;
  start_date: string;
  end_date: string | null;
  end_reason: string | null;
  active: boolean;
  created_at: string;
  person: PersonBasicInfo | null;
  legislative_period: Pick<LegislativePeriod, "id" | "name"> | null;
}

export interface CreateExecutiveRequest {
  person_id: string;
  role: ExecutiveRole;
  ministry?: string | null;
  start_date: string;
  end_date?: string | null;
  end_reason?: string | null;
  legislative_period_id?: string | null;
}

export interface UpdateExecutiveRequest
  extends Partial<CreateExecutiveRequest> {
  id: string;
}
