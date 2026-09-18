export interface AdminInformationRequestRow {
  id: string;
  number: string;
  chamber: string;
  period: string | null;
  legislative_year: string | null;
  legislative_session: string | null;
  document_code: string | null;
  document_date: Date | null;
  origin: string | null;
  summary: string;
  target_entity: string;
  target_position: string | null;
  target_person: string | null;
  reception_date: Date | null;
  due_date: Date | null;
  coauthors_raw: string | null;
  document_url: string | null;
  legislator_id: string | null;
  created_at?: Date;
  updated_at?: Date;
  legislator?: {
    id: string;
    person?: {
      id: string;
      fullname: string;
      image_url: string | null;
    } | null;
  } | null;
}

export interface InformationRequestStats {
  total: number;
  diputados: number;
  senado: number;
  with_pdf: number;
}
