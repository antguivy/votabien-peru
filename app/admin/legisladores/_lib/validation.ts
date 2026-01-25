import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { getSortingStateParser } from "@/lib/parsers";
import { ChamberType, LegislatorCondition } from "@/interfaces/politics";
import { AdminLegislator } from "@/interfaces/legislator";

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
  chamber: parseAsArrayOf(
    parseAsStringEnum(Object.values(ChamberType)),
  ).withDefault([]),
  condition: parseAsArrayOf(
    parseAsStringEnum(Object.values(LegislatorCondition)),
  ).withDefault([]),
  //   from: parseAsString.withDefault(""),
  //   to: parseAsString.withDefault(""),
  electoral_district: parseAsArrayOf(parseAsString).withDefault([]),
});

export type GetLegislatorSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
