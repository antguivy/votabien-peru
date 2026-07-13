"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { serverRequireEditor } from "@/lib/auth-actions";
import { createId } from "@paralleldrive/cuid2";

export interface ImportLegislatorRow {
  dni: string;
  camara: string;
  partido: string;
  bancada: string;
  distrito: string;
  periodo: string;
  email?: string;
}

interface ValidationError {
  row: number;
  dni: string;
  error: string;
}

const PERIOD_START_DATE = new Date("2026-07-26T00:00:00-05:00");

export async function importLegislators(rows: ImportLegislatorRow[]): Promise<{
  success: boolean;
  created: number;
  errors: string[];
}> {
  await serverRequireEditor();

  // ── FASE 1: Validar todo sin crear nada ──
  const validationErrors: ValidationError[] = [];
  const resolved: {
    personId: string;
    partyId: string;
    groupId: string;
    districtId: string;
    periodId: string;
    chamber: "SENADO" | "DIPUTADOS" | "CONGRESO";
    email: string | null;
  }[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 1;

    const person = await prisma.person.findFirst({
      where: { dni: row.dni },
    });
    if (!person) {
      validationErrors.push({
        row: rowNum,
        dni: row.dni,
        error: "Persona no encontrada por DNI",
      });
      continue;
    }

    const party = await prisma.politicalparty.findFirst({
      where: {
        OR: [
          { name: { equals: row.partido, mode: "insensitive" } },
          { acronym: { equals: row.partido, mode: "insensitive" } },
        ],
      },
    });
    if (!party) {
      validationErrors.push({
        row: rowNum,
        dni: row.dni,
        error: `Partido "${row.partido}" no encontrado`,
      });
      continue;
    }

    const group = await prisma.parliamentarygroup.findFirst({
      where: { name: { equals: row.bancada, mode: "insensitive" } },
    });
    if (!group) {
      validationErrors.push({
        row: rowNum,
        dni: row.dni,
        error: `Bancada "${row.bancada}" no encontrada`,
      });
      continue;
    }

    const district = await prisma.electoraldistrict.findFirst({
      where: { name: { equals: row.distrito, mode: "insensitive" } },
    });
    if (!district) {
      validationErrors.push({
        row: rowNum,
        dni: row.dni,
        error: `Distrito "${row.distrito}" no encontrado`,
      });
      continue;
    }

    const period = await prisma.legislativeperiod.findFirst({
      where: { name: { contains: row.periodo, mode: "insensitive" } },
    });
    if (!period) {
      validationErrors.push({
        row: rowNum,
        dni: row.dni,
        error: `Periodo "${row.periodo}" no encontrado`,
      });
      continue;
    }

    const validChambers = ["SENADO", "DIPUTADOS", "CONGRESO"];
    if (!validChambers.includes(row.camara)) {
      validationErrors.push({
        row: rowNum,
        dni: row.dni,
        error: `Cámara inválida "${row.camara}" (debe ser SENADO o DIPUTADOS)`,
      });
      continue;
    }

    resolved.push({
      personId: person.id,
      partyId: party.id,
      groupId: group.id,
      districtId: district.id,
      periodId: period.id,
      chamber: row.camara as "SENADO" | "DIPUTADOS" | "CONGRESO",
      email: row.email?.trim() || null,
    });
  }

  if (validationErrors.length > 0) {
    return {
      success: false,
      created: 0,
      errors: validationErrors.map(
        (e) => `Fila ${e.row} (DNI ${e.dni}): ${e.error}`,
      ),
    };
  }

  // ── FASE 2: Insertar atómicamente ──
  try {
    let createdCount = 0;

    await prisma.$transaction(
      async (tx) => {
        const now = new Date();

        for (const r of resolved) {
          const legislatorId = createId();

          await tx.legislator.create({
            data: {
              id: legislatorId,
              person_id: r.personId,
              electoral_district_id: r.districtId,
              chamber: r.chamber,
              start_date: PERIOD_START_DATE,
              end_date: null,
              active: true,
              condition: "EN_EJERCICIO",
              elected_by_party_id: r.partyId,
              legislative_period_id: r.periodId,
              institutional_email: r.email,
              created_at: now,
              updated_at: now,
            },
          });

          await tx.parliamentarymembership.create({
            data: {
              id: createId(),
              legislator_id: legislatorId,
              parliamentary_group_id: r.groupId,
              start_date: PERIOD_START_DATE,
              end_date: null,
              change_reason: "INICIAL",
            },
          });

          createdCount++;
        }
      },
      { timeout: 30000 },
    );

    revalidatePath("/admin/legisladores");
    revalidateTag(TAGS.legislators, "max");

    return { success: true, created: createdCount, errors: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return {
      success: false,
      created: 0,
      errors: [`Error atómico: ${message}. No se creó ningún legislador.`],
    };
  }
}
