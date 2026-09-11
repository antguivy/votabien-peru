export interface ParsedSourceUrl {
  url: string;
  domain: string;
  label: string;
  isJNE: boolean;
}

const KNOWN_MEDIA_NAMES: Record<string, string> = {
  "elcomercio.pe": "El Comercio",
  "rpp.pe": "RPP Noticias",
  "larepublica.pe": "La República",
  "elbuho.pe": "El Búho",
  "infobae.com": "Infobae",
  "andina.pe": "Andina",
  "lpderecho.pe": "LP Derecho",
  "idl-reporteros.pe": "IDL-Reporteros",
  "ojo-publico.com": "OjoPúblico",
  "gestion.pe": "Gestión",
  "peru21.pe": "Perú21",
  "convoca.pe": "Convoca",
  "exitosanoticias.pe": "Exitosa",
  "canaln.pe": "Canal N",
  "panamericana.pe": "Panamericana",
  "latinanoticias.pe": "Latina",
  "atv.pe": "ATV",
  "jne.gob.pe": "JNE Oficial",
  "onpe.gob.pe": "ONPE",
  "pj.gob.pe": "Poder Judicial",
  "mpfn.gob.pe": "Ministerio Público",
  "tc.gob.pe": "Tribunal Constitucional",
  "contraloria.gob.pe": "Contraloría",
};

/**
 * Parsea un campo source_url que puede contener una sola URL o múltiples URLs separadas por comas, punto y coma o saltos de línea.
 * Valida cada URL con try/catch para evitar caídas por URLs malformadas y extrae el nombre reconocible del medio.
 */
export function parseSourceUrls(sourceUrl?: string | null): ParsedSourceUrl[] {
  if (!sourceUrl || typeof sourceUrl !== "string") return [];

  // Split inteligente: divide por comas, punto y coma o saltos de línea SOLO si van seguidos de http/https
  // para no romper URLs que contengan comas dentro de parámetros de búsqueda (ej. ?q=a,b).
  const rawParts = sourceUrl.split(/(?:[\n;]|\s*,\s*(?=https?:\/\/))/i);
  const seenUrls = new Set<string>();
  const parsedList: ParsedSourceUrl[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed || seenUrls.has(trimmed)) continue;

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      continue;
    }

    try {
      const parsed = new URL(trimmed);
      const domain = parsed.hostname.replace(/^www\./, "").toLowerCase();
      const isJNE = domain.includes("jne.gob.pe");
      const friendlyName = KNOWN_MEDIA_NAMES[domain] || domain || "Fuente";

      seenUrls.add(trimmed);
      parsedList.push({
        url: trimmed,
        domain,
        label: friendlyName,
        isJNE,
      });
    } catch {
      // Si la URL es sintácticamente inválida, se omite silenciosamente sin romper React
    }
  }

  return parsedList;
}
