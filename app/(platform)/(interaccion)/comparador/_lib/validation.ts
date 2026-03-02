import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
} from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
  // IDs de candidaturas presidenciales (candidate.id — UUID, no PII)
  ids: parseAsArrayOf(parseAsString).withDefault([]),
  q: parseAsString.withDefault(""),
  parties: parseAsArrayOf(parseAsString).withDefault([]),
});

export type ComparatorParamsSchema = {
  ids: string[];
  q: string;
  parties: string[];
};
