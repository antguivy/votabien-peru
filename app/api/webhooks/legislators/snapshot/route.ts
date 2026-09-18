import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/legislators/snapshot
 * Provee al servicio Python de comparación el snapshot actual de legisladores
 * del periodo activo y las bancadas parlamentarias registradas.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const secretKey = process.env.API_SECRET_KEY;

    if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 1. Obtener legisladores con su membresía activa en bancada
    const rawLegislators = await prisma.legislator.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        chamber: true,
        condition: true,
        active: true,
        institutional_email: true,
        person: {
          select: {
            id: true,
            fullname: true,
            image_url: true,
          },
        },
        parliamentarymembership: {
          where: { end_date: null },
          select: {
            parliamentary_group_id: true,
            parliamentarygroup: {
              select: {
                id: true,
                name: true,
                acronym: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    // 2. Obtener todos los grupos parlamentarios
    const parliamentaryGroups = await prisma.parliamentarygroup.findMany({
      select: {
        id: true,
        name: true,
        acronym: true,
        color_hex: true,
        active: true,
      },
      orderBy: { name: "asc" },
    });

    const legislators = rawLegislators.map((leg) => {
      const activeMembership = leg.parliamentarymembership[0];
      return {
        id: leg.id,
        person_id: leg.person.id,
        fullname: leg.person.fullname,
        chamber: leg.chamber,
        condition: leg.condition,
        active: leg.active,
        current_group_id: activeMembership?.parliamentary_group_id || null,
        current_group_name: activeMembership?.parliamentarygroup?.name || null,
        current_group_acronym:
          activeMembership?.parliamentarygroup?.acronym || null,
        institutional_email: leg.institutional_email,
        photo_url: leg.person.image_url,
      };
    });

    return NextResponse.json({
      success: true,
      total_legislators: legislators.length,
      total_groups: parliamentaryGroups.length,
      legislators,
      parliamentary_groups: parliamentaryGroups,
    });
  } catch (error) {
    console.error("Error en GET webhooks/legislators/snapshot:", error);
    return NextResponse.json(
      { error: "Error interno obteniendo snapshot de legisladores" },
      { status: 500 },
    );
  }
}
