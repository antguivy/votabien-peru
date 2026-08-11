import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { proposals } = body;

    if (!proposals || !Array.isArray(proposals)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Insert each proposal into the research_proposals table
    const createdProposals = await prisma.$transaction(
      proposals.map((p) =>
        prisma.research_proposals.create({
          data: {
            person_id: p.person_id,
            batch_run_id: p.batch_run_id,
            action: p.action,
            target_id: p.target_id || null,
            reason: p.reason || "",
            confidence: p.confidence || 0.0,
            status: p.status || "PENDING",
            proposed_data: p.proposed_data || {},
          },
        }),
      ),
    );

    // Si status es APPROVED, deberíamos auto-aplicarlos
    for (const prop of createdProposals) {
      if (prop.status === "APPROVED") {
        await applyProposal(prop);
      }
    }

    return NextResponse.json({ success: true, count: createdProposals.length });
  } catch (error: any) {
    console.error("Error in research-proposals webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}

async function applyProposal(proposal: any) {
  const data = proposal.proposed_data;

  if (proposal.action === "INSERT") {
    // Check if it's background or bio (Noticias are bio for now?
    // In original code, background is 'background', bio is 'posturas' on person)
    // We need to differentiate if proposed_data is background or bio
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
      // It's a bio/news entry
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
      // Update bio
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
}
