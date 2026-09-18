export interface AdminMotionRow {
  id: string;
  number: string;
  chamber: string;
  period: string | null;
  legislative_session: string | null;
  submission_date: Date;
  motion_type: string;
  is_greeting: boolean;
  purpose: string | null;
  procedural_status: string | null;
  summary: string;
  observations: string | null;
  coauthors_raw: string | null;
  adherents_raw: string | null;
  document_url: string | null;
  legislator_id: string | null;
  parliamentary_group_id: string | null;
  legislator?: {
    id: string;
    person?: {
      id: string;
      fullname: string;
      image_url: string | null;
    } | null;
  } | null;
  parliamentarygroup?: {
    id: string;
    name: string;
    acronym: string | null;
    color_hex: string | null;
  } | null;
}

export interface MotionStats {
  total: number;
  diputados: number;
  senado: number;
  greetings: number;
  interpellations: number;
}
