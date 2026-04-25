"use server";

import { getLegisladoresCards } from "@/queries/public/legislators";
import { ChamberType } from "@/interfaces/politics";

interface GetLegislatorsParams {
  active_only?: boolean;
  chamber?: ChamberType;
  groups?: string[];
  districts?: string[];
  search?: string;
  ids?: string[];
  page?: number;
  pageSize?: number;
  limit?: number;
}

// Esta función es el "puente". El cliente la llama, Next.js hace una petición HTTP oculta
// hacia el servidor, y aquí en el servidor ejecutamos tu función con caché de forma segura.
export async function fetchLegislatorsAction(params: GetLegislatorsParams) {
  try {
    const data = await getLegisladoresCards(params);
    return data;
  } catch (error) {
    console.error("Error en Server Action fetchLegislatorsAction:", error);
    return []; // Retornamos un array vacío en caso de error para no romper la UI
  }
}
