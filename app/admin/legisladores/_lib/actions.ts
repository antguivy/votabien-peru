"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { Prisma, groupchangereason } from "@/prisma/generated/client";
import {
  BulkUpdateLegislatorsRequest,
  SyncLegislatorsOptions,
  SyncLegislatorsResponse,
  SyncLegislatorDetail,
} from "./types";
import {
  fetchCongresoMembers,
  findBestCongresoMatch,
  resolveBestPhotoUrl,
} from "./congreso-scraper";
import {
  CreateLegislatorPeriodRequest,
  UpdateLegislatorPeriodRequest,
} from "@/interfaces/legislator";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChamberType, GroupChangeReason } from "@/interfaces/politics";
import { createId } from "@paralleldrive/cuid2";
import z from "zod";
import { serverRequireEditor } from "@/lib/auth-actions";
import { revalidatePersonEcosystem } from "@/lib/cache-revalidate";
import { parseToUtcDate } from "@/lib/utils/date";

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
  startDate: string | Date | undefined,
  endDate: string | Date | null | undefined,
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
    const parsedStart = parseToUtcDate(startDate);
    if (!parsedStart) {
      throw new Error(
        "La fecha de inicio es requerida para validar solapamientos.",
      );
    }
    const newStart = parsedStart.getTime();
    const parsedEnd = parseToUtcDate(endDate);
    const newEnd = parsedEnd ? parsedEnd.getTime() : 32503680000000; // Año ~3000

    for (const period of existingPeriods) {
      const pStart = new Date(period.start_date).getTime();
      const pEnd = period.end_date
        ? new Date(period.end_date).getTime()
        : 32503680000000;

      if (newStart <= pEnd && newEnd >= pStart) {
        throw new Error(
          `Ya existe un periodo legislativo que se solapa (${period.start_date.toISOString().slice(0, 10)} - ${period.end_date ? period.end_date.toISOString().slice(0, 10) : "Presente"})`,
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

    if (data.person_id && data.image_url !== undefined) {
      await prisma.person.update({
        where: { id: data.person_id },
        data: {
          image_url:
            data.image_url && data.image_url.trim()
              ? data.image_url.trim()
              : null,
        },
      });
    }

    const now = new Date();

    const parsedStart = parseToUtcDate(data.start_date);
    if (!parsedStart) {
      throw new Error("La fecha de inicio es requerida");
    }

    const dbData = {
      id: createId(),
      person_id: data.person_id,
      chamber: data.chamber,
      electoral_district_id: data.electoral_district_id,
      elected_by_party_id: data.elected_by_party_id,
      condition: data.condition,
      start_date: parsedStart,
      end_date: parseToUtcDate(data.end_date),
      institutional_email: data.institutional_email,
      active: data.active,
      legislative_period_id: data.legislative_period_id || null,
      created_at: now,
      updated_at: now,
    };

    const result = await prisma.legislator.create({ data: dbData });

    revalidatePersonEcosystem();
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
    const { id, image_url, ...updateBody } = data;

    if (data.person_id && image_url !== undefined) {
      await prisma.person.update({
        where: { id: data.person_id },
        data: {
          image_url: image_url && image_url.trim() ? image_url.trim() : null,
        },
      });
    }

    const payload = {
      ...updateBody,
      start_date: updateBody.start_date
        ? (parseToUtcDate(updateBody.start_date) ?? undefined)
        : undefined,
      end_date:
        updateBody.end_date === null
          ? null
          : updateBody.end_date
            ? parseToUtcDate(updateBody.end_date)
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

    revalidatePersonEcosystem();
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, "Error al actualizar periodo legislativo");
  }
}

export async function deleteLegislatorPeriod(legislatorId: string) {
  await serverRequireEditor();
  try {
    await prisma.legislator.delete({ where: { id: legislatorId } });

    revalidatePersonEcosystem();
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
        data: { end_date: parseToUtcDate(data.start_date) },
        include: {
          parliamentarygroup: true,
        },
      });
    }

    const parsedStartDate = parseToUtcDate(data.start_date);
    if (!parsedStartDate) {
      return { success: false, error: "Fecha de inicio inválida" };
    }

    const payload: Prisma.parliamentarymembershipUncheckedCreateInput = {
      id: createId(),
      legislator_id: legislator_id,
      parliamentary_group_id: data.parliamentary_group_id,
      start_date: parsedStartDate,
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
    const parsedStartDate = parseToUtcDate(data.start_date);
    if (!parsedStartDate) {
      return { success: false, error: "Fecha de inicio inválida" };
    }

    const payload: Prisma.parliamentarymembershipUncheckedUpdateInput = {
      parliamentary_group_id: data.parliamentary_group_id,
      start_date: parsedStartDate,
      end_date: parseToUtcDate(data.end_date),
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

// ============= SINCRONIZACIÓN OFICIAL CONGRESO =============
export async function syncLegislatorsWithCongreso(
  legislatorIds: string[],
  options: SyncLegislatorsOptions = {},
): Promise<SyncLegislatorsResponse> {
  await serverRequireEditor();

  const {
    updatePhoto = true,
    updateEmail = true,
    overwrite = false,
    preferHdImage = true,
  } = options;

  if (!legislatorIds || legislatorIds.length === 0) {
    return {
      success: false,
      total: 0,
      updated: 0,
      skipped: 0,
      notFound: 0,
      failed: 0,
      details: [],
      error: "No se seleccionaron legisladores para sincronizar.",
    };
  }

  try {
    // 1. Obtener legisladores de la BD
    const legislators = await prisma.legislator.findMany({
      where: { id: { in: legislatorIds } },
      include: {
        person: {
          select: {
            id: true,
            fullname: true,
            name: true,
            lastname: true,
            image_url: true,
          },
        },
      },
    });

    if (legislators.length === 0) {
      return {
        success: false,
        total: 0,
        updated: 0,
        skipped: 0,
        notFound: 0,
        failed: 0,
        details: [],
        error: "No se encontraron los legisladores en la base de datos.",
      };
    }

    // 2. Determinar qué cámaras necesitamos consultar
    const hasSenado = legislators.some((l) => l.chamber === "SENADO");
    const hasDiputados = legislators.some(
      (l) => l.chamber === "DIPUTADOS" || l.chamber === "CONGRESO",
    );

    const [senadoMembers, diputadosMembers] = await Promise.all([
      hasSenado ? fetchCongresoMembers("SENADO") : Promise.resolve([]),
      hasDiputados ? fetchCongresoMembers("DIPUTADOS") : Promise.resolve([]),
    ]);

    const details: SyncLegislatorDetail[] = [];
    const personsToRevalidate = new Set<string>();

    for (const leg of legislators) {
      const legChamber = leg.chamber as ChamberType;
      const candidates =
        leg.chamber === "SENADO" ? senadoMembers : diputadosMembers;
      const personName =
        leg.person?.fullname ||
        `${leg.person?.name || ""} ${leg.person?.lastname || ""}`.trim();

      if (!personName) {
        details.push({
          legislatorId: leg.id,
          personId: leg.person_id,
          fullname: "Sin nombre",
          chamber: legChamber,
          status: "error",
          reason: "El legislador no tiene nombre registrado en person",
        });
        continue;
      }

      // Matcher
      const matchResult = findBestCongresoMatch(personName, candidates);

      if (!matchResult) {
        details.push({
          legislatorId: leg.id,
          personId: leg.person_id,
          fullname: personName,
          chamber: legChamber,
          status: "not_found",
          reason: `No se encontró en el portal del ${leg.chamber === "SENADO" ? "Senado" : "Diputados"}`,
        });
        continue;
      }

      const { member, score } = matchResult;

      // Evaluar qué actualizar
      let shouldUpdateEmail = false;
      let targetEmail: string | null = null;
      if (updateEmail && member.email) {
        const hasExistingEmail = Boolean(
          leg.institutional_email && leg.institutional_email.trim(),
        );
        if (overwrite || !hasExistingEmail) {
          if (leg.institutional_email !== member.email) {
            shouldUpdateEmail = true;
            targetEmail = member.email;
          }
        }
      }

      let shouldUpdatePhoto = false;
      let targetPhoto: string | null = null;
      if (updatePhoto && member.photo) {
        const hasExistingPhoto = Boolean(
          leg.person?.image_url && leg.person.image_url.trim(),
        );
        if (overwrite || !hasExistingPhoto) {
          const resolvedPhoto = await resolveBestPhotoUrl(
            member.photo,
            preferHdImage,
          );
          if (leg.person?.image_url !== resolvedPhoto) {
            shouldUpdatePhoto = true;
            targetPhoto = resolvedPhoto;
          }
        }
      }

      if (!shouldUpdateEmail && !shouldUpdatePhoto) {
        details.push({
          legislatorId: leg.id,
          personId: leg.person_id,
          fullname: personName,
          chamber: legChamber,
          status: "skipped",
          matchedName: member.name,
          matchedScore: score,
          email: leg.institutional_email,
          photo: leg.person?.image_url,
          reason: "Los datos ya están actualizados o se omitió sobrescribir.",
        });
        continue;
      }

      // Ejecutar actualizaciones
      try {
        if (shouldUpdatePhoto && targetPhoto) {
          await prisma.person.update({
            where: { id: leg.person_id },
            data: { image_url: targetPhoto },
          });
          personsToRevalidate.add(leg.person_id);
        }

        if (shouldUpdateEmail && targetEmail) {
          await prisma.legislator.update({
            where: { id: leg.id },
            data: { institutional_email: targetEmail },
          });
        }

        details.push({
          legislatorId: leg.id,
          personId: leg.person_id,
          fullname: personName,
          chamber: legChamber,
          status: "updated",
          matchedName: member.name,
          matchedScore: score,
          emailUpdated: shouldUpdateEmail,
          photoUpdated: shouldUpdatePhoto,
          email: targetEmail ?? leg.institutional_email,
          photo: targetPhoto ?? leg.person?.image_url,
        });
      } catch (dbErr) {
        console.error("Error al actualizar legislador:", leg.id, dbErr);
        details.push({
          legislatorId: leg.id,
          personId: leg.person_id,
          fullname: personName,
          chamber: legChamber,
          status: "error",
          reason:
            dbErr instanceof Error
              ? dbErr.message
              : "Error al guardar en base de datos",
        });
      }
    }

    // 3. Revalidar ecosistema de caché si hubo actualizaciones
    if (personsToRevalidate.size > 0) {
      try {
        revalidatePersonEcosystem();
      } catch (cacheErr) {
        console.error("Error revalidating person ecosystem cache:", cacheErr);
      }
    }

    revalidateTag(TAGS.legislators, "max");
    revalidatePath("/admin/legisladores");
    revalidatePath("/legisladores");

    const updated = details.filter((d) => d.status === "updated").length;
    const skipped = details.filter((d) => d.status === "skipped").length;
    const notFound = details.filter((d) => d.status === "not_found").length;
    const failed = details.filter((d) => d.status === "error").length;

    return {
      success: true,
      total: legislators.length,
      updated,
      skipped,
      notFound,
      failed,
      details,
    };
  } catch (error) {
    console.error("Error en syncLegislatorsWithCongreso:", error);
    return {
      success: false,
      total: legislatorIds.length,
      updated: 0,
      skipped: 0,
      notFound: 0,
      failed: legislatorIds.length,
      details: [],
      error:
        error instanceof Error
          ? error.message
          : "Error inesperado al sincronizar con el portal del Congreso.",
    };
  }
}
