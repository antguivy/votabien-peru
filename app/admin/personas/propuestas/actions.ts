"use server";

import { prisma } from "@/lib/prisma";
import { serverRequireAdmin } from "@/lib/auth-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function rejectResearchProposal(proposalId: string) {
  await serverRequireAdmin();

  await prisma.research_proposals.update({
    where: { id: proposalId },
    data: { status: "REJECTED", reviewed_at: new Date() },
  });

  revalidatePath("/admin/personas/propuestas");
}

export async function applyResearchProposal(proposalId: string) {
  await serverRequireAdmin();

  const proposal = await prisma.research_proposals.findUnique({
    where: { id: proposalId },
  });

  if (!proposal || proposal.status !== "PENDING") {
    throw new Error("Propuesta no válida o ya procesada.");
  }

  const data = proposal.proposed_data as any;

  // Apply logic (same as webhook)
  if (proposal.action === "INSERT") {
    if (
      data.type &&
      ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(data.type)
    ) {
      await prisma.background.create({
        data: {
          id: crypto.randomUUID(),
          person_id: proposal.person_id,
          publication_date: data.publication_date || null,
          type: data.type,
          status: data.status,
          summary: data.summary,
          sanction: data.sanction || null,
          source: data.source || "Web",
          source_url: data.source_url || null,
          title: data.title || "Hallazgo Web",
        },
      });
    } else {
      const person = await prisma.person.findUnique({
        where: { id: proposal.person_id },
      });
      if (person) {
        const bio = (person.posturas as any[]) || [];
        bio.push(data);
        await prisma.person.update({
          where: { id: proposal.person_id },
          data: { posturas: bio },
        });
      }
    }
  } else if (proposal.action === "UPDATE" && proposal.target_id) {
    if (
      data.type &&
      ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(data.type)
    ) {
      const existing = await prisma.background.findUnique({
        where: { id: proposal.target_id },
      });
      if (existing) {
        await prisma.background.update({
          where: { id: proposal.target_id },
          data: {
            publication_date:
              data.publication_date || existing.publication_date,
            status: data.status,
            summary: data.summary,
            sanction: data.sanction,
            source: data.source || existing.source,
            source_url: data.source_url || existing.source_url,
            title: data.title || existing.title,
            previous_version: existing as any,
          },
        });
      }
    } else {
      const person = await prisma.person.findUnique({
        where: { id: proposal.person_id },
      });
      if (person) {
        let bio = (person.posturas as any[]) || [];
        const index = bio.findIndex((b: any) => b.id === proposal.target_id);
        if (index >= 0) {
          bio[index] = { ...bio[index], ...data };
          await prisma.person.update({
            where: { id: proposal.person_id },
            data: { posturas: bio },
          });
        }
      }
    }
  }

  await prisma.research_proposals.update({
    where: { id: proposalId },
    data: { status: "APPROVED", reviewed_at: new Date() },
  });

  revalidatePath("/admin/personas/propuestas");
}
