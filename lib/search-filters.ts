import { Prisma } from "@/prisma/generated/client";

export interface SearchToken {
  normalized: string;
  raw?: string;
}

export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u0302\u0304-\u036f]/g, "")
    .normalize("NFC")
    .trim();
}

export function parseSearchTokens(search: string): SearchToken[] {
  const rawWords = search
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  return rawWords.map((raw) => {
    const normalized = normalizeSearchTerm(raw);
    const rawLower = raw.toLowerCase();
    return {
      normalized,
      raw: rawLower !== normalized ? rawLower : undefined,
    };
  });
}

/**
 * Builds an optimized Prisma where condition for person searches.
 * - Handles numeric inputs (>= 3 digits) by checking DNI and fullname using GIN indexes.
 * - Handles text inputs by creating an AND intersection across all terms,
 *   supporting any word order (e.g. "Anthony Villazana" or "Villazana Anthony")
 *   and accents (both normalized and raw forms).
 */
export function buildPersonSearchWhere(
  search: string | null | undefined,
): Prisma.personWhereInput | null {
  const trimmedSearch = search?.trim() || "";
  if (!trimmedSearch) return null;

  const isNumeric = /^\d{3,}$/.test(trimmedSearch);
  if (isNumeric) {
    return {
      OR: [
        { dni: { contains: trimmedSearch } },
        { fullname: { contains: trimmedSearch, mode: "insensitive" } },
      ],
    };
  }

  const tokens = parseSearchTokens(trimmedSearch);
  if (tokens.length === 0) return null;

  return {
    AND: tokens.map((token) =>
      token.raw
        ? {
            OR: [
              {
                fullname: {
                  contains: token.normalized,
                  mode: "insensitive",
                },
              },
              {
                fullname: {
                  contains: token.raw,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {
            fullname: {
              contains: token.normalized,
              mode: "insensitive",
            },
          },
    ),
  };
}
