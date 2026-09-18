import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { getSortingStateParser } from "@/lib/parsers";
import { AdminMotionRow } from "./types";

export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminMotionRow>().withDefault([
    { id: "submission_date", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  period: parseAsArrayOf(parseAsString).withDefault([]),
  chamber: parseAsArrayOf(parseAsString).withDefault([]),
  motion_type: parseAsArrayOf(parseAsString).withDefault([]),
  is_greeting: parseAsString.withDefault(""),
  parliamentary_group: parseAsArrayOf(parseAsString).withDefault([]),
});

export type GetMotionsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
