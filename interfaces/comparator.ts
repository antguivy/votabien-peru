// interfaces/comparator.ts

import { LegislatorBasicInfo } from "./legislator";
import { LegislatorMetricsWithComputed } from "./legislator-metrics";

// ============================================
// TIPOS COMPARTIDOS
// ============================================

export type ComparisonDataStatus = "available" | "no_metrics" | "not_found";

// ============================================
// TIPOS PARA LEGISLADORES
// ============================================

// 🔥 Para comparación (con métricas completas)
export interface LegislatorWithMetrics {
  legislator: LegislatorBasicInfo;
  metrics: LegislatorMetricsWithComputed;
}

export interface LegislatorCompareItem {
  legislator_id: string;
  legislator_name: string | null;
  status: ComparisonDataStatus;
  data: LegislatorWithMetrics | null;
  message: string | null;
}

export interface LegislatorComparison {
  total_requested: number;
  total_available: number;
  comparison_date: string;
  items: LegislatorCompareItem[];
}

// ============================================
// TIPOS PARA CANDIDATOS
// ============================================

export interface CandidateComputedMetrics {
  education_level: string; // Ej: "Maestría", "Secundaria"
  education_score: number; // 1-5 para barritas de nivel
  total_income: number; // Suma declarada
  total_assets: number; // Suma bienes
  red_flags_count: number; // Cantidad de sentencias/antecedentes
  experience_years: number; // Años aproximados de trabajo
  last_updated: string;
}
export interface CandidateWithMetrics {
  candidate: {
    id: string; // ID de la candidatura
    person: {
      id: string; // ID de la persona
      fullname: string;
      image_url: string | null;
      image_candidate_url: string | null;
      profession: string | null;
      dni: string | null;
    };
    political_party: {
      id: string;
      name: string;
      acronym: string | null; // Para rutas
      logo_url?: string | null;
    } | null;
    electoral_district: {
      id: string;
      name: string;
    } | null;
    list_number: number | null;
    status: string; // INSCRITO, TACHADO, etc.
  };
  metrics: CandidateComputedMetrics;
}

export interface CandidateCompareItem {
  candidate_id: string;
  candidate_name: string | null;
  status: ComparisonDataStatus;
  data: CandidateWithMetrics | null;
  message: string | null;
}

export interface CandidateComparison {
  total_requested: number;
  total_available: number;
  comparison_date: string;
  items: CandidateCompareItem[];
}

// ============================================
// PAYLOADS PARA API
// ============================================

export interface LegislatorComparisonPayload {
  ids: string[];
}

export interface CandidateComparisonPayload {
  dnis: string[];
  candidacy_type?: string;
  process_id?: string;
}

export type ComparisonPayload =
  | LegislatorComparisonPayload
  | CandidateComparisonPayload;

// ============================================
// TIPO UNIFICADO
// ============================================

export type ComparisonResponse =
  | LegislatorComparison
  | CandidateComparison
  | null;
