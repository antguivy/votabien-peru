import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { getSortingStateParser } from "@/lib/parsers";
import { AdminLegislator } from "@/interfaces/legislator";
import { CandidacyStatus, CandidacyType } from "@/interfaces/candidate";

export const searchParamsCache = createSearchParamsCache({
  flags: parseAsArrayOf(
    parseAsStringEnum(["advancedTable", "floatingBar"]),
  ).withDefault([]),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminLegislator>().withDefault([
    { id: "created_at", desc: true },
  ]),
  fullname: parseAsString.withDefault(""),
  type: parseAsArrayOf(
    parseAsStringEnum(Object.values(CandidacyType)),
  ).withDefault([]),
  status: parseAsArrayOf(
    parseAsStringEnum(Object.values(CandidacyStatus)),
  ).withDefault([]),
  parties: parseAsArrayOf(parseAsString).withDefault([]),
  // district: parseAsArrayOf(parseAsString).withDefault([]),
});

export type GetCandidateSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
