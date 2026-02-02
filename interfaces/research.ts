export interface Antecedente {
  tipo: string; // PENAL | ADMINISTRATIVO | ETICO | CIVIL
  titulo: string;
  estado: string; // EN_INVESTIGACION | ARCHIVADO ...
  fecha?: string | null; // Puede venir null del backend

  // Campos del Draft (Stage 1)
  descripcion?: string;
  fuente?: string;

  // Campos del Validado (Stage 2)
  redaccion_final?: string; // La IA reescribe esto en Stage 2
  fuente_normalizada?: string; // "El Comercio", "Andina", etc.
  sancion?: string | null;
  source_id?: number;

  // Comunes
  fuente_url?: string | null;
}

export interface EventoPostura {
  // SEGURIDAD | ECONOMIA | SOCIAL | INSTITUCIONAL |
  // TRANSFUGUISMO | CORRUPCION | GESTION
  tema: string;
  fecha?: string | null;
  titulo?: string | null;
  // Campos del Draft
  hecho?: string;
  fuente?: string;

  // Campos del Validado
  redaccion_final?: string;
  fuente_normalizada?: string;
  es_nuevo?: boolean;
  source_id?: number;

  fuente_url?: string | null;
}

export interface Alerta {
  severidad: string; // ALTA | MEDIA
  titulo?: string;
  descripcion?: string;
  accion_sugerida?: string;
}

// --- ESTRUCTURAS DE RESPUESTA ---

export interface Stage1Draft {
  metadata?: {
    investigado?: string;
    fecha_proceso?: string;
    items_validados?: number;
    nuevos_hallazgos?: number;
  };
  antecedentes?: Antecedente[];
  posturas?: EventoPostura[];
  alertas?: Alerta[];
}

// Estructura del Stage 2 (Datos Validados) - NUEVO
export interface Stage2ValidatedData {
  estadisticas?: {
    fuentes_consultadas_aprox?: number | string;
  };
  antecedentes_validos: Antecedente[];
  posturas_validas: EventoPostura[];
  alertas_revision_manual: Alerta[];
}

export interface ScrapingResult {
  url: string;
  content: string;
  include: boolean;
  status?: string;
  fecha?: string; // El scraper ahora intenta sacar fecha
}

// RESULTADO FINAL DEL PIPELINE (Lo que llega al final del stream)
export interface ResultadoInvestigacion {
  success: boolean;
  investigado: string;

  // Stage 1: El borrador original (JSON)
  stage1_draft: Stage1Draft;

  // Summary del Scraping
  scraping_summary: {
    total_urls: number;
    successful: number;
    failed: number;
    results: ScrapingResult[];
  };

  // Stage 2: Tablas validadas (AHORA ES UN OBJETO, YA NO STRING MARKDOWN)
  stage2_tablas: Stage2ValidatedData;

  downloads: Record<string, string>;
}

// --- TIPOS DEL STREAMING (NDJSON) ---

export type StreamEventType =
  | "log"
  | "data_update"
  | "progress"
  | "error"
  | "final_result";

export interface StreamLog {
  type: "log";
  step: string;
  message: string;
}

export interface StreamProgress {
  type: "progress";
  step: string;
  current: number;
  total: number;
  url: string;
  status: string;
  success: boolean;
}

export interface StreamDataUpdate {
  type: "data_update";
  stage: "draft";
  data: Stage1Draft;
}

export interface StreamError {
  type: "error";
  message: string;
}

export interface StreamFinal {
  type: "final_result";
  data: ResultadoInvestigacion;
}

export type StreamEvent =
  | StreamLog
  | StreamProgress
  | StreamDataUpdate
  | StreamError
  | StreamFinal;
