import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import prisma from "@/lib/prisma";
import { TAGS } from "@/lib/cache-tags";
import { legislatorcondition } from "@/prisma/generated/client";
import { executeBatchRecalculateLegislatorMetrics } from "@/lib/services/legislator-metrics";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/legislators/apply
 * Aplica de forma atómica en Prisma las mutaciones detectadas por el pipeline:
 * 1. Creación de nuevas bancadas (parliamentarygroup).
 * 2. Cierre y apertura de membresías parlamentarias (transfuguismo).
 * 3. Actualización de condición institucional y métricas.
 * 4. Actualización de emails y fotos oficiales.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const secretKey = process.env.API_SECRET_KEY;

    if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await request.json();
    const {
      new_parliamentary_groups = [],
      group_changes = [],
      condition_changes = [],
      metadata_updates = [],
    } = payload;

    const results = {
      created_groups: 0,
      applied_group_changes: 0,
      applied_condition_changes: 0,
      applied_metadata_updates: 0,
    };

    await prisma.$transaction(async (tx) => {
      // 1. Crear nuevas bancadas si no existen
      const groupNameToIdMap = new Map<string, string>();

      for (const grp of new_parliamentary_groups) {
        if (!grp.name) continue;
        const existing = await tx.parliamentarygroup.findFirst({
          where: { name: grp.name },
          select: { id: true },
        });

        if (existing) {
          groupNameToIdMap.set(grp.name, existing.id);
        } else {
          const newGroupId = createId();
          await tx.parliamentarygroup.create({
            data: {
              id: newGroupId,
              name: grp.name,
              color_hex: grp.color_hex || "#264460",
              active: true,
            },
          });
          groupNameToIdMap.set(grp.name, newGroupId);
          results.created_groups++;
        }
      }

      // 2. Aplicar cambios de bancada (Transfuguismo)
      for (const change of group_changes) {
        const { legislator_id, new_group_id, new_group_name } = change;
        if (!legislator_id) continue;

        let targetGroupId = new_group_id;
        if (!targetGroupId && new_group_name) {
          targetGroupId = groupNameToIdMap.get(new_group_name);
        }

        if (!targetGroupId) continue;

        // Cerrar membresía activa previa
        await tx.parliamentarymembership.updateMany({
          where: {
            legislator_id,
            end_date: null,
          },
          data: {
            end_date: new Date(),
            change_reason: "CAMBIO_VOLUNTARIO",
            notes:
              "Cierre automático por detección en portal oficial del Congreso",
          },
        });

        // Crear nueva membresía
        await tx.parliamentarymembership.create({
          data: {
            id: createId(),
            legislator_id,
            parliamentary_group_id: targetGroupId,
            start_date: new Date(),
            change_reason: "CAMBIO_VOLUNTARIO",
            notes: "Alta automática sincronizada desde portal oficial",
          },
        });

        results.applied_group_changes++;
      }

      // 3. Aplicar cambios de condición institucional (preservando active = true)
      for (const cond of condition_changes) {
        const { legislator_id, new_condition } = cond;
        if (!legislator_id || !new_condition) continue;

        const mappedCondition = new_condition as legislatorcondition;
        const isExercising = mappedCondition === "EN_EJERCICIO";

        await tx.legislator.update({
          where: { id: legislator_id },
          data: {
            condition: mappedCondition,
            end_date: isExercising ? null : new Date(),
            // active permanece true para no borrarlo de la lista pública del periodo
          },
        });
        results.applied_condition_changes++;
      }

      // 4. Aplicar metadatos (emails y fotos)
      for (const meta of metadata_updates) {
        const { legislator_id, updates } = meta;
        if (!legislator_id || !updates) continue;

        if (updates.institutional_email) {
          await tx.legislator.update({
            where: { id: legislator_id },
            data: { institutional_email: updates.institutional_email },
          });
        }

        if (updates.photo_url) {
          const leg = await tx.legislator.findUnique({
            where: { id: legislator_id },
            select: {
              person_id: true,
              person: { select: { image_url: true } },
            },
          });
          if (leg && !leg.person.image_url) {
            await tx.person.update({
              where: { id: leg.person_id },
              data: { image_url: updates.photo_url },
            });
          }
        }
        results.applied_metadata_updates++;
      }
    });

    // Recalcular métricas consolidadas (incluyendo transfuguismo real) para los legisladores que cambiaron de bancada
    const changedLegislatorIds: string[] = Array.from(
      new Set(
        (group_changes || [])
          .map((c: { legislator_id: string }) => c.legislator_id)
          .filter(Boolean),
      ),
    );

    if (changedLegislatorIds.length > 0) {
      try {
        await executeBatchRecalculateLegislatorMetrics({
          legislatorIds: changedLegislatorIds,
        });
      } catch (metricsErr) {
        console.error(
          "Error recalculando métricas consolidadas en webhook de apply:",
          metricsErr,
        );
      }
    }

    // Invalida cache público
    try {
      revalidateTag(TAGS.legislators, "max");
    } catch {
      // ignore outside request context
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error en POST webhooks/legislators/apply:", error);
    return NextResponse.json(
      { error: "Error interno aplicando cambios en legisladores" },
      { status: 500 },
    );
  }
}
