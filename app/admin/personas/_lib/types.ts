import {
  AdminPerson,
  Assets,
  BiographyDetail,
  Incomes,
  NoUniversityEducation,
  PoliticalRole,
  PostgraduateEducation,
  TechnicalEducation,
  UniversityEducation,
  WorkExperience,
} from "@/interfaces/person";

// Legislator
export interface PersonResponse {
  id: string;
  party_number_rop: string | null;
  dni: string | null;
  gender: string;
  name: string;
  lastname: string;
  fullname: string;
  image_url: string | null;
  image_candidate_url: string | null;
  birth_date: string | null;
  profession: string | null;
  detailed_biography: BiographyDetail[];
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

  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;

  created_at: string;
}

// Paginated Response
export interface PaginatedPersonResponse {
  data: AdminPerson[];
  total: number;
  page: number;
  page_size: number;
}

// active Counts
// export interface ActivePartiesCounts {
//   [key: string]: number;
// }

export interface BulkUpdatePartiesRequest {
  ids: string[];
  active: boolean;
}

export interface BulkUpdatePartiesResponse {
  count: number;
  message: string;
}
