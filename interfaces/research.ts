export interface Antecedente {
  tipo: string;
  titulo: string;
  estado: string;
  fecha?: string | null;
  descripcion?: string;
  fuente?: string;
  redaccion_final?: string;
  fuente_normalizada?: string;
  sancion?: string | null;
  source_id?: number;
  fuente_url?: string | null;
}

export interface EventoPostura {
  tema: string;
  fecha?: string | null;
  titulo?: string | null;
  hecho?: string;
  fuente?: string;
  redaccion_final?: string;
  fuente_normalizada?: string;
  es_nuevo?: boolean;
  source_id?: number;
  fuente_url?: string | null;
}

export interface Alerta {
  severidad: string;
  titulo?: string;
  descripcion?: string;
  accion_sugerida?: string;
}

export interface Stage2ValidatedData {
  estadisticas?: {
    total_fuentes_analizadas?: number;
    antecedentes_encontrados?: number;
    posturas_encontradas?: number;
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
  fecha?: string;
}

export interface ResultadoInvestigacion {
  success: boolean;
  investigado: string;
  scraping_summary: {
    total_urls: number;
    successful: number;
    failed: number;
    results: ScrapingResult[];
  };
  stage2_tablas: Stage2ValidatedData;
  downloads?: Record<string, string>;
}

// --- TIPOS DEL STREAMING (NDJSON) ---
export type StreamEventType = "log" | "progress" | "error" | "final_result";

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
  | StreamError
  | StreamFinal;
