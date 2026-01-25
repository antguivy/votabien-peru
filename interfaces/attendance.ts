// ============= ASISTENCIAS Y DENUNCIAS =============

export enum SessionType {
  PLENO = "PLENO",
  COMISION_PERMANENTE = "COMISION_PERMANENTE",
  COMISION_ORDINARIA = "COMISION_ORDINARIA",
  EXTRAORDINARIA = "EXTRAORDINARIA",
}

export enum AttendaceStatus {
  ASISTENCIA = "ASISTENCIA",
  FALTA = "FALTA",
  FALTA_JUSTIFICADA = "FALTA_JUSTIFICADA",
  TARDANZA = "TARDANZA",
  LICENCIA = "LICENCIA",
  COMISION_ESPECIAL = "COMISION_ESPECIAL",
}

export interface Attendance {
  id: string;
  date: string;
  session_type: SessionType;
  attendance_status: AttendaceStatus;
  notes: string | null;
  created_at: string;
}
