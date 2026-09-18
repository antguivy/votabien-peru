import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { getSortingStateParser } from "@/lib/parsers";
import { AdminInformationRequestRow } from "./types";

export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminInformationRequestRow>().withDefault([
    { id: "document_date", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  period: parseAsArrayOf(parseAsString).withDefault([]),
  chamber: parseAsArrayOf(parseAsString).withDefault([]),
  target_entity: parseAsString.withDefault(""),
});

export type GetInformationRequestsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
