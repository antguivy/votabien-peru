import { CandidateCard } from "./candidate";

export type LegalRecordPreference = "CLEAN" | "INVESTIGATION_OK";
export type FinancialTransparency = "BOTH" | "INCOME_ONLY";

export interface AgeRange {
  min: number;
  max: number;
}

export interface MatchResponse {
  data: {
    presidente: CandidateCard[];
    senador_nacional: CandidateCard[];
    senador_regional: CandidateCard[];
    diputado_regional: CandidateCard[];
    parlamento_andino: CandidateCard[];
  };
  count: number;
  count_by_category: {
    presidente: number;
    senador_nacional: number;
    senador_regional: number;
    diputado_regional: number;
    parlamento_andino: number;
  };
}

export interface MatchFormParams {
  electoral_district_id: string;
  excluded_party_ids?: string[];
  min_age?: number;
  max_age?: number;
  legal_record_preference?: LegalRecordPreference;
  education_level?: number;
  is_incumbent?: boolean;
  financial_transparency?: FinancialTransparency;
  min_work_experiences?: number;
  has_electoral_experience?: boolean;
  has_political_roles?: boolean;
  born_in_district?: boolean;
  reinfo_clean?: boolean;
}

export type QuestionOptionValue =
  | AgeRange
  | LegalRecordPreference
  | FinancialTransparency
  | number
  | boolean
  | undefined
  | string;

export interface QuestionOption {
  label: string;
  description?: string;
  value: QuestionOptionValue;
  paramKey?: keyof MatchFormParams | "age_range";
}

export interface QuestionConfig {
  id: number;
  question: string;
  icon?: string;
  description?: string;
  options: QuestionOption[];
}
