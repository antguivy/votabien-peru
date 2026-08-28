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

export interface CanonicalFindingData {
  type: string;
  title: string;
  summary: string;
  status: string;
  publication_date: string | null;
  source: string;
  source_url: string | null;
  sanction: string | null;
}

export function normalizeFindingData(
  raw: Record<string, unknown> | null | undefined,
): CanonicalFindingData {
  if (!raw) {
    return {
      type: "NOTICIA",
      title: "Sin título",
      summary: "Sin descripción",
      status: "EN_INVESTIGACION",
      publication_date: null,
      source: "Web",
      source_url: null,
      sanction: null,
    };
  }

  const rawType = String(raw.type || raw.tipo || raw.tema || "NOTICIA")
    .trim()
    .toUpperCase();

  const fallbackTitle = raw.tema
    ? `${raw.tema} - Declaración`
    : raw.description || raw.summary || raw.redaccion_final
      ? String(raw.description || raw.summary || raw.redaccion_final).substring(
          0,
          70,
        ) + "..."
      : "Hallazgo Web";

  const title = String(raw.title || raw.titulo || fallbackTitle).trim();

  const summary = String(
    raw.summary ||
      raw.redaccion_final ||
      raw.descripcion ||
      raw.description ||
      raw.hecho ||
      "Sin resumen",
  ).trim();

  const rawStatus = String(raw.status || raw.estado || "EN_INVESTIGACION")
    .trim()
    .toUpperCase();

  const publication_date =
    raw.publication_date || raw.fecha || raw.date
      ? String(raw.publication_date || raw.fecha || raw.date).trim()
      : null;

  const source = String(
    raw.source || raw.fuente_normalizada || raw.fuente || "Web",
  ).trim();

  const source_url =
    raw.source_url || raw.fuente_url
      ? String(raw.source_url || raw.fuente_url).trim()
      : null;

  const sanction =
    raw.sanction || raw.sancion
      ? String(raw.sanction || raw.sancion).trim()
      : null;

  return {
    type: rawType,
    title,
    summary,
    status: rawStatus,
    publication_date,
    source,
    source_url,
    sanction,
  };
}
