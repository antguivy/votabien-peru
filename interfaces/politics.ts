// ============= ENUMS =============

export enum TipoCamara {
  CONGRESO = "congreso",
  SENADO = "senado",
  DIPUTADOS = "diputados",
}

export enum TipoCandidatura {
  PRESIDENTE = "Presidente",
  VICEPRESIDENTE = "Vicepresidente",
  SENADOR = "Senador",
  DIPUTADO = "Diputado",
  CONGRESISTA = "Congresista",
}

export enum EstadoCandidatura {
  INSCRITO = "Inscrito",
  HABIL = "Hábil",
  INHABILITADO = "Inhabilitado",
  TACADO = "Tacado",
}

export interface Antecedente {
  tipo: string;
  titulo: string;
  descripcion: string;
  estado: string | null;
  sancion: string | null;
  fecha: string;
  periodo: string | null;
  fuente: string;
  fuente_url: string | null;
}

export interface BiografiaDetlle {
  tipo: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  relevancia?: string;
  fuente: string;
  fuente_tipo: string;
  fuente_url?: string;
}

export interface ExperienciaLaboral {
  cargo?: string;
  empresa?: string;
  periodo?: string;
  descripcion?: string;
}

export interface HistorialPartido {
  año: number;
  evento: string;
}
// ============= INTERFACES BASE =============

export interface PartidoPoliticoBase {
  id: string;
  nombre: string;
  sigla: string;
  logo_url: string | null;
  color_hex: string;
  activo: boolean;
  created_at: string;
}

export interface DistritoElectoral {
  id: string;
  nombre: string;
  codigo: string;
  es_distrito_nacional: boolean;
  num_senadores: number;
  num_diputados: number;
  activo: boolean;
}

export interface ProcesoElectoral {
  id: string;
  nombre: string;
  año: number;
  fecha_elecciones: string;
  activo: boolean;
  created_at: string;
}
// ============= PARTIDO ==========================
export interface PartidoDetail extends PartidoPoliticoBase {
  fundador: string | null;
  fecha_fundacion: Date | null;
  descripcion: string | null;
  ideologia: string | null;
  sede_nacional: string | null;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  financiamiento_anual: number | null;
  gasto_campana_ultima: number | null;
  fuente_financiamiento: string | null;
  historia_timeline: HistorialPartido[] | [];
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  total_afiliados: number | null;
  total_escaños: number | null;
}
// ============= PERSONA Y LEGISLADOR =============

export interface PersonaBase {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  foto_url: string | null;
  profesion: string | null;
  fecha_nacimiento: Date | null;
  biografia_detallada: BiografiaDetlle[] | [];
  educacion_tecnica: string | null;
  educacion_universitaria: string | null;
  grado_academico: string | null;
  titulo_profesional: string | null;
  post_grado: string | null;
  hoja_vida_url: string | null;
  experiencia_laboral: ExperienciaLaboral[] | [];
  antecedentes: Antecedente[] | [];
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  created_at: Date;
}

export interface PeriodoLegislador {
  id: string;
  camara: TipoCamara;
  periodo_inicio: string;
  periodo_fin: string;
  esta_activo: boolean;
  email_congreso: string | null;
  bancada_nombre: string | null;
  partido_origen: PartidoPoliticoBase;
  partido_actual?: PartidoPoliticoBase;

  distrito: DistritoElectoral;
  proyectos_ley: ProyectoLey[];
  asistencias: Asistencia[];
  denuncias: Denuncia[];
  created_at: string;
}

export interface PersonaList extends PersonaBase {
  periodo_activo: PeriodoLegislador;
}

export interface PersonaDetail extends PersonaBase {
  // Historial político
  periodos_legislativos: PeriodoLegislador[];
  candidaturas: CandidaturaList[];
}

// ============= CANDIDATURAS =============

export interface CandidaturaBase {
  id: string;
  tipo: TipoCandidatura;
  numero_lista: number | null;
  estado: EstadoCandidatura;
  votos_obtenidos: number | null;
  fue_elegido: boolean;
}

export interface CandidaturaList extends CandidaturaBase {
  persona: PersonaBase;
  partido: PartidoPoliticoBase;
  distrito: DistritoElectoral | null;
  proceso_electoral: ProcesoElectoral;
}

export interface CandidaturaDetail extends CandidaturaBase {
  persona: PersonaBase;
  periodos_legislativos: PeriodoLegislador[] | [];
  partido: PartidoPoliticoBase;
  distrito: DistritoElectoral | null;
  proceso_electoral: ProcesoElectoral;

  // Propuestas y documentos
  propuestas: string | null;
  plan_gobierno_url: string | null;

  created_at: string;
}

// ============= PROYECTOS DE LEY =============

export interface ProyectoLey {
  id: string;
  numero: string;
  titulo: string;
  resumen: string;
  fecha_presentacion: string;
  estado: string;
  url_documento: string | null;
  created_at: string;
}

// ============= ASISTENCIAS Y DENUNCIAS =============

export interface Asistencia {
  id: string;
  fecha: string;
  tipo_sesion: string;
  asistio: boolean;
  created_at: string;
}

export interface Denuncia {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha_denuncia: string;
  estado: string;
  resolucion: string | null;
  url_documento: string | null;
  created_at: string;
}

// ============= FILTROS Y OPCIONES =============

export interface FiltrosPersonas {
  camara?: TipoCamara;
  partidos?: string[];
  distritos?: string[];
  search?: string;
}

export interface FiltrosCandidaturas {
  tipo?: TipoCandidatura;
  partidos?: string[];
  distritos?: string[];
  estado?: EstadoCandidatura;
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

export type PersonaListArray = PersonaList[];
export type CandidaturaListArray = CandidaturaList[];
export type PartidoArray = PartidoPoliticoBase[];
export type DistritoArray = DistritoElectoral[];
