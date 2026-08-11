"use server";

import { unstable_noStore as noStore } from "next/cache";
import type { GetPersonSchema, PersonFormValues } from "./validation";
import { prisma } from "@/lib/prisma";
import { PaginatedPersonResponse, PersonResponse } from "./types";
import { AdminPerson, BiographyDetail } from "@/interfaces/person";

export async function getPersonList(
  input: GetPersonSchema,
): Promise<PaginatedPersonResponse> {
  noStore(); // <-- BIEN: La lista siempre fresca

  try {
    const page = input.page || 1;
    const pageSize = input.perPage || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};
    if (input.fullname) {
      where.fullname = { contains: input.fullname, mode: "insensitive" };
    }

    const orderBy: Record<string, unknown> = {};
    if (input.sort && input.sort.length > 0) {
      const sortItem = input.sort[0];
      orderBy[sortItem.id] = sortItem.desc ? "desc" : "asc";
    } else {
      orderBy.created_at = "desc";
    }

    const [data, count] = await Promise.all([
      prisma.person.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          fullname: true,
          dni: true,
          birth_date: true,
          place_of_birth: true,
          profession: true,
          gender: true,
        },
      }),
      prisma.person.count({ where }),
    ]);

    const typedData = data as unknown as PersonResponse[];

    return {
      data: typedData.map((party) => ({
        ...party,
      })) as AdminPerson[],
      total: count,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error("Error fetching person:", error);
    throw new Error("Failed to fetch person");
  }
}

export async function getPersonForEdit(
  id: string,
): Promise<PersonFormValues | null> {
  noStore(); // <-- CRÍTICO: Agregado para no cargar un formulario con datos viejos

  const data = await prisma.person.findUnique({
    where: { id },
    select: {
      id: true,
      fullname: true,
      name: true,
      lastname: true,
      dni: true,
      gender: true,
      party_number_rop: true,
      image_url: true,
      image_candidate_url: true,
      birth_date: true,
      place_of_birth: true,
      profession: true,
      secondary_school: true,
      technical_education: true,
      no_university_education: true,
      university_education: true,
      postgraduate_education: true,
      work_experience: true,
      political_role: true,
      popular_election: true,
      incomes: true,
      assets: true,
      facebook_url: true,
      twitter_url: true,
      instagram_url: true,
      tiktok_url: true,
    },
  });

  if (!data) return null;

  return {
    id: data.id,
    party_number_rop: data.party_number_rop ?? null,
    dni: data.dni ?? "",
    gender: data.gender ?? "",
    name: data.name ?? "",
    lastname: data.lastname ?? "",
    fullname: data.fullname ?? "",
    image_url: data.image_url ?? null,
    image_candidate_url: data.image_candidate_url ?? "",
    birth_date: data.birth_date
      ? new Date(data.birth_date).toISOString()
      : null, // keep type match
    place_of_birth: data.place_of_birth ?? null,
    profession: data.profession ?? null,
    secondary_school: data.secondary_school ?? false,
    technical_education:
      (data.technical_education as unknown as PersonFormValues["technical_education"]) ??
      [],
    no_university_education:
      (data.no_university_education as unknown as PersonFormValues["no_university_education"]) ??
      [],
    university_education:
      (data.university_education as unknown as PersonFormValues["university_education"]) ??
      [],
    postgraduate_education:
      (data.postgraduate_education as unknown as PersonFormValues["postgraduate_education"]) ??
      [],
    work_experience:
      (data.work_experience as unknown as PersonFormValues["work_experience"]) ??
      [],
    political_role:
      (data.political_role as unknown as PersonFormValues["political_role"]) ??
      [],
    popular_election:
      (data.popular_election as unknown as PersonFormValues["popular_election"]) ??
      [],
    incomes: (data.incomes as unknown as PersonFormValues["incomes"]) ?? [],
    assets: (data.assets as unknown as PersonFormValues["assets"]) ?? [],
    facebook_url: data.facebook_url ?? null,
    twitter_url: data.twitter_url ?? null,
    instagram_url: data.instagram_url ?? null,
    tiktok_url: data.tiktok_url ?? null,
  };
}

export async function getPersonBiography(id: string): Promise<{
  id: string;
  fullname: string;
  posturas: BiographyDetail[];
} | null> {
  noStore(); // <-- AGREGADO: Para cuando edites la biografía
  const data = await prisma.person.findUnique({
    where: { id },
    select: { id: true, fullname: true, posturas: true },
  });

  if (!data) return null;

  return {
    id: data.id,
    fullname: data.fullname || "",
    posturas: (data.posturas as unknown as BiographyDetail[]) ?? [],
  };
}

export async function getPersonBackgrounds(id: string) {
  noStore(); // <-- AGREGADO: Para cuando revises los antecedentes penales/judiciales
  const data = await prisma.person.findUnique({
    where: { id },
    select: {
      id: true,
      fullname: true,
      party_number_rop: true,
      dni: true,
      background: true,
    },
  });

  if (!data) return null;
  return {
    ...data,

    backgrounds: data.background.map((bg) => ({
      ...bg,
      publication_date: bg.publication_date,
      created_at: bg.created_at?.toISOString(),
      updated_at: bg.updated_at?.toISOString(),
    })),
  };
}
