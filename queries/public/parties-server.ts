"use server";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";
import { Prisma } from "@/prisma/generated/client";

import prisma from "@/lib/prisma";
import { PoliticalPartyBase } from "@/interfaces/political-party";

interface GetPartidosSelectorParams {
  active?: boolean;
}

export const getPartidosSelectorList = cache(
  unstable_cache(
    async (
      params: GetPartidosSelectorParams = {},
    ): Promise<PoliticalPartyBase[]> => {
      const { active } = params;

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

        const whereClause: Prisma.politicalpartyWhereInput = {};

        if (active !== undefined) {
          whereClause.active = active;
        }

        if (hiddenPartyIds.length > 0) {
          whereClause.id = { notIn: hiddenPartyIds };
        }

        const data = await prisma.politicalparty.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            acronym: true,
            logo_url: true,
            color_hex: true,
            active: true,
            foundation_date: true,
          },
          orderBy: { name: "asc" },
        });

        return data as unknown as PoliticalPartyBase[];
      } catch (error) {
        console.error("Error en getPartidosSelectorList:", error);
        throw error;
      }
    },
    ["partidos-selector-list"],
    { tags: [TAGS.parties] },
  ),
);
