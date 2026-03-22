import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { getSortingStateParser } from "@/lib/parsers";
import { AdminPerson } from "@/interfaces/person";
import { z } from "zod";

const workExperienceSchema = z.object({
  position: z.string(),
  organization: z.string(),
  period: z.string(),
});

const technicalEducationSchema = z.object({
  graduate_school: z.string(),
  career: z.string(),
  concluded: z.string(),
});

const noUniversityEducationSchema = z.object({
  graduate_school: z.string(),
  career: z.string(),
  concluded: z.string(),
});

const universityEducationSchema = z.object({
  university: z.string(),
  degree: z.string(),
  concluded: z.string(),
  year_of_completion: z.string(),
});

const postgraduateEducationSchema = z.object({
  graduate_school: z.string(),
  specialization: z.string(),
  concluded: z.string(),
  degree: z.string(),
  year_of_completion: z.string(),
});

const politicalRoleSchema = z.object({
  political_organization: z.string(),
  position: z.string(),
  period: z.string(),
});

const popularElectionSchema = z.object({
  political_organization: z.string(),
  position: z.string(),
  period: z.string(),
});

const incomesSchema = z.object({
  public_income: z.string(),
  private_income: z.string(),
  total_income: z.string(),
});

const assetsSchema = z.object({
  type: z.string(),
  description: z.string(),
  value: z.string(),
});

export const personSchema = z.object({
  id: z.string(),
  party_number_rop: z.string().nullable(),
  dni: z.string().min(8, "DNI debe tener al menos 8 caracteres"),
  gender: z.string(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastname: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  fullname: z.string(),
  image_url: z.string().nullable(),
  image_candidate_url: z
    .string()
    .min(15, "Requiere url de la imagen del candidato"),
  birth_date: z.string().nullable(),
  place_of_birth: z.string().nullable(),
  profession: z.string().nullable(),
  secondary_school: z.boolean(),
  technical_education: z.array(technicalEducationSchema),
  no_university_education: z.array(noUniversityEducationSchema),
  university_education: z.array(universityEducationSchema),
  postgraduate_education: z.array(postgraduateEducationSchema),
  work_experience: z.array(workExperienceSchema),
  political_role: z.array(politicalRoleSchema),
  popular_election: z.array(popularElectionSchema),
  incomes: z.array(incomesSchema),
  assets: z.array(assetsSchema),
  facebook_url: z.string().nullable(),
  twitter_url: z.string().nullable(),
  instagram_url: z.string().nullable(),
  tiktok_url: z.string().nullable(),
});

export type PersonFormValues = z.infer<typeof personSchema>;

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
