import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { getSortingStateParser } from "@/lib/parsers";
import { ExecutiveRole } from "@/interfaces/politics";
import { AdminExecutive } from "@/interfaces/executive";
import * as z from "zod";

export const executiveSchema = z.object({
  id: z.string().optional(),
  person_id: z.string().min(1, "Debe seleccionar una persona"),
  role: z.nativeEnum(ExecutiveRole),
  ministry: z.string().nullable().optional(),
  start_date: z.string().min(1, "La fecha de inicio es requerida"),
  end_date: z.string().nullable().optional(),
  end_reason: z.string().nullable().optional(),
  legislative_period_id: z.string().nullable().optional(),
});

export type ExecutiveFormValues = z.infer<typeof executiveSchema>;

export const searchParamsCache = createSearchParamsCache({
  flags: parseAsArrayOf(
    parseAsStringEnum(["advancedTable", "floatingBar"]),
  ).withDefault([]),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminExecutive>().withDefault([
    { id: "created_at", desc: true },
  ]),
  fullname: parseAsString.withDefault(""),
  role: parseAsArrayOf(
    parseAsStringEnum(Object.values(ExecutiveRole)),
  ).withDefault([]),
  legislative_period: parseAsArrayOf(parseAsString).withDefault([]),
});

export type GetExecutiveSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
