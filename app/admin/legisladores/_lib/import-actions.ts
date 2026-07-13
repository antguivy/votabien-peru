"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { serverRequireEditor } from "@/lib/auth-actions";
import { createId } from "@paralleldrive/cuid2";
import { Prisma } from "@/prisma/generated/client";

export interface ImportLegislatorRow {
  dni: string;
  camara: string;
  partido: string;
  bancada: string;
  distrito: string;
  periodo: string;
  email?: string;
}

export async function importLegislators(rows: ImportLegislatorRow[]): Promise<{
  success: boolean;
  created: number;
  errors: string[];
}> {
  await serverRequireEditor();

  let created = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowLabel = `Fila ${i + 1} (DNI ${row.dni})`;

    try {
      const person = await prisma.person.findFirst({
        where: { dni: row.dni },
      });
      if (!person) {
        errors.push(`${rowLabel}: Persona no encontrada`);
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
        errors.push(`${rowLabel}: Partido "${row.partido}" no encontrado`);
        continue;
      }

      const group = await prisma.parliamentarygroup.findFirst({
        where: { name: { equals: row.bancada, mode: "insensitive" } },
      });
      if (!group) {
        errors.push(`${rowLabel}: Bancada "${row.bancada}" no encontrada`);
        continue;
      }

      const district = await prisma.electoraldistrict.findFirst({
        where: { name: { equals: row.distrito, mode: "insensitive" } },
      });
      if (!district) {
        errors.push(`${rowLabel}: Distrito "${row.distrito}" no encontrado`);
        continue;
      }

      const period = await prisma.legislativeperiod.findFirst({
        where: { name: { contains: row.periodo, mode: "insensitive" } },
      });
      if (!period) {
        errors.push(`${rowLabel}: Periodo "${row.periodo}" no encontrado`);
        continue;
      }

      const validChambers = ["SENADO", "DIPUTADOS", "CONGRESO"];
      if (!validChambers.includes(row.camara)) {
        errors.push(`${rowLabel}: Cámara inválida "${row.camara}"`);
        continue;
      }

      await prisma.$transaction(
        async (tx) => {
          const legislatorId = createId();
          const now = new Date();

          await tx.legislator.create({
            data: {
              id: legislatorId,
              person_id: person.id,
              electoral_district_id: district.id,
              chamber: row.camara as Prisma.legislatorCreateInput["chamber"],
              start_date: period.start_date,
              end_date: period.end_date,
              active: true,
              condition: "EN_EJERCICIO",
              elected_by_party_id: party.id,
              legislative_period_id: period.id,
              institutional_email: row.email || null,
              created_at: now,
              updated_at: now,
            },
          });

          await tx.parliamentarymembership.create({
            data: {
              id: createId(),
              legislator_id: legislatorId,
              parliamentary_group_id: group.id,
              start_date: period.start_date,
              end_date: null,
              change_reason: "INICIAL",
            },
          });
        },
        { timeout: 15000 },
      );

      created++;
    } catch (err) {
      errors.push(
        `${rowLabel}: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  }

  revalidatePath("/admin/legisladores");
  revalidateTag(TAGS.legislators, "max");

  return { success: errors.length === 0, created, errors };
}
