import { FinancingReport } from "./party-financing";
import {
  ElectedLegislatorBasic,
  GovernmentPlanSummary,
  OrganizationType,
  PartyHistory,
  PartyLegalCase,
  SeatsByDistrict,
} from "./politics";

export interface PoliticalPartyBase {
  id: string;
  name: string;
  acronym: string | null;
  logo_url: string | null;
  color_hex: string | null;
  active: boolean;
  foundation_date: string | null;
}

export interface PoliticalPartyDetail extends PoliticalPartyBase {
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
  seats_by_district: SeatsByDistrict[];
  financing_reports: FinancingReport[];
  type: OrganizationType;
  elected_legislators: ElectedLegislatorBasic[];
  composition: {
    party: {
      id: string | null;
      name: string;
      logo_url: string | null;
      active: boolean;
    };
  }[];
  parent_alliance: {
    government_plan_summary: GovernmentPlanSummary[];
    government_plan_url: string | null;
    government_audio_url: string | null;
    name: string;
    id: string;
  } | null;
}

export interface PoliticalPartyListPaginated {
  items: PoliticalPartyBase[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminPoliticalParty {
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

export interface CreatePartyRequest {
  name: string;
  acronym: string | null;
  type: OrganizationType;
  active: boolean;

  // Identidad visual
  color_hex: string | null;
  logo_url: string | null;
  slogan: string | null;

  // Datos fundacionales
  founder: string | null;
  foundation_date: string | null;
  ideology: string | null;
  party_president: string | null;
  purpose: string | null;

  // Contacto
  main_office: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;

  // Redes sociales
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;

  // Datos numéricos
  total_afiliates: number | null;

  // Archivos
  government_plan_url: string | null;
  government_audio_url: string | null;

  // Campos JSON
  government_plan_summary: GovernmentPlanSummary[];
  party_timeline: PartyHistory[];
  legal_cases: PartyLegalCase[];

  // Reportes de financiamiento (sin transactions anidadas, se crean después)
  financing_reports: FinancingReport[];
}

// Request para actualizar partido (requiere id)
export interface UpdatePartyRequest {
  id: string;
  name: string;
  acronym: string | null;
  type: OrganizationType;
  active: boolean;

  // Identidad visual
  color_hex: string | null;
  logo_url: string | null;
  slogan: string | null;

  // Datos fundacionales
  founder: string | null;
  foundation_date: string | null;
  ideology: string | null;
  party_president: string | null;
  purpose: string | null;

  // Contacto
  main_office: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;

  // Redes sociales
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;

  // Datos numéricos
  total_afiliates: number | null;

  // Archivos
  government_plan_url: string | null;
  government_audio_url: string | null;

  // Campos JSON
  government_plan_summary: GovernmentPlanSummary[];
  party_timeline: PartyHistory[];
  legal_cases: PartyLegalCase[];

  // Reportes de financiamiento
  financing_reports: FinancingReport[];
}
