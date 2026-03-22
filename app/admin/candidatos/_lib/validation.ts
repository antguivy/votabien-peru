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
import * as z from "zod";

export const candidateSchema = z.object({
  id: z.string().optional(),
  person_id: z.string().min(1, "Debe seleccionar una persona"),
  type: z.enum(CandidacyType),
  status: z.enum(CandidacyStatus),
  political_party_id: z.string().min(1, "Seleccione un partido"),
  electoral_district_id: z.string(),
  electoral_process_id: z.string().min(1, "Seleccione proceso electoral"),
  list_number: z.number().min(1, "El número de lista es obligatorio"),
  active: z.boolean().optional(),
});

export type CandidateFormValues = z.infer<typeof candidateSchema>;

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
