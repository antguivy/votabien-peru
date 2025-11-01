// ============= ENUMS =============

export enum ChamberType {
  CONGRESO = "congreso",
  SENADO = "senado",
  DIPUTADOS = "diputados",
}

export enum CandidacyType {
  PRESIDENTE = "Presidente",
  VICEPRESIDENTE = "Vicepresidente",
  SENADOR = "Senador",
  DIPUTADO = "Diputado",
  CONGRESISTA = "Congresista",
}

export enum CandidacyStatus {
  INSCRITO = "Inscrito",
  HABIL = "Hábil",
  INHABILITADO = "Inhabilitado",
  TACADO = "Tacado",
}

export interface PreviousCase {
  type: string;
  title: string;
  description: string;
  status: string | null;
  sanction: string | null;
  date: string;
  period: string | null;
  source: string;
  source_type: string;
  source_url: string | null;
}

export interface BiographyDetail {
  type: string;
  date: string;
  title: string;
  description: string;
  relevance: string | null;
  source: string;
  source_tipo: string;
  source_url: string | null;
}

export interface WorkExperience {
  positon: string;
  organization: string;
  period: string;
  description: string;
}

export interface PartyHistory {
  year: number;
  event: string;
}
// ============= INTERFACES BASE =============

export interface PoliticalPartyBase {
  id: string;
  name: string;
  acronym: string;
  logo_url: string | null;
  color_hex: string;
  active: boolean;
  created_at: string;
}

export interface ElectoralDistrict {
  id: string;
  name: string;
  code: string;
  is_national: boolean;
  num_senators: number;
  num_deputies: number;
  active: boolean;
}

export interface ElectoralProcess {
  id: string;
  name: string;
  year: number;
  election_date: string;
  active: boolean;
  created_at: string;
}
// ============= PARTIDO ==========================
export interface PoliticalPartyDetail extends PoliticalPartyBase {
  founder: string | null;
  foundation_date: Date | null;
  description: string | null;
  ideology: string | null;
  main_office: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  party_timeline: PartyHistory[] | [];
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  total_afiliates: number;
  total_seats: number;
}
// ============= PERSONA Y LEGISLADOR =============

export interface PersonBase {
  id: string;
  dni: string;
  name: string;
  lastname: string;
  fullname: string;
  image_url: string | null;
  profession: string | null;
  birth_date: Date | null;
  detailed_biography: BiographyDetail[] | [];
  technical_education: string | null;
  university_education: string | null;
  academic_degree: string | null;
  professional_title: string | null;
  postgraduate_education: string | null;
  resume_url: string | null;
  work_experience: WorkExperience[] | [];
  previous_cases: PreviousCase[] | [];
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  created_at: Date;
}

export interface LegislatorDetail {
  id: string;
  chamber: ChamberType;
  start_date: string;
  end_date: string;
  active: boolean;
  institutional_email: string | null;
  parliamentary_group: string | null;
  original_party: PoliticalPartyBase;
  current_party?: PoliticalPartyBase;

  electoral_district: ElectoralDistrict;
  bills: Bill[];
  attendances: Attendance[];
  created_at: Date;
}

export interface LegislatorWithParty {
  chamber: string;
  start_date: string;
  end_date: string;
  active: boolean;
  institutional_email: string | null;
  parliamentary_group: string | null;
  created_at: string;
  original_party: PoliticalPartyBase;
}
export interface PersonList extends PersonBase {
  active_period: LegislatorDetail;
}

export interface PersonDetail extends PersonBase {
  legislative_periods: LegislatorDetail[];
  candidacies: CandidateList[];
}

// ============= CANDIDATURAS =============

export interface CandidateBase {
  id: string;
  type: CandidacyType;
  list_number: number | null;
  status: CandidacyStatus;
  votes_obtained: number | null;
  was_elected: boolean;
}

export interface CandidateList extends CandidateBase {
  person: PersonBase;
  political_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrict | null;
  electoral_process: ElectoralProcess;
}

export interface CandidateDetail extends CandidateBase {
  person: PersonBase;
  legislative_periods: LegislatorDetail[] | [];
  political_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrict | null;
  electoral_process: ElectoralProcess;

  // Propuestas y documentos
  proposals: string | null;
  government_plan_url: string | null;

  created_at: Date;
}

// ============= PROYECTOS DE LEY =============

export interface Bill {
  id: string;
  number: string;
  title: string;
  summary: string;
  submission_date: Date;
  status: string;
  document_url: string | null;
  created_at: Date;
}

// ============= ASISTENCIAS Y DENUNCIAS =============

export interface Attendance {
  id: string;
  date: Date;
  session_type: string;
  attended: boolean;
  created_at: Date;
}

// ============= ESCAÑOS =============

export interface SeatParliamentary {
  chamber: string;
  number_seat: number;
  row: number;
  legislator: LegislatorWithParty | null;
  created_at: Date;
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
  type?: CandidacyType;
  parties?: string[];
  districts?: string[];
  status?: CandidacyStatus;
  search?: string;
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

// ============= HELPERS DE TIPOS =============

export type PersonListArray = PersonList[];
export type CandidateListArray = CandidateList[];
export type PartidoArray = PoliticalPartyBase[];
export type DistritoArray = ElectoralDistrict[];
