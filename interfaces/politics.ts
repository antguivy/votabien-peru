// ============= ENUMS =============

import { LegislatorInSeat } from "./legislator";
import { PersonBasicInfo } from "./person";

export enum ChamberType {
  CONGRESO = "CONGRESO",
  SENADO = "SENADO",
  DIPUTADOS = "DIPUTADOS",
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
