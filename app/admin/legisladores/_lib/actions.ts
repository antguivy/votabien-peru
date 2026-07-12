"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { Prisma, groupchangereason } from "@/prisma/generated/client";
import { BulkUpdateLegislatorsRequest } from "./types";
import {
  CreateLegislatorPeriodRequest,
  UpdateLegislatorPeriodRequest,
} from "@/interfaces/legislator";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChamberType, GroupChangeReason } from "@/interfaces/politics";
import { createId } from "@paralleldrive/cuid2";
import z from "zod";
import { serverRequireEditor } from "@/lib/auth-actions";

// Helper para manejo de errores tipado
const handleError = (error: unknown, msg: string) => {
  console.error(msg, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : msg,
  };
};

// ============= LEGISLADORES =============
async function checkLegislatorOverlap(
  personId: string,
  chamber: ChamberType | undefined,
  startDate: string | undefined,
  endDate: string | null | undefined,
  excludeId?: string,
) {
  const existingPeriods = await prisma.legislator.findMany({
    where: {
      person_id: personId,
      ...(chamber ? { chamber: chamber } : {}),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { start_date: true, end_date: true },
  });

  if (existingPeriods && existingPeriods.length > 0) {
    if (!startDate) {
      throw new Error(
        "La fecha de inicio es requerida para validar solapamientos.",
      );
    }
    const newStart = new Date(startDate).getTime();
    const newEnd = endDate ? new Date(endDate).getTime() : 32503680000000; // Año ~3000

    for (const period of existingPeriods) {
      const pStart = new Date(period.start_date).getTime();
      const pEnd = period.end_date
        ? new Date(period.end_date).getTime()
        : 32503680000000;

      if (newStart <= pEnd && newEnd >= pStart) {
        throw new Error(
          `Ya existe un periodo legislativo que se solapa (${period.start_date} - ${period.end_date || "Presente"})`,
        );
      }
    }
  }
}

export async function createLegislatorPeriod(
  data: CreateLegislatorPeriodRequest,
) {
  await serverRequireEditor();
  try {
    await checkLegislatorOverlap(
      data.person_id,
      data.chamber,
      data.start_date,
      data.end_date,
    );

    const now = new Date();

    const dbData = {
      id: createId(),
      person_id: data.person_id,
      chamber: data.chamber,
      electoral_district_id: data.electoral_district_id,
      elected_by_party_id: data.elected_by_party_id,
      condition: data.condition,
      start_date: new Date(data.start_date),
      end_date: data.end_date ? new Date(data.end_date) : null,
      institutional_email: data.institutional_email,
      active: data.active,
      legislative_period_id: data.legislative_period_id || null,
      created_at: now,
      updated_at: now,
    };

    const result = await prisma.legislator.create({ data: dbData });

    revalidatePath("/admin/legisladores");
    revalidateTag(TAGS.legislators, "max");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, "Error al crear periodo legislativo");
  }
}

export async function updateLegislatorPeriod(
  data: UpdateLegislatorPeriodRequest,
) {
  await serverRequireEditor();
  try {
    if (data.person_id) {
      await checkLegislatorOverlap(
        data.person_id,
        data.chamber,
        data.start_date,
        data.end_date,
        data.id,
      );
    }
    const { id, ...updateBody } = data;

    const payload = {
      ...updateBody,
      start_date: updateBody.start_date
        ? new Date(updateBody.start_date)
        : undefined,
      end_date:
        updateBody.end_date === null
          ? null
          : updateBody.end_date
            ? new Date(updateBody.end_date)
            : undefined,
    };
    Object.keys(payload).forEach((key) => {
      const k = key as keyof typeof payload;
      if (payload[k] === undefined) delete payload[k];
    });

    const result = await prisma.legislator.update({
      where: { id: id },
      data: payload,
    });

    revalidatePath("/admin/legisladores");
    revalidateTag(TAGS.legislators, "max");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, "Error al actualizar periodo legislativo");
  }
}

export async function deleteLegislatorPeriod(legislatorId: string) {
  await serverRequireEditor();
  try {
    await prisma.legislator.delete({ where: { id: legislatorId } });

    revalidatePath("/admin/legisladores");
    revalidateTag(TAGS.legislators, "max");
    return { success: true, data: { deleted_id: legislatorId } };
  } catch (error) {
    return handleError(error, "Error al eliminar periodo legislativo");
  }
}

export async function bulkUpdateLegislators(
  input: BulkUpdateLegislatorsRequest,
) {
  await serverRequireEditor();
  try {
    const payload = { active: input.active };

    const data = await prisma.legislator.updateMany({
      where: { id: { in: input.ids } },
      data: payload,
    });

    revalidatePath("/admin/legisladores");
    revalidateTag(TAGS.legislators, "max");

    return {
      data: { count: data.count, message: `Actualizados ${data.count}` },
      error: null,
    };
  } catch (error) {
    return handleError(error, "Error al actualizar legisladores");
  }
}

// ============= MEMBRESIAS PARLAMENTARIAS =============

const GroupChangeReasonEnum = z.enum([
  "INICIAL",
  "CAMBIO_VOLUNTARIO",
  "EXPULSION",
  "RENUNCIA",
  "DISOLUCION_BANCADA",
  "CAMBIO_ESTRATEGICO",
  "SANCION_DISCIPLINARIA",
  "OTRO",
]);

const createSchema = z.object({
  parliamentary_group_id: z.string(),
  start_date: z.string(),
  change_reason: GroupChangeReasonEnum,
  source_url: z.string().optional(),
});

type CreateMembershipInput = z.infer<typeof createSchema>;

const stringifyDates = (
  obj: {
    start_date?: Date | null;
    end_date?: Date | null;
    created_at?: Date | null;
    updated_at?: Date | null;
    [key: string]: unknown;
  } | null,
) => {
  if (!obj) return obj;
  return {
    ...obj,
    start_date: obj.start_date?.toISOString(),
    end_date: obj.end_date?.toISOString(),
    created_at: obj.created_at?.toISOString(),
    updated_at: obj.updated_at?.toISOString(),
  };
};

export async function createParliamentaryMembership(
  legislator_id: string,
  rawData: CreateMembershipInput,
) {
  await serverRequireEditor();
  const validation = createSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Datos inválidos: " + validation.error.message,
    };
  }
  const data = validation.data;

  try {
    const currentMembership = await prisma.parliamentarymembership.findFirst({
      where: {
        legislator_id: legislator_id,
        end_date: null,
      },
      select: { id: true },
    });

    let updatedRecord = null;

    if (currentMembership) {
      updatedRecord = await prisma.parliamentarymembership.update({
        where: { id: currentMembership.id },
        data: { end_date: new Date(data.start_date) },
        include: {
          parliamentarygroup: true,
        },
      });
    }

    const payload: Prisma.parliamentarymembershipUncheckedCreateInput = {
      id: createId(),
      legislator_id: legislator_id,
      parliamentary_group_id: data.parliamentary_group_id,
      start_date: new Date(data.start_date),
      change_reason: data.change_reason as groupchangereason,
      source_url: data.source_url || null,
      end_date: null,
    };

    const createdRecord = await prisma.parliamentarymembership.create({
      data: payload,
      include: { parliamentarygroup: true },
    });

    revalidatePath(`/admin/legisladores`);
    revalidateTag(TAGS.legislators, "max");

    return {
      success: true,
      data: {
        created: stringifyDates({
          ...createdRecord,
          parliamentary_group: stringifyDates(createdRecord.parliamentarygroup),
        }),
        updated: updatedRecord
          ? stringifyDates({
              ...updatedRecord,
              parliamentary_group: stringifyDates(
                updatedRecord.parliamentarygroup,
              ),
            })
          : null,
      },
    };
  } catch (error: unknown) {
    console.error("Error creating membership:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al crear membresía",
    };
  }
}

const updateSchema = z.object({
  id: z.string(),
  parliamentary_group_id: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  change_reason: GroupChangeReasonEnum,
  source_url: z.union([z.string(), z.literal(""), z.null()]).optional(),
});

export async function updateParliamentaryMembership(
  legislator_id: string,
  rawData: z.infer<typeof updateSchema>,
) {
  await serverRequireEditor();
  const validation = updateSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Datos inválidos: " + validation.error.message,
    };
  }
  const data = validation.data;

  try {
    const payload: Prisma.parliamentarymembershipUncheckedUpdateInput = {
      parliamentary_group_id: data.parliamentary_group_id,
      start_date: new Date(data.start_date),
      end_date: data.end_date ? new Date(data.end_date) : null,
      change_reason: data.change_reason as groupchangereason,
      source_url: data.source_url || null,
    };

    const result = await prisma.parliamentarymembership.update({
      where: {
        id: data.id,
        legislator_id: legislator_id, // Verify it belongs
      },
      data: payload,
      include: {
        parliamentarygroup: true,
      },
    });

    revalidatePath("/admin/legisladores");
    revalidateTag(TAGS.legislators, "max");

    return {
      success: true,
      data: stringifyDates({
        ...result,
        parliamentary_group: stringifyDates(result.parliamentarygroup),
      }),
    };
  } catch (error: unknown) {
    console.error("Error updating membership:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar",
    };
  }
}

export async function deleteParliamentaryMembership(
  legislator_id: string,
  membership_id: string,
) {
  await serverRequireEditor();
  try {
    const membershipToDelete = await prisma.parliamentarymembership.findFirst({
      where: { id: membership_id },
      select: { start_date: true, end_date: true },
    });

    if (!membershipToDelete)
      throw new Error("No se encontró el registro a eliminar");

    await prisma.parliamentarymembership.delete({
      where: {
        id: membership_id,
        legislator_id: legislator_id,
      },
    });

    if (!membershipToDelete.end_date) {
      const previousMembership = await prisma.parliamentarymembership.findFirst(
        {
          where: { legislator_id: legislator_id },
          orderBy: { start_date: "desc" },
          select: { id: true },
        },
      );

      if (previousMembership) {
        await prisma.parliamentarymembership.update({
          where: { id: previousMembership.id },
          data: { end_date: null },
        });
      }
    }

    revalidatePath(`/admin/legisladores/${legislator_id}`);
    revalidateTag(TAGS.legislators, "max");

    return { success: true, message: "Eliminado exitosamente" };
  } catch (error: unknown) {
    console.error("Error deleting membership:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar",
    };
  }
}
