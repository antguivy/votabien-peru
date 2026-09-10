import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import prisma from "@/lib/prisma";
import { cache } from "react";

export const getDistritos = cache(
  async (): Promise<ElectoralDistrictBase[]> => {
    try {
      const data = await prisma.electoraldistrict.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          code: true,
          ubigeo: true,
          level: true,
          parent_id: true,
          is_national: true,
          active: true,
        },
        orderBy: { name: "asc" },
      });

      return data as ElectoralDistrictBase[];
    } catch (error) {
      console.error("Error al obtener distritos:", error);
      return [];
    }
  },
);

export const getRegiones = cache(async (): Promise<ElectoralDistrictBase[]> => {
  try {
    const data = await prisma.electoraldistrict.findMany({
      where: {
        active: true,
        is_national: false,
        OR: [{ level: "REGIONAL" }, { parent_id: null }],
        NOT: {
          name: { contains: "NACIONAL", mode: "insensitive" },
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        ubigeo: true,
        level: true,
        parent_id: true,
        is_national: true,
        active: true,
      },
      orderBy: { name: "asc" },
    });

    return data as ElectoralDistrictBase[];
  } catch (error) {
    console.error("Error al obtener regiones:", error);
    return [];
  }
});
