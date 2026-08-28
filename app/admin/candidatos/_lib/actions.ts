"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";

import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { BulkUpdateCandidatesRequest } from "./types";
import {
  CandidacyStatus,
  CandidacyType,
  CreateCandidatePeriodRequest,
  UpdateCandidatePeriodRequest,
} from "@/interfaces/candidate";
import { extractErrorMessage } from "@/lib/error-handler";
import { serverRequireEditor, serverRequireReviewer } from "@/lib/auth-actions";

// Helper para manejo de errores tipado
const handleError = (error: unknown, msg: string) => {
  console.error(msg, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : msg,
  };
};

const EXECUTIVE_TYPES = new Set<CandidacyType>([
  CandidacyType.PRESIDENTE,
  CandidacyType.VICEPRESIDENTE_1,
  CandidacyType.VICEPRESIDENTE_2,
]);

function isExecutiveType(type: CandidacyType): boolean {
  return EXECUTIVE_TYPES.has(type);
}

/**
 * Verifica si la combinación de candidaturas está permitida
 * REGLA: Solo PRESIDENTE/VICE pueden ser también SENADOR (Nacional)
 */
function isCombinationAllowed(
  existingType: CandidacyType,
  newType: CandidacyType,
): boolean {
  if (existingType === newType) return false;

  if (
    (isExecutiveType(existingType) && newType === CandidacyType.SENADOR) ||
    (isExecutiveType(existingType) && newType === CandidacyType.DIPUTADO)
  ) {
    return true;
  }

  if (existingType === CandidacyType.SENADOR && isExecutiveType(newType)) {
    return true;
  }

  return false;
}

// ============= VALIDACIONES =============
async function checkCandidacyOverlap(
  personId: string,
  processId: string,
  type: CandidacyType,
  districtId: string,
  excludeCandidateId?: string,
) {
  const nationalDistrict = await prisma.electoraldistrict.findFirst({
    where: { name: { contains: "nacional", mode: "insensitive" } },
    select: { id: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nationalDistrictId = nationalDistrict?.id || "";

  const existingCandidates = await prisma.candidate.findMany({
    where: {
      active: true,
      person_id: personId,
      electoral_process_id: processId,
      ...(excludeCandidateId ? { id: { not: excludeCandidateId } } : {}),
    },
    select: { id: true, type: true, electoral_district_id: true },
  });

  if (!existingCandidates || existingCandidates.length === 0) {
    return;
  }

  // 3. Verificar si ya tiene una candidatura del mismo tipo
  const sameTypeExists = existingCandidates.some((c) => c.type === type);
  if (sameTypeExists) {
    throw new Error(
      `Esta persona ya está registrada como ${type} en este proceso electoral.`,
    );
  }

  // 4. Verificar combinaciones permitidas
  for (const existing of existingCandidates) {
    const isAllowed = isCombinationAllowed(
      existing.type as CandidacyType,
      type,
    );

    if (!isAllowed) {
      throw new Error(
        `Esta persona ya tiene una candidatura como ${existing.type}. ` +
          `Solo las candidaturas de PRESIDENTE/VICEPRESIDENTE pueden combinarse con SENADOR (Distrito Nacional).`,
      );
    }
  }
}

export async function createCandidatePeriod(
  data: CreateCandidatePeriodRequest,
) {
  await serverRequireEditor();
  try {
    await checkCandidacyOverlap(
      data.person_id,
      data.electoral_process_id,
      data.type,
      data.electoral_district_id,
    );

    const districtExists = await prisma.electoraldistrict.findUnique({
      where: { id: data.electoral_district_id },
      select: { id: true },
    });

    if (!districtExists) {
      throw new Error(
        "El distrito electoral seleccionado no existe o fue eliminado",
      );
    }

    const dbData = {
      id: createId(),
      person_id: data.person_id,
      type: data.type,
      electoral_district_id: data.electoral_district_id,
      political_party_id: data.political_party_id,
      status: data.status,
      list_number: data.list_number,
      active: data.active,
      electoral_process_id: data.electoral_process_id,
    };

    const result = await prisma.candidate.create({
      data: dbData,
    });

    revalidatePath("/admin/candidatos");
    revalidateTag(TAGS.candidates, "max");

    return { success: true, data: result };
  } catch (error: unknown) {
    // Basic catch for foreign key failures
    if ((error as { code?: string })?.code === "P2003") {
      return {
        success: false,
        error:
          "Uno de los datos seleccionados no es válido. Verifique el distrito electoral, partido político y proceso electoral.",
      };
    }
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function updateCandidatePeriod(
  data: UpdateCandidatePeriodRequest,
) {
  await serverRequireEditor();
  try {
    const { id, ...updateBody } = data;

    if (
      updateBody.person_id &&
      updateBody.electoral_process_id &&
      updateBody.type &&
      updateBody.electoral_district_id
    ) {
      await checkCandidacyOverlap(
        updateBody.person_id,
        updateBody.electoral_process_id,
        updateBody.type as CandidacyType,
        updateBody.electoral_district_id,
        id,
      );
    }

    const result = await prisma.candidate.update({
      where: { id: id },

      data: updateBody,
    });

    revalidatePath("/admin/candidatos");
    revalidateTag(TAGS.candidates, "max");

    return { success: true, data: result };
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2003") {
      return {
        success: false,
        error:
          "Uno de los datos seleccionados no es válido. Verifique el distrito electoral, partido político y proceso electoral.",
      };
    }
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function deleteCandidatePeriod(candidateId: string) {
  await serverRequireEditor();
  try {
    await prisma.candidate.delete({ where: { id: candidateId } });

    revalidatePath("/admin/candidatos");
    revalidateTag(TAGS.candidates, "max");

    return { success: true, data: { deleted_id: candidateId } };
  } catch (error) {
    return handleError(error, "Error al eliminar candidato");
  }
}

export async function bulkUpdateCandidates(input: BulkUpdateCandidatesRequest) {
  await serverRequireEditor();
  try {
    const payload = { active: input.active };

    const data = await prisma.candidate.updateMany({
      where: { id: { in: input.ids } },
      data: payload,
    });

    revalidatePath("/admin/candidatos");
    revalidateTag(TAGS.candidates, "max");

    return {
      data: { count: data.count, message: `Actualizados ${data.count}` },
      error: null,
    };
  } catch (error) {
    return handleError(error, "Error al actualizar candidatos");
  }
}

export async function updateCandidateStatus(
  candidateId: string,
  status: CandidacyStatus,
) {
  await serverRequireReviewer();
  try {
    const result = await prisma.candidate.update({
      where: { id: candidateId },
      data: { status },
    });

    revalidatePath("/admin/candidatos");
    revalidateTag(TAGS.candidates, "max");

    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}
