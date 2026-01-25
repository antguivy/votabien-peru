import { AdminPoliticalParty } from "@/interfaces/party";
import { FinancingReport } from "@/interfaces/party-financing";
import {
  GovernmentPlanSummary,
  OrganizationType,
  PartyHistory,
  PartyLegalCase,
} from "@/interfaces/politics";

// Legislator
export interface PartyResponse {
  id: string;
  name: string;
  acronym: string | null;
  logo_url: string | null;
  color_hex: string | null;
  active: boolean;
  foundation_date: string | null;
  founder: string | null;
  ideology: string | null;
  main_office: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  total_afiliates: number | null;
  party_president: string | null;
  purpose: string | null;
  slogan: string | null;
  government_plan_url: string | null;
  government_audio_url: string | null;
  government_plan_summary: GovernmentPlanSummary[];
  party_timeline: PartyHistory[];
  legal_cases: PartyLegalCase[];
  financing_reports: FinancingReport[];
  type: OrganizationType;
  created_at: string;
}

// Paginated Response
export interface PaginatedPartiesResponse {
  data: AdminPoliticalParty[];
  total: number;
  page: number;
  page_size: number;
}

// active Counts
export interface ActivePartiesCounts {
  [key: string]: number;
}

export interface BulkUpdatePartiesRequest {
  ids: string[];
  active: boolean;
}

export interface BulkUpdatePartiesResponse {
  count: number;
  message: string;
}
