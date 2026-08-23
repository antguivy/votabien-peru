import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { BillBasic } from "@/interfaces/bill";

export const getPreviousPeriodApprovedBills = cache(
  unstable_cache(
    async (
      personId: string,
      currentLegislatorId: string,
    ): Promise<BillBasic[]> => {
      try {
        const currentLegislator = await prisma.legislator.findUnique({
          where: { id: currentLegislatorId },
          select: { legislative_period_id: true },
        });

        if (!currentLegislator?.legislative_period_id) return [];

        const previousLegislator = await prisma.legislator.findFirst({
          where: {
            person_id: personId,
            id: { not: currentLegislatorId },
          },
          include: {
            legislativeperiod: true,
          },
          orderBy: {
            start_date: "desc",
          },
        });

        if (!previousLegislator) return [];

        const bills = await prisma.bill.findMany({
          where: {
            legislator_id: previousLegislator.id,
            approval_status: "PUBLICADO",
          },
          orderBy: { submission_date: "desc" },
        });

        return bills.map((b) => ({
          id: b.id,
          number: b.number,
          title: b.title ?? "",
          title_ai: b.title_ai,
          submission_date: b.submission_date.toISOString(),
          approval_status: b.approval_status,
          approval_date: b.approval_date?.toISOString() ?? null,
          document_url: b.document_url,
          status_group: "",
          summary: b.summary,
          legislative_session: b.legislative_session,
          committees: b.committees?.split(",").map((c) => c.trim()) ?? [],
          coauthors: b.coauthors,
        })) as unknown as BillBasic[];
      } catch (error) {
        console.error("Error fetching previous period bills:", error);
        return [];
      }
    },
    ["previous-period-approved-bills"],
    { tags: [TAGS.legislators] },
  ),
);
