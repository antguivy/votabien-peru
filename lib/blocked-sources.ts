const BLOCKED_SOURCE_URLS_EXACT = new Set([
  "https://congrezoo.pe/fauna-electoral/2026/02/10/elecciones-2026-postulantes-condicion-de-deudores-alimentarios-morosos/",
  "https://congrezoo.pe/fauna-electoral/2026/01/11/podemos-fuerza-popular-app-peru-libre-mayor-numero-candidatos-con-sentencias-penales/",
  "https://congrezoo.pe/fauna-electoral/2026/01/18/elecciones-2026-lista-de-candidatos-con-sentencias-por-alimentos/",
]);

const BLOCKED_SOURCE_URL_PREFIXES = [
  "https://checabien.com/",
  "https://revisatucandidato.pe/",
  "https://votoinformado.jne.gob.pe/",
  "https://candidatos.pe/",
];

export const isBlockedSourceUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  if (BLOCKED_SOURCE_URLS_EXACT.has(trimmed)) return true;
  return BLOCKED_SOURCE_URL_PREFIXES.some((prefix) =>
    trimmed.startsWith(prefix),
  );
};
