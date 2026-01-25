import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsBoolean,
} from "nuqs/server";

import { getSortingStateParser } from "@/lib/parsers";
import { AdminPoliticalParty } from "@/interfaces/party";

export const searchParamsCache = createSearchParamsCache({
  flags: parseAsArrayOf(
    parseAsStringEnum(["advancedTable", "floatingBar"]),
  ).withDefault([]),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminPoliticalParty>().withDefault([
    { id: "created_at", desc: true },
  ]),
  name: parseAsString.withDefault(""),
  active: parseAsBoolean,
});

export type GetPartySchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
