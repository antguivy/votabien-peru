// ============= ENUMS =============

import { LegislatorInSeat } from "./legislator";
import { FinancingReport } from "./party-financing";
import { PersonBasicInfo } from "./person";

export enum ChamberType {
  CONGRESO = "CONGRESO",
  SENADO = "SENADO",
  DIPUTADOS = "DIPUTADOS",
}

export enum CandidacyType {
  PRESIDENTE = "PRESIDENTE",
  VICEPRESIDENTE_1 = "VICEPRESIDENTE_1",
  VICEPRESIDENTE_2 = "VICEPRESIDENTE_2",
  SENADOR = "SENADOR",
  DIPUTADO = "DIPUTADO",
}

export const typeOptions = [
  { value: "PRESIDENTE", label: "Presidente" },
  { value: "VICEPRESIDENTE", label: "Vicepresidente" },
  { value: "SENADOR", label: "Senador" },
  { value: "DIPUTADO", label: "Diputado" },
];

export enum CandidacyStatus {
  SOLICITUD_INSCRIPCION = "SOLICITUD_INSCRIPCION", // Paso 1: Presentan la lista
  INSCRITO = "INSCRITO", // Paso 2: El JNE la acepta formalmente (Ya sale en la web oficial)
  TACHADO = "TACHADO", // Alguien se quejó y lo sacaron
  EXCLUIDO = "EXCLUIDO", // El JNE lo sacó por mentir en hoja de vida o dádivas
  IMPROCEDENTE = "IMPROCEDENTE", // No cumplió requisitos de forma
  RENUNCIA = "RENUNCIA", // El candidato se bajó
  APELACION = "APELACION", // Está peleando su exclusión
}
export enum LegislatorCondition {
  EN_EJERCICIO = "EN_EJERCICIO",
  FALLECIDO = "FALLECIDO",
  SUSPENDIDO = "SUSPENDIDO",
  LICENCIA = "LICENCIA",
  DESTITUIDO = "DESTITUIDO",
}

export enum ExecutiveRole {
  PRESIDENTE = "PRESIDENTE",
  VICEPRESIDENTE = "VICEPRESIDENTE",
  PRIMER_MINISTRO = "PRIMER_MINISTRO",
  MINISTRO = "MINISTRO",
}

export enum GroupChangeReason {
  INICIAL = "INICIAL",
  CAMBIO_VOLUNTARIO = "CAMBIO_VOLUNTARIO",
  EXPULSION = "EXPULSION",
  RENUNCIA = "RENUNCIA",
  DISOLUCION_BANCADA = "DISOLUCION_BANCADA",
  CAMBIO_ESTRATEGICO = "CAMBIO_ESTRATEGICO",
  SANCION_DISCIPLINARIA = "SANCION_DISCIPLINARIA",
  OTRO = "OTRO",
}

export enum OrganizationType {
  PARTIDO = "PARTIDO",
  ALIANZA = "ALIANZA",
}

export interface PartyLegalCase {
  case_type: string;
  date: string;
  description: string;
  status: string;
  source_name: string;
  source_url: string | null;
}

export interface GovernmentPlanSummary {
  title: string;
  summary: string;
  tags: string[];
  proposals: string[];
  goals: { indicator: string }[];
}

export interface PartyHistory {
  date: string;
  event: string;
  source: string | null;
  source_url: string | null;
}
// ============= INTERFACES BASE =============

export interface PoliticalPartyBase {
  id: string;
  name: string;
  acronym: string | null;
  logo_url: string | null;
  color_hex: string | null;
  active: boolean;
  foundation_date: string | null;
}

export interface ElectoralDistrictBasic {
  id: string;
  name: string;
  code?: string;
  is_national?: boolean;
  active?: boolean;
}

export interface ElectoralDistrictBase {
  id: string;
  name: string;
  code: string;
  is_national: boolean;
  active: boolean;
}

export interface ElectoralProcess {
  id: string;
  name: string;
  year: number;
  election_date: string;
  active: boolean;
}

// ============= PARTIDO ==========================
export interface SeatsByDistrict {
  district_code: string | null;
  district_name: string | null;
  elected_by_party_id: string | null;
  seats: number | null;
}
export interface ElectedLegislatorBasic {
  id: string;
  full_name: string;
  photo_url: string | null;
  district_name: string | null;
  condition: string | null;
  person_id: string;
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

// ============= EJECUTIVOS =============

export interface ExecutiveBase {
  id: string;
  role: ExecutiveRole;
  ministry: string | null;
  start_date: string;
}

export interface Executive extends ExecutiveBase {
  person: PersonBasicInfo;
}

// ============= ESCAÑOS =============

export interface SeatParliamentary {
  id: string;
  chamber: string;
  number_seat: number;
  row: number;
  legislator: LegislatorInSeat | null;
}

// ============= FILTROS Y OPCIONES =============

export interface FiltersPerson {
  is_legislator_active?: boolean;
  chamber?: ChamberType | string;
  groups?: string | string[];
  districts?: string | string[];
  search?: string;
  skip?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface FiltersCandidates {
  electoral_process_id?: string;
  type?: CandidacyType | string;
  districts?: string[] | string;
  search?: string;
  skip?: number;
  limit?: number;
  districtType?: "unico" | "multiple";
  [key: string]: unknown;
}

export interface FiltersRegulars {
  search?: string;
  skip?: number;
  limit?: number;
  [key: string]: unknown;
}
// ============= RESPUESTAS DE API =============

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}
