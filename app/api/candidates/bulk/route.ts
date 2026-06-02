import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ids = body.ids || [];
    if (!ids.length) {
      return NextResponse.json([]);
    }
    if (ids.length > 100) {
      return NextResponse.json(
        { detail: "Máximo 100 IDs por llamada" },
        { status: 400 },
      );
    }

    const items = await prisma.candidate.findMany({
      where: { id: { in: ids } },
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

    const cards = items.map((item) => {
      const cType = item.type;
      const isNational = item.electoraldistrict?.is_national || false;
      let positionCategory = "OTRO";
      if (cType === "PRESIDENTE") positionCategory = "PRESIDENTE";
      if (cType === "SENADOR") {
        positionCategory = isNational ? "SENADOR_NACIONAL" : "SENADOR_REGIONAL";
      }

      return {
        id: item.id,
        person_id: item.person_id,
        active: item.active,
        political_party_id: item.political_party_id,
        electoral_district_id: item.electoral_district_id,
        type: item.type,
        list_number: item.list_number,
        status: item.status,
        position_category: positionCategory,
        person: {
          id: item.person.id,
          name: item.person.name,
          lastname: item.person.lastname,
          fullname: item.person.fullname,
          gender: item.person.gender,
          dni: item.person.dni,
          image_candidate_url: item.person.image_candidate_url,
          birth_date: item.person.birth_date,
          place_of_birth: item.person.place_of_birth,
          backgrounds: item.person.background,
        },
        political_party: item.politicalparty,
        electoral_district: item.electoraldistrict,
      };
    });

    // Sort to respect original ids array order
    const orderMap = new Map<string, number>(
      ids.map((id: string, idx: number) => [id, idx]),
    );
    cards.sort((a, b) => {
      const idxA = orderMap.get(a.id) ?? 9999;
      const idxB = orderMap.get(b.id) ?? 9999;
      return idxA - idxB;
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching bulk candidates:", error);
    return NextResponse.json({ detail: "Error interno" }, { status: 500 });
  }
}
