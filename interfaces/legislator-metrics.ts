import { ElectoralDistrictBasic } from "./electoral-district";
import { ParliamentaryGroupBasic } from "./parliamentary-membership";
import { PoliticalPartyBase } from "./political-party";

export interface LegislatorVersusCard {
  id: string;
  person_id: string;

  // Datos básicos
  fullname: string;
  name: string;
  lastname: string;
  image_url: string | null;
  profession: string | null;

  // Datos legislativos
  chamber: string;
  condition: string;
  start_date: string;
  days_in_office: number;

  // Relaciones
  current_parliamentary_group: ParliamentaryGroupBasic | null;
  electoral_district: ElectoralDistrictBasic | null;
  elected_by_party: PoliticalPartyBase | null;

  // Stats
  stats: {
    attendance_percentage: number;
    total_sessions: number;
    total_bills: number;
    bills_approved: number;
    total_party_changes: number;
    is_defector: boolean;
    active_legal_cases: number;
    total_legal_records: number;
  };
}
export interface LegislatorMetricsBase {
  [key: string]: number | boolean | string | null | undefined;
  legislator_id: string;
  // Métricas de proyectos de ley
  total_bills: number;
  bills_as_author: number;
  bills_as_coauthor: number;

  // Métricas por estado
  bills_presentado: number;
  bills_en_comision: number;
  bills_aprobado: number;
  bills_rechazado: number;
  bills_al_archivo: number;
  bills_decreto_archivo: number;
  bills_retirado_por_autor: number;

  // Tasa de éxito
  approval_rate: number | null;

  // Métricas de asistencia
  total_sessions: number;
  sessions_present: number;
  sessions_absent: number;
  sessions_justified: number;
  sessions_license: number;
  attendance_rate: number | null;

  // Métricas de transfuguismo
  total_party_changes: number;
  days_in_current_group: number | null;
  is_defector: boolean;

  // Antecedentes
  total_legal_records: number;
  penal_records: number;
  ethical_records: number;
  civil_records: number;
  administrative_records: number;

  last_updated: string;
}

export interface LegislatorMetricsWithComputed extends LegislatorMetricsBase {
  bills_in_progress: number;
  bills_finished: number;
  bills_rejected: number;
}
