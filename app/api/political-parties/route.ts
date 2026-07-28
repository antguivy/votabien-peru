import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alliances = await prisma.alliancecomposition.findMany({
      select: { child_org_id: true },
    });

    const childIds = new Set(
      alliances
        .map((a) => a.child_org_id)
        .filter((id): id is string => id !== null),
    );

    const parties = await prisma.politicalparty.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        acronym: true,
        logo_url: true,
        type: true,
      },
      orderBy: { name: "asc" },
    });

    const visible = parties.filter((p) => !childIds.has(p.id));

    return NextResponse.json({
      data: visible,
      count: visible.length,
    });
  } catch (error) {
    console.error("Error fetching political parties:", error);
    return NextResponse.json(
      { detail: "Error consultando partidos politicos" },
      { status: 500 },
    );
  }
}
