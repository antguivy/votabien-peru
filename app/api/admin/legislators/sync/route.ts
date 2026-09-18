import { NextRequest, NextResponse } from "next/server";
import { serverRequireEditor } from "@/lib/auth-actions";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PYTHON_SERVICE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.PYTHON_SERVICE_URL ||
  "http://localhost:8000";

export async function POST(request: NextRequest) {
  const { user } = await serverRequireEditor();

  try {
    const body = await request.json().catch(() => ({}));
    const autoApply = Boolean(body.auto_apply);

    // 1. Obtener snapshot fresco directo de Prisma para enviárselo a FastAPI
    const rawLegislators = await prisma.legislator.findMany({
      where: { active: true },
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

    const secretKey = process.env.API_SECRET_KEY || "";

    let pyResponse: Response;
    try {
      pyResponse = await fetch(
        `${PYTHON_SERVICE_URL}/api/v1/legislators/sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            "X-User-Id": user.id,
            "X-User-Role": user.role,
          },
          body: JSON.stringify({
            snapshot: {
              legislators,
              parliamentary_groups: parliamentaryGroups,
            },
            auto_apply: autoApply,
          }),
        },
      );
    } catch (connErr: unknown) {
      console.error(
        "No se pudo conectar con el servicio Python de legisladores:",
        connErr,
      );
      return NextResponse.json(
        {
          error:
            "No se pudo conectar con el servicio de legisladores (" +
            PYTHON_SERVICE_URL +
            "). Verifica que el servicio esté ejecutándose localmente.",
        },
        { status: 503 },
      );
    }

    if (!pyResponse.ok) {
      const err = await pyResponse.text();
      return NextResponse.json(
        { error: `Error en servicio de legisladores: ${err}` },
        { status: pyResponse.status },
      );
    }

    if (!pyResponse.body) {
      return NextResponse.json(
        { error: "No se recibió flujo de respuesta del servicio" },
        { status: 500 },
      );
    }

    return new Response(pyResponse.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error en proxy de sync legislators:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
