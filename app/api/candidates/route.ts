import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyFilters } from "@/lib/candidate-filters";

export const dynamic = "force-dynamic";

const CATEGORY_CAPS: Record<string, number> = {
  presidente: 30,
  senador_nacional: 60,
  senador_regional: 20,
};

function parseFilterInt(val: string | null): number | null {
  if (!val) return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

function parseFilterBool(val: string | null): boolean | null {
  if (val === "true") return true;
  if (val === "false") return false;
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Filters
    const electoral_district_id = searchParams.get("electoral_district_id");
    if (!electoral_district_id) {
      return NextResponse.json(
        { detail: "electoral_district_id is required" },
        { status: 400 },
      );
    }

    const excluded_party_ids = searchParams.getAll("excluded_party_ids");
    const filters = {
      electoral_district_id,
      legal_record_preference: searchParams.get("legal_record_preference"),
      education_level: parseFilterInt(searchParams.get("education_level")),
      is_incumbent: parseFilterBool(searchParams.get("is_incumbent")),
      financial_transparency: searchParams.get("financial_transparency"),
      min_work_experiences: parseFilterInt(
        searchParams.get("min_work_experiences"),
      ),
      has_electoral_experience: parseFilterBool(
        searchParams.get("has_electoral_experience"),
      ),
      min_age: parseFilterInt(searchParams.get("min_age")),
      max_age: parseFilterInt(searchParams.get("max_age")),
      born_in_district: parseFilterBool(searchParams.get("born_in_district")),
      reinfo_clean: parseFilterBool(searchParams.get("reinfo_clean")),
      rnas_filter: searchParams.get("rnas_filter"),
    };

    type CandidateData = {
      id: string;
      person_id: string;
      active: boolean;
      political_party_id: string;
      electoral_district_id: string;
      type: string;
      list_number: number | null;
      status: string;
      position_category: string;
      person: {
        id: string;
        name: string;
        lastname: string;
        fullname: string;
        gender: string | null;
        dni: string | null;
        image_candidate_url: string | null;
        birth_date: Date | null;
        place_of_birth: string | null;
        backgrounds: { type: string; title: string; summary: string | null }[];
      };
      political_party: unknown;
      electoral_district: unknown;
    };

    const groupedResults: Record<string, CandidateData[]> = {
      presidente: [],
      senador_nacional: [],
      senador_regional: [],
    };

    const fetchAndProcess = async (
      typeStr: string,
      categoryKey: string,
      positionCategory: string,
      extraWhere: Record<string, unknown> = {},
    ) => {
      const whereClause: Record<string, unknown> = {
        type: typeStr,
        active: true,
        ...extraWhere,
      };

      if (excluded_party_ids.length > 0) {
        whereClause.political_party_id = { notIn: excluded_party_ids };
      }

      const rawCandidates = await prisma.candidate.findMany({
        where: whereClause,
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

      const processed: CandidateData[] = [];
      for (const item of rawCandidates) {
        if (
          applyFilters(
            item.person,
            filters,
            positionCategory,
            item.electoraldistrict,
          )
        ) {
          processed.push({
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
          });
        }
      }

      // Shuffle Senador Nacional
      if (categoryKey === "senador_nacional") {
        for (let i = processed.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [processed[i], processed[j]] = [processed[j], processed[i]];
        }
      }

      const cap = CATEGORY_CAPS[categoryKey] || 40;
      groupedResults[categoryKey] = processed.slice(0, cap);
    };

    // PRESIDENTE
    await fetchAndProcess("PRESIDENTE", "presidente", "PRESIDENTE");

    // SENADOR NACIONAL
    await fetchAndProcess("SENADOR", "senador_nacional", "SENADOR_NACIONAL", {
      electoraldistrict: { is_national: true },
    });

    // SENADOR REGIONAL
    await fetchAndProcess("SENADOR", "senador_regional", "SENADOR_REGIONAL", {
      electoraldistrict: { is_national: false },
      electoral_district_id: electoral_district_id,
    });

    const countByCategory = {
      presidente: groupedResults.presidente.length,
      senador_nacional: groupedResults.senador_nacional.length,
      senador_regional: groupedResults.senador_regional.length,
    };
    const totalCount =
      countByCategory.presidente +
      countByCategory.senador_nacional +
      countByCategory.senador_regional;

    return NextResponse.json({
      data: groupedResults,
      count: totalCount,
      count_by_category: countByCategory,
    });
  } catch (error) {
    console.error("Error fetching grouped candidates:", error);
    return NextResponse.json(
      { detail: "Error consultando candidatos agrupados" },
      { status: 500 },
    );
  }
}
