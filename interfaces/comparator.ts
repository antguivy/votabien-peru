import { BackgroundBase } from "./background";
import {
  Assets,
  BiographyDetail,
  Incomes,
  NoUniversityEducation,
  PoliticalRole,
  PopularElection,
  PostgraduateEducation,
  TechnicalEducation,
  UniversityEducation,
  WorkExperience,
} from "./person";

// ============================================
// TIPOS COMPARTIDOS
// ============================================

export type ComparisonDataStatus = "available" | "not_found";

// ============================================
// HOJA DE VIDA — estructuras raw del JSONB
// ============================================

export interface HojaDeVida {
  university_education: UniversityEducation[];
  postgraduate_education: PostgraduateEducation[];
  technical_education: TechnicalEducation[];
  no_university_education: NoUniversityEducation[];
  work_experience: WorkExperience[];
  popular_election: PopularElection[];
  political_role: PoliticalRole[];
  incomes: Incomes[];
  assets: Assets[];
  secondary_school: boolean;
}

// ============================================
// MIEMBRO DE UNA FÓRMULA
// ============================================

export interface FormulaMember {
  id: string;
  type: "PRESIDENTE" | "VICEPRESIDENTE_1" | "VICEPRESIDENTE_2";
  person: {
    id: string;
    dni: string | null;
    fullname: string;
    image_url: string | null;
    image_candidate_url: string | null;
    profession: string | null;
    detailed_biography: BiographyDetail[];
    hoja_de_vida: HojaDeVida;
  };
  backgrounds: BackgroundBase[];
}

// ============================================
// FÓRMULA COMPLETA
// ============================================

export interface FormulaWithData {
  president: FormulaMember;
  vp1: FormulaMember | null;
  vp2: FormulaMember | null;
  political_party: {
    id: string;
    name: string;
    acronym: string | null;
    logo_url: string | null;
    color_hex: string | null;
  } | null;
  electoral_process_id: string;
}

export interface FormulaCompareItem {
  president_id: string;
  president_name: string | null;
  status: ComparisonDataStatus;
  data: FormulaWithData | null;
  message: string | null;
}

export interface FormulaComparison {
  total_requested: number;
  total_available: number;
  comparison_date: string;
  items: FormulaCompareItem[];
}

export type ComparisonResponse = FormulaComparison | null;
