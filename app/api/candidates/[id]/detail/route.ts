import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const item = await prisma.candidate.findUnique({
      where: { id },
      include: {
        person: {
          include: {
            background: true,
          },
        },
        politicalparty: {
          select: { id: true, name: true, acronym: true, logo_url: true },
        },
        electoraldistrict: {
          select: { id: true, name: true, code: true, is_national: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { detail: "Candidato no encontrado" },
        { status: 404 },
      );
    }

    const cType = item.type;
    const isNational = item.electoraldistrict?.is_national || false;
    let positionCategory = "OTRO";
    if (cType === "PRESIDENTE") positionCategory = "PRESIDENTE";
    if (cType === "SENADOR") {
      positionCategory = isNational ? "SENADOR_NACIONAL" : "SENADOR_REGIONAL";
    }

    const ensureArray = (val: unknown) => (Array.isArray(val) ? val : []);

    const personWithBackground = {
      id: item.person.id,
      name: item.person.name,
      lastname: item.person.lastname,
      fullname: item.person.fullname,
      gender: item.person.gender,
      dni: item.person.dni,
      image_candidate_url: item.person.image_candidate_url,
      birth_date: item.person.birth_date,
      place_of_birth: item.person.place_of_birth,
      detailed_biography: ensureArray(item.person.detailed_biography),
      technical_education: ensureArray(item.person.technical_education),
      no_university_education: ensureArray(item.person.no_university_education),
      university_education: ensureArray(item.person.university_education),
      postgraduate_education: ensureArray(item.person.postgraduate_education),
      work_experience: ensureArray(item.person.work_experience),
      political_role: ensureArray(item.person.political_role),
      popular_election: ensureArray(item.person.popular_election),
      incomes: ensureArray(item.person.incomes),
      assets: ensureArray(item.person.assets),
      backgrounds: item.person.background,
    };

    const detail = {
      id: item.id,
      person_id: item.person_id,
      active: item.active,
      political_party_id: item.political_party_id,
      electoral_district_id: item.electoral_district_id,
      type: item.type,
      list_number: item.list_number,
      status: item.status,
      position_category: positionCategory,
      person: personWithBackground,
      political_party: item.politicalparty,
      electoral_district: item.electoraldistrict,
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Error fetching candidate detail:", error);
    return NextResponse.json({ detail: "Error interno" }, { status: 500 });
  }
}
