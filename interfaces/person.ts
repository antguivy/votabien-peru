import { BackgroundBase, BackgroundStatus } from "./background";
import { CandidacyStatus, CandidateToPerson } from "./candidate";
import { LegislatorDetail } from "./legislator";

export interface BiographyDetail {
  type: string;
  date: string;
  description: string;
  source: string;
  source_url: string | null;
}

export interface WorkExperience {
  position: string;
  organization: string;
  period: string;
}

export interface TechnicalEducation {
  graduate_school: string;
  career: string;
  concluded: string;
}

export interface NoUniversityEducation {
  graduate_school: string;
  career: string;
  concluded: string;
}

export interface UniversityEducation {
  university: string;
  degree: string;
  concluded: string;
  year_of_completion: string;
}

export interface PostgraduateEducation {
  graduate_school: string;
  specialization: string;
  concluded: string;
  degree: string;
  year_of_completion: string;
}

export interface PoliticalRole {
  political_organization: string;
  position: string;
  period: string;
}

export interface PopularElection {
  political_organization: string;
  position: string;
  period: string;
}

export interface Incomes {
  public_income: string;
  private_income: string;
  total_income: string;
}

export interface Assets {
  type: string;
  description: string;
  value: string;
}

export interface AdminPerson {
  id: string;
  party_number_rop: string | null;
  dni: string;
  gender: string;
  name: string;
  lastname: string;
  fullname: string;
  image_url: string | null;
  image_candidate_url: string | null;
  birth_date: string | null;
  place_of_birth: string | null;
  profession: string | null;
  detailed_biography?: BiographyDetail[];
  secondary_school: boolean;
  technical_education: TechnicalEducation[];
  no_university_education: NoUniversityEducation[];
  university_education: UniversityEducation[];
  postgraduate_education: PostgraduateEducation[];
  work_experience: WorkExperience[];
  political_role: PoliticalRole[];
  popular_election: PoliticalRole[];
  incomes: Incomes[];
  assets: Assets[];

  backgrounds?: BackgroundBase[];
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;

  created_at: string;
}

export interface PersonBasicInfo {
  id: string;
  fullname: string;
  image_url: string | null;
  image_candidate_url: string | null;
  profession: string | null;
  dni: string | null;
}

export interface PersonBase {
  id: string;
  gender: string | null;
  name: string;
  lastname: string;
  fullname: string;
  dni: string | null;
  image_url: string | null;
  image_candidate_url: string | null;
  birth_date: string | null;
  place_of_birth: string | null;
  profession: string | null;
  detailed_biography: BiographyDetail[];
  secondary_school: boolean | null;
  technical_education: TechnicalEducation[];
  no_university_education: NoUniversityEducation[];
  university_education: UniversityEducation[];
  postgraduate_education: PostgraduateEducation[];
  work_experience: WorkExperience[];
  political_role: PoliticalRole[];
  popular_election: PoliticalRole[];
  incomes: Incomes[];
  assets: Assets[];
  updated_at: string;
}

export interface PersonWithActivePeriod extends PersonBase {
  active_period: LegislatorDetail;
}

// PERSON DETAIL PARA LEGISLADORES
export interface PersonDetailLegislator extends PersonBase {
  backgrounds: BackgroundBase[];
  legislative_periods: LegislatorDetail[];
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
}

// PERSON DETAIL PARA CANDIDATOS
export interface PersonDetailCandidate extends PersonBase {
  backgrounds: BackgroundBase[];
  active_candidacy: CandidateToPerson;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
}

export type CreatePersonRequest = Omit<AdminPerson, "id" | "created_at"> & {
  backgrounds?: BackgroundBase[];
};

export type UpdatePersonRequest = Omit<AdminPerson, "created_at"> & {
  backgrounds?: BackgroundBase[];
};

export interface PersonWithBackground extends PersonBase {
  backgrounds: BackgroundBase[];
}

export interface PersonBackgroundToCard {
  id: string;
  fullname: string;
  image_url: string | null;
  image_candidate_url: string | null;
  profession: string | null;
  is_incumbent: boolean;
  education_level: number | null;
  secondary_school: boolean | null;
  incomes: Record<string, unknown> | null;
  assets: Record<string, unknown> | null;
  work_experience: unknown[] | null;
  sanction_status: string | null;
  has_criminal_record: boolean;
  has_penal_sentence: boolean;
  backgrounds: { status: BackgroundStatus }[];
}
