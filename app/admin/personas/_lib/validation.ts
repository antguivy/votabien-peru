import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { getSortingStateParser } from "@/lib/parsers";
import { AdminPerson } from "@/interfaces/person";

export const searchParamsCache = createSearchParamsCache({
  flags: parseAsArrayOf(
    parseAsStringEnum(["advancedTable", "floatingBar"]),
  ).withDefault([]),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminPerson>().withDefault([
    { id: "created_at", desc: true },
  ]),
  fullname: parseAsString.withDefault(""),
});

export type GetPersonSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
