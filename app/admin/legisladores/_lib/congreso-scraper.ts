/**
 * Scraper y Matcher para portales oficiales del Congreso de la República del Perú:
 * - Senado: https://senado.congreso.gob.pe/senador/
 * - Diputados: https://diputados.congreso.gob.pe/diputado/
 */

export interface RawCongresoDatasetItem {
  name: string;
  campo_adicional?: string;
  partido?: string;
  group?: string;
  group_color?: string;
  district?: string;
  gender?: string;
  condition?: string;
  period?: string;
  email?: string;
  photo?: string;
  url?: string;
}

export interface CongresoMember {
  name: string; // Formato oficial: "Apellidos, Nombres"
  firstnames: string;
  lastnames: string;
  invertedName: string; // "Nombres Apellidos"
  directName: string; // "Apellidos Nombres"
  slug: string;
  party: string;
  group: string;
  district: string;
  email: string;
  photo: string; // URL miniatura original
  photoHd: string; // URL alta resolución sin -150x150
  profileUrl: string;
  chamber: "SENADO" | "DIPUTADOS";
}

export interface MatchResult {
  member: CongresoMember;
  score: number;
  matchType: "exact_inverted" | "exact_direct" | "slug" | "token_overlap";
}

const CONGRESO_URLS = {
  SENADO: "https://senado.congreso.gob.pe/senador/",
  DIPUTADOS: "https://diputados.congreso.gob.pe/diputado/",
} as const;

// Cache en memoria en el servidor (TTL de 10 minutos)
const cache: {
  SENADO?: { data: CongresoMember[]; timestamp: number };
  DIPUTADOS?: { data: CongresoMember[]; timestamp: number };
} = {};

const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Normaliza cadenas de texto: minúsculas, sin tildes, sin puntuación extra.
 */
export function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos diacríticos
    .replace(/[^a-z0-9\s]/g, " ") // Remueve comas, puntos, etc.
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convierte un texto a slug limpio (letras y guiones).
 */
export function slugify(str: string): string {
  return normalizeString(str).replace(/\s+/g, "-");
}

/**
 * Transforma una URL de miniatura de WordPress (-150x150) a la URL de tamaño completo.
 */
export function getHighResPhotoUrl(photoUrl: string): string {
  if (!photoUrl) return "";
  return photoUrl.replace(/-150x150\.(png|jpe?g|webp)$/i, ".$1");
}

/**
 * Verifica con HEAD si la imagen HD responde con 200 OK.
 * Si falla o timeout (> 1.5s), devuelve la foto miniatura como fallback seguro.
 */
export async function resolveBestPhotoUrl(
  photoThumbnail: string,
  preferHd: boolean = true,
): Promise<string> {
  if (!photoThumbnail) return "";
  if (!preferHd) return photoThumbnail;

  const hdUrl = getHighResPhotoUrl(photoThumbnail);
  if (hdUrl === photoThumbnail) return photoThumbnail;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(hdUrl, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return hdUrl;
    }
  } catch {
    // Si falla la verificación, fallback seguro a la miniatura que sabemos que existe
  }

  return photoThumbnail;
}

/**
 * Extrae y parsea el dataset de congresistas embebido en el HTML de la página oficial.
 */
export async function fetchCongresoMembers(
  chamber: "SENADO" | "DIPUTADOS",
  bypassCache: boolean = false,
): Promise<CongresoMember[]> {
  const cached = cache[chamber];
  const now = Date.now();

  if (!bypassCache && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const targetUrl = CONGRESO_URLS[chamber];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const response = await fetch(targetUrl, {
    signal: controller.signal,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-PE,es;q=0.9",
    },
    // Next.js fetch revalidation
    next: { revalidate: 3600 },
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(
      `Error al consultar el portal de ${chamber} (${response.status} ${response.statusText})`,
    );
  }

  const html = await response.text();

  // Extraer el JSON embebido en el atributo o etiqueta data-congresista-dataset
  const match = html.match(
    /<script[^>]*data-congresista-dataset[^>]*>([\s\S]*?)<\/script>/i,
  );

  if (!match || !match[1]) {
    throw new Error(
      `No se encontró el bloque data-congresista-dataset en el portal de ${chamber}`,
    );
  }

  let rawItems: RawCongresoDatasetItem[] = [];
  try {
    rawItems = JSON.parse(match[1]);
  } catch (err) {
    throw new Error(
      `Error al parsear el dataset JSON de ${chamber}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const members: CongresoMember[] = rawItems.map((item) => {
    const rawName = (item.name || "").trim();
    const parts = rawName.split(",").map((p) => p.trim());
    const lastnames = parts[0] || "";
    const firstnames = parts[1] || "";
    const invertedName = `${firstnames} ${lastnames}`.trim();
    const directName = `${lastnames} ${firstnames}`.trim();

    // Extraer slug de la URL oficial si existe (ej. /senador/aguinaga-recuenco-alejandro-aurelio/)
    let extractedSlug = "";
    if (item.url) {
      const urlMatches = item.url.match(/\/(?:senador|diputado)\/([^/]+)/);
      if (urlMatches && urlMatches[1]) {
        extractedSlug = urlMatches[1].trim();
      }
    }
    if (!extractedSlug) {
      extractedSlug = slugify(invertedName);
    }

    const photo = (item.photo || "").trim();

    return {
      name: rawName,
      firstnames,
      lastnames,
      invertedName,
      directName,
      slug: extractedSlug,
      party: item.partido || item.group || "",
      group: item.group || "",
      district: item.district || "",
      email: (item.email || "").trim().toLowerCase(),
      photo,
      photoHd: getHighResPhotoUrl(photo),
      profileUrl: item.url || "",
      chamber,
    };
  });

  cache[chamber] = {
    data: members,
    timestamp: now,
  };

  return members;
}

/**
 * Busca la mejor coincidencia para un legislador de VotaBien dentro del dataset oficial.
 * Soporta orden de nombres, slugs y similitud de tokens.
 */
export function findBestCongresoMatch(
  queryFullname: string,
  candidates: CongresoMember[],
): MatchResult | null {
  const normQuery = normalizeString(queryFullname);
  if (!normQuery) return null;

  const querySlug = slugify(queryFullname);
  const queryTokens = new Set(normQuery.split(" ").filter((t) => t.length > 1));

  let bestMatch: MatchResult | null = null;

  for (const candidate of candidates) {
    const normInverted = normalizeString(candidate.invertedName);
    const normDirect = normalizeString(candidate.directName);

    // 1. Coincidencia exacta invertida (Nombres Apellidos)
    if (normQuery === normInverted) {
      return {
        member: candidate,
        score: 1.0,
        matchType: "exact_inverted",
      };
    }

    // 2. Coincidencia exacta directa (Apellidos Nombres)
    if (normQuery === normDirect) {
      return {
        member: candidate,
        score: 0.98,
        matchType: "exact_direct",
      };
    }

    // 3. Coincidencia por Slug exacto
    if (querySlug === candidate.slug) {
      return {
        member: candidate,
        score: 0.95,
        matchType: "slug",
      };
    }

    // 4. Similitud de tokens (Jaccard / Token Overlap)
    const candidateTokens = new Set(
      normInverted.split(" ").filter((t) => t.length > 1),
    );

    let intersectionCount = 0;
    for (const token of queryTokens) {
      if (candidateTokens.has(token)) {
        intersectionCount++;
      }
    }

    const unionSize = new Set([...queryTokens, ...candidateTokens]).size;
    const jaccardScore = unionSize > 0 ? intersectionCount / unionSize : 0;

    // Si los tokens coinciden en más del 70% o si todos los tokens del query están presentes
    const subsetScore =
      queryTokens.size > 0 ? intersectionCount / queryTokens.size : 0;
    const effectiveScore = Math.max(jaccardScore, subsetScore * 0.85);

    if (effectiveScore >= 0.75) {
      if (!bestMatch || effectiveScore > bestMatch.score) {
        bestMatch = {
          member: candidate,
          score: effectiveScore,
          matchType: "token_overlap",
        };
      }
    }
  }

  return bestMatch;
}
