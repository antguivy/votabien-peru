"use server";

import { unstable_noStore as noStore } from "next/cache";
import type { GetPersonSchema, PersonFormValues } from "./validation";
import { createClient } from "@/lib/supabase/server";
import { PaginatedPersonResponse, PersonResponse } from "./types";
import { AdminPerson, BiographyDetail } from "@/interfaces/person";

export async function getPersonList(
  input: GetPersonSchema,
): Promise<PaginatedPersonResponse> {
  noStore();
  const supabase = await createClient();

  try {
    let query = supabase.from("person").select(
      `
    id,
    fullname,
    dni,
    birth_date,
    place_of_birth,
    profession,
    gender
  `,
      { count: "exact" },
    );

    if (input.fullname) {
      query = query.ilike("fullname", `%${input.fullname}%`);
    }

    // Orden
    if (input.sort && input.sort.length > 0) {
      const sortItem = input.sort[0];

      query = query.order(sortItem.id, {
        ascending: !sortItem.desc,
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const page = input.page || 1;
    const pageSize = input.perPage || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const typedData = (data || []) as unknown as PersonResponse[];

    return {
      data: typedData.map((party) => ({
        ...party,
      })) as AdminPerson[],
      total: count || 0,
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("person")
    .select(
      `
      id, fullname, name, lastname, dni, gender, party_number_rop,
      image_url, image_candidate_url, birth_date, place_of_birth, profession,
      secondary_school, technical_education, no_university_education,
      university_education, postgraduate_education, work_experience,
      political_role, popular_election, incomes, assets,
      facebook_url, twitter_url, instagram_url, tiktok_url
    `,
    )
    .eq("id", id)
    .single();

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
    birth_date: data.birth_date ?? null,
    place_of_birth: data.place_of_birth ?? null,
    profession: data.profession ?? null,
    secondary_school: data.secondary_school ?? false,
    technical_education:
      (data.technical_education as PersonFormValues["technical_education"]) ??
      [],
    no_university_education:
      (data.no_university_education as PersonFormValues["no_university_education"]) ??
      [],
    university_education:
      (data.university_education as PersonFormValues["university_education"]) ??
      [],
    postgraduate_education:
      (data.postgraduate_education as PersonFormValues["postgraduate_education"]) ??
      [],
    work_experience:
      (data.work_experience as PersonFormValues["work_experience"]) ?? [],
    political_role:
      (data.political_role as PersonFormValues["political_role"]) ?? [],
    popular_election:
      (data.popular_election as PersonFormValues["popular_election"]) ?? [],
    incomes: (data.incomes as PersonFormValues["incomes"]) ?? [],
    assets: (data.assets as PersonFormValues["assets"]) ?? [],
    facebook_url: data.facebook_url ?? null,
    twitter_url: data.twitter_url ?? null,
    instagram_url: data.instagram_url ?? null,
    tiktok_url: data.tiktok_url ?? null,
  };
}

export async function getPersonBiography(id: string): Promise<{
  id: string;
  fullname: string;
  detailed_biography: BiographyDetail[];
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("person")
    .select("id, fullname, detailed_biography")
    .eq("id", id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    fullname: data.fullname,
    detailed_biography:
      (data.detailed_biography as unknown as BiographyDetail[]) ?? [],
  };
}

export async function getPersonBackgrounds(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("person")
    .select(
      `
      id, fullname, party_number_rop, dni,
      backgrounds:background(*)
    `,
    )
    .eq("id", id)
    .single();

  if (!data) return null;
  return data;
}
