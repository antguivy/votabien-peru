export enum BackgroundType {
  PENAL = "PENAL",
  ETICA = "ETICA",
  CIVIL = "CIVIL",
  ADMINISTRATIVO = "ADMINISTRATIVO",
}

export enum BackgroundStatus {
  EN_INVESTIGACION = "EN_INVESTIGACION",
  SENTENCIADO = "SENTENCIADO",
  SANCIONADO = "SANCIONADO",
  ARCHIVADO = "ARCHIVADO",
  ABSUELTO = "ABSUELTO",
  PRESCRITO = "PRESCRITO",
}

export interface BackgroundBase {
  id: string;
  publication_date: string | null;
  type: BackgroundType;
  status: BackgroundStatus;
  title: string;
  summary: string;
  sanction: string | null;
  source: string;
  source_url: string | null;
}
