import {
  ElectoralDistrictBase,
  ElectoralDistrictBasic,
} from "./electoral-district";
import {
  PersonBackgroundToCard,
  PersonBasicInfo,
  PersonWithBackground,
} from "./person";
import { PoliticalPartyBase } from "./political-party";
import { ElectoralProcess } from "./politics";

export enum CandidacyStatus {
  SOLICITUD_INSCRIPCION = "SOLICITUD_INSCRIPCION", // Paso 1: Presentan la lista
  INSCRITO = "INSCRITO", // Paso 2: El JNE la acepta formalmente (Ya sale en la web oficial)
  ADMITIDO = "ADMITIDO", // Admitido formalmente por el JEE
  PUBLICADO_PARA_TACHAS = "PUBLICADO_PARA_TACHAS",
  TACHA_EN_TRAMITE = "TACHA_EN_TRAMITE",
  TACHADO = "TACHADO", // Alguien se quejó y lo sacaron
  EXCLUIDO = "EXCLUIDO", // El JNE lo sacó por mentir en hoja de vida o dádivas
  IMPROCEDENTE = "IMPROCEDENTE", // No cumplió requisitos de forma
  RENUNCIA = "RENUNCIA", // El candidato se bajó
  APELACION = "APELACION", // Está peleando su exclusión
}

export enum CandidacyType {
  PRESIDENTE = "PRESIDENTE",
  VICEPRESIDENTE_1 = "VICEPRESIDENTE_1",
  VICEPRESIDENTE_2 = "VICEPRESIDENTE_2",
  SENADOR = "SENADOR",
  DIPUTADO = "DIPUTADO",
  PARLAMENTO_ANDINO = "PARLAMENTO_ANDINO",
  GOBERNADOR_REGIONAL = "GOBERNADOR_REGIONAL",
  VICEGOBERNADOR_REGIONAL = "VICEGOBERNADOR_REGIONAL",
  CONSEJERO_REGIONAL = "CONSEJERO_REGIONAL",
  ALCALDE_PROVINCIAL = "ALCALDE_PROVINCIAL",
  REGIDOR_PROVINCIAL = "REGIDOR_PROVINCIAL",
  ALCALDE_DISTRITAL = "ALCALDE_DISTRITAL",
  REGIDOR_DISTRITAL = "REGIDOR_DISTRITAL",
}

export type FilterCandidacyType =
  | "GOBERNADOR_REGIONAL"
  | "CONSEJERO_REGIONAL"
  | "ALCALDE_PROVINCIAL"
  | "ALCALDE_DISTRITAL"
  | "PRESIDENTE"
  | "SENADOR_NACIONAL"
  | "SENADOR_REGIONAL"
  | "DIPUTADO"
  | "PARLAMENTO_ANDINO";

// Opciones para el TypeBar — etiquetas legibles
export const typeOptions: {
  value: FilterCandidacyType;
  label: string;
  description: string;
}[] = [
  {
    value: "GOBERNADOR_REGIONAL",
    label: "Gobernadores Reg.",
    description:
      "Gobierno Regional: Gobernador y Vicegobernador elegidos para liderar el desarrollo y la gestión de tu región.",
  },
  {
    value: "CONSEJERO_REGIONAL",
    label: "Consejeros Reg.",
    description:
      "Consejo Regional: Fiscalizan y norman a nivel del departamento en representación de cada provincia.",
  },
  {
    value: "ALCALDE_PROVINCIAL",
    label: "Alcaldes Prov.",
    description:
      "Municipalidad Provincial: Lideran la gestión de la provincia junto con el cuerpo de regidores provinciales.",
  },
  {
    value: "ALCALDE_DISTRITAL",
    label: "Alcaldes Dist.",
    description:
      "Municipalidad Distrital: Alcalde y regidores encargados del desarrollo y servicios directos de tu distrito.",
  },
];

export interface FiltersCandidates {
  search: string;
  type: string; // FilterCandidacyType en práctica
  parties: string[]; // 0 ó 1 elemento (single select)
  districts: string[]; // 0 ó 1 elemento (single select)
  alerts?: string[];
  no_sentencias?: boolean;
  min_work?: number;
  education?: string;
}

export interface AllianceBase {
  id?: string | number;
  name: string;
  acronym?: string | null;
  color_hex: string | null;
  logo_url?: string | null;
}

export interface CandidateBase {
  id: string;
  active: boolean;
  electoral_process_id: string;
  political_party_id: string;
  electoral_district_id: string;
  type: CandidacyType;
  list_number: number | null;
  status: CandidacyStatus;
}

export interface AdminCandidate {
  id: string;
  person_id: string;
  fullname: string;
  electoral_process_id: string;
  type: CandidacyType;
  political_party_id: string;
  electoral_district_id: string | null;
  status: CandidacyStatus;
  list_number: number | null;
  active: boolean;
  created_at: string;

  // Relaciones populadas
  person: PersonBasicInfo | null;
  political_party: PoliticalPartyBase | null;
  electoral_district: ElectoralDistrictBase | null;
  electoral_process: ElectoralProcess | null;
}

export interface CandidateToPerson extends CandidateBase {
  political_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrictBase | null;
  electoral_process: ElectoralProcess;
}
export interface CandidateBasicInfo {
  id: string;
  person: PersonBasicInfo;
  political_party: PoliticalPartyBase | null;
  alliance: AllianceBase | null;
  electoral_district: ElectoralDistrictBase | null;
  electoral_process_id: string | number;
}

export interface CandidateCard extends CandidateBase {
  person: PersonBackgroundToCard;
  political_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrictBasic | null;
  has_metrics: boolean;
  ai_score?: number;
  ai_analysis?: string;
}

export interface CandidatePresidentials {
  id: string;
  person: PersonBasicInfo;
  type: CandidacyType;
  list_number?: number | null;
}

export interface CandidateDetail extends CandidateBase {
  person: PersonWithBackground;
  political_party: PoliticalPartyBase;
  electoral_district: ElectoralDistrictBasic | null;
  ai_score?: number;
  ai_analysis?: string;
}

export interface CreateCandidatePeriodRequest extends CandidateBase {
  person_id: string;
}

export interface UpdateCandidatePeriodRequest extends Partial<CandidateBase> {
  person_id: string;
  id: string;
}
