export enum BillApprovalStatus {
  // # PRESENTADO
  PRESENTADO = "PRESENTADO",
  EN_COMISION = "EN_COMISION",

  // # EN PROCESO
  DICTAMEN = "DICTAMEN",
  EN_AGENDA_PLENO = "EN_AGENDA_PLENO",
  ORDEN_DEL_DIA = "ORDEN_DEL_DIA",
  EN_CUARTO_INTERMEDIO = "EN_CUARTO_INTERMEDIO",
  APROBADO_PRIMERA_VOTACION = "APROBADO_PRIMERA_VOTACION",
  PENDIENTE_SEGUNDA_VOTACION = "PENDIENTE_SEGUNDA_VOTACION",
  EN_RECONSIDERACION = "EN_RECONSIDERACION",
  RETORNA_A_COMISION = "RETORNA_A_COMISION",

  // # APROBADO
  APROBADO = "APROBADO",
  AUTOGRAFA = "AUTOGRAFA",
  PUBLICADO = "PUBLICADO", // # Diario el Peruano

  //# ARCHIVADO
  // # proyectos rechazados en comision o en votacion por el pleno
  AL_ARCHIVO = "AL_ARCHIVO",
  // # proyectos rechazados por no cumplir requisitos o tiene problemas
  // # formales o constitucionles
  DECRETO_ARCHIVO = "DECRETO_ARCHIVO",

  //# RETIRADO
  RETIRADO_POR_AUTOR = "RETIRADO_POR_AUTOR",
}

export interface BillBase {
  number: string;
  title: string;
  title_ai: string | null;
  submission_date: string;
  approval_status: BillApprovalStatus;
  approval_date: string | null;
  document_url: string | null;
}

export interface BillBasic {
  id: string;
  number: string;
  title: string;
  title_ai: string | null;
  submission_date: string;
  approval_status: BillApprovalStatus;
  approval_date: string | null;
  document_url: string | null;
}

export interface BillBasic extends BillBase {
  id: string;
  status_group: string;
}
