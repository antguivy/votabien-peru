import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function normalizeAggressive(name: string): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[,.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const secretKey = process.env.API_SECRET_KEY;

    if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const legislators = await prisma.legislator.findMany({
      include: {
        person: {
          select: {
            fullname: true,
            name: true,
            lastname: true,
          },
        },
      },
    });

    const legislatorsMap: Record<string, string> = {};
    for (const leg of legislators) {
      if (leg.person?.fullname) {
        legislatorsMap[normalizeAggressive(leg.person.fullname)] = leg.id;
      }
      if (leg.person?.lastname && leg.person?.name) {
        const alt1 = `${leg.person.lastname} ${leg.person.name}`.trim();
        legislatorsMap[normalizeAggressive(alt1)] = leg.id;

        const alt2 = `${leg.person.name} ${leg.person.lastname}`.trim();
        legislatorsMap[normalizeAggressive(alt2)] = leg.id;
      }
    }

    const parliamentaryGroups = await prisma.parliamentarygroup.findMany({
      select: { id: true, name: true },
    });

    const pgMap: Record<string, string> = {};
    for (const pg of parliamentaryGroups) {
      if (pg.name) {
        pgMap[pg.id] = normalizeAggressive(pg.name);
      }
    }

    return NextResponse.json({
      success: true,
      legislators: legislatorsMap,
      parliamentary_groups: pgMap,
    });
  } catch (error) {
    console.error("Error en GET bills caches:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
