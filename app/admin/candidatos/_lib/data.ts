"use server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CandidateFormValues, GetCandidateSchema } from "./validation";
import {
  PaginatedCandidatesResponse,
  PartyCounts,
  StatusCounts,
  TypeCounts,
} from "./types";
import {
  AdminCandidate,
  CandidacyStatus,
  CandidacyType,
} from "@/interfaces/candidate";
import { PersonBasicInfo } from "@/interfaces/person";

export async function getCandidates(
  input: GetCandidateSchema,
): Promise<PaginatedCandidatesResponse> {
  noStore();

  try {
    const page = input.page || 1;
    const pageSize = input.perPage || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};

    if (input.fullname) {
      where.person = {
        fullname: { contains: input.fullname, mode: "insensitive" },
      };
    }
    if (input.type && input.type.length > 0) {
      where.type = { in: input.type };
    }
    if (input.status && input.status.length > 0) {
      where.status = { in: input.status };
    }
    if (input.parties && input.parties.length > 0) {
      where.politicalparty = {
        name: { in: input.parties },
      };
    }

    where.electoralprocess = { active: true };

    const orderBy: Record<string, unknown> = {};
    if (input.sort && input.sort.length > 0) {
      const sortItem = input.sort[0];
      if (sortItem.id === "fullname") {
        // Prisma cannot sort by nested relation in a generic way easily like this without defining exactly
        orderBy.person = { fullname: sortItem.desc ? "desc" : "asc" };
      } else {
        orderBy[sortItem.id] = sortItem.desc ? "desc" : "asc";
      }
    } else {
      orderBy.created_at = "desc";
    }

    const [data, count] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          person: {
            select: {
              id: true,
              fullname: true,
              image_url: true,
              image_candidate_url: true,
              profession: true,
              dni: true,
            },
          },
          politicalparty: {
            select: {
              id: true,
              name: true,
              color_hex: true,
              acronym: true,
              logo_url: true,
              active: true,
              foundation_date: true,
            },
          },
          electoraldistrict: {
            select: {
              id: true,
              name: true,
              code: true,
              is_national: true,
              active: true,
            },
          },
          electoralprocess: true,
        },
      }),
      prisma.candidate.count({ where }),
    ]);

    // Map Prisma result to match the expected interface mapping

    const mappedData = data.map((row) => ({
      id: row.id,
      person_id: row.person_id,
      fullname: row.person?.fullname || "Sin nombre",
      political_party_id: row.political_party_id,
      electoral_district_id: row.electoral_district_id,
      type: row.type as CandidacyType,
      status: row.status as CandidacyStatus,
      electoral_process_id: row.electoral_process_id,
      list_number: row.list_number,
      active: row.active,
      created_at: row.created_at.toISOString(),

      person: row.person,
      electoral_process: row.electoralprocess
        ? {
            ...row.electoralprocess,
            election_date: row.electoralprocess.election_date.toISOString(),
          }
        : null,
      political_party: row.politicalparty, // Map prisma's lowercase relation name
      electoral_district: row.electoraldistrict, // Map prisma's lowercase relation name
    }));

    return {
      data: mappedData as AdminCandidate[],
      total: count,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw new Error("Failed to fetch candidates");
  }
}

export async function getCandidacyTypeCounts(): Promise<TypeCounts> {
  noStore();
  try {
    const data = await prisma.candidate.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    return data.reduce<TypeCounts>((acc, curr) => {
      const key = curr.type;
      if (key) acc[key] = curr._count.type;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error candidacy type counts:", error);
    return {};
  }
}

export async function getCandidacyStatusCounts(): Promise<StatusCounts> {
  noStore();
  try {
    const data = await prisma.candidate.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    return data.reduce<StatusCounts>((acc, curr) => {
      const key = curr.status;
      if (key) acc[key] = curr._count.status;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error candidacy status counts:", error);
    return {};
  }
}

export async function getPartiesCounts(): Promise<PartyCounts> {
  noStore();

  try {
    const activeProcess = await prisma.electoralprocess.findFirst({
      where: { active: true },
      select: { id: true },
    });

    let hiddenPartyIds: string[] = [];

    if (activeProcess) {
      const allianceMembers = await prisma.alliancecomposition.findMany({
        where: { process_id: activeProcess.id },
        select: { child_org_id: true },
      });

      if (allianceMembers && allianceMembers.length > 0) {
        hiddenPartyIds = allianceMembers
          .map((m) => m.child_org_id)
          .filter((id): id is string => id !== null);
      }
    }

    const parties = await prisma.politicalparty.findMany({
      where: {
        active: true,
        ...(hiddenPartyIds.length > 0 && {
          id: { notIn: hiddenPartyIds },
        }),
      },
      select: {
        id: true,
        name: true,
        active: true,
        _count: {
          select: { candidate: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const counts: PartyCounts = {};
    parties.forEach((party) => {
      counts[party.id] = {
        name: party.name,
        count: party._count.candidate,
      };
    });

    return counts;
  } catch (error) {
    console.error("Error parties counts:", error);
    return {};
  }
}

type CandidateForEdit = CandidateFormValues & {
  person: PersonBasicInfo | null;
};

export async function getCandidateForEdit(
  id: string,
): Promise<CandidateForEdit | null> {
  noStore();

  const data = await prisma.candidate.findUnique({
    where: { id },
    select: {
      id: true,
      person_id: true,
      political_party_id: true,
      electoral_district_id: true,
      electoral_process_id: true,
      type: true,
      list_number: true,
      status: true,
      active: true,
      person: {
        select: {
          id: true,
          fullname: true,
          image_candidate_url: true,
          profession: true,
        },
      },
    },
  });

  if (!data) return null;

  return {
    id: data.id,
    person_id: data.person_id ?? "",
    type: data.type as CandidacyType,
    status: data.status as CandidacyStatus,
    political_party_id: data.political_party_id ?? "",
    electoral_district_id: data.electoral_district_id ?? "",
    electoral_process_id: data.electoral_process_id ?? "",
    list_number: data.list_number ?? 0,
    active: data.active ?? true,
    person: data.person as PersonBasicInfo | null,
  };
}
