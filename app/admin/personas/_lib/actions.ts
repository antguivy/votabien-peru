"use server"; // <-- ¡Obligatorio para mutaciones!

import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags"; // <-- Importamos nuestros tags

import { prisma } from "@/lib/prisma";
import { serverGetUser, serverRequireEditor } from "@/lib/auth-actions";
import { createId } from "@paralleldrive/cuid2";

import {
  BiographyDetail,
  CreatePersonRequest,
  UpdatePersonRequest,
} from "@/interfaces/person";
import {
  BackgroundBase,
  BackgroundStatus,
  BackgroundType,
} from "@/interfaces/background";
import { API_BASE_URL } from "@/lib/config";
import { extractErrorMessage } from "@/lib/error-handler";
import { toJsonInsert, toNullIfEmpty } from "@/lib/utils/text";
import { limaDateToUtc } from "@/lib/utils/date";

// Helper para detonar todas las cachés relacionadas a una persona
// Cambiar a una persona afecta sus tarjetas de candidato y legislador
function revalidatePersonEcosystem() {
  revalidatePath("/admin/personas");
  revalidateTag(TAGS.persons, "max");
  revalidateTag(TAGS.candidates, "max");
  revalidateTag(TAGS.legislators, "max");
}

export async function createPerson(data: CreatePersonRequest) {
  await serverRequireEditor();
  try {
    if (data.dni) {
      const existingPerson = await prisma.person.findUnique({
        where: { dni: data.dni },
        select: { id: true, fullname: true, dni: true },
      });

      if (existingPerson) {
        console.warn("[createPerson] DNI duplicado encontrado:", {
          dni: data.dni,
          existingPerson: existingPerson,
        });
        throw new Error(
          `Ya existe una persona registrada con el DNI ${data.dni}: ${existingPerson.fullname}`,
        );
      }
    }

    const personId = createId();

    const personData = {
      id: personId,
      party_number_rop: toNullIfEmpty(data.party_number_rop),
      dni: toNullIfEmpty(data.dni),
      gender: toNullIfEmpty(data.gender),
      name: data.name,
      lastname: data.lastname,
      fullname: data.fullname,
      image_url: toNullIfEmpty(data.image_url),
      image_candidate_url: toNullIfEmpty(data.image_candidate_url),
      birth_date: limaDateToUtc(data.birth_date),
      place_of_birth: toNullIfEmpty(data.place_of_birth),
      profession: toNullIfEmpty(data.profession),

      secondary_school: data.secondary_school,

      no_university_education: toJsonInsert(data.no_university_education),

      technical_education: toJsonInsert(data.technical_education),

      university_education: toJsonInsert(data.university_education),

      postgraduate_education: toJsonInsert(data.postgraduate_education),

      work_experience: toJsonInsert(data.work_experience),

      political_role: toJsonInsert(data.political_role),

      popular_election: toJsonInsert(data.popular_election),

      incomes: toJsonInsert(data.incomes),

      assets: toJsonInsert(data.assets),

      facebook_url: toNullIfEmpty(data.facebook_url),
      twitter_url: toNullIfEmpty(data.twitter_url),
      instagram_url: toNullIfEmpty(data.instagram_url),
      tiktok_url: toNullIfEmpty(data.tiktok_url),
    };

    const person = await prisma.person.create({ data: personData });

    revalidatePersonEcosystem(); // 🔥 Dispara la actualización global
    return { success: true, data: person };
  } catch (error) {
    console.error("[createPerson] Error capturado:", error);
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function updatePerson(data: Partial<UpdatePersonRequest>) {
  await serverRequireEditor();
  try {
    if (!data.id) {
      throw new Error("ID de la persona es requerido para actualizar");
    }

    if (data.dni) {
      const existingPerson = await prisma.person.findFirst({
        where: { dni: data.dni, id: { not: data.id } },
        select: { id: true, fullname: true, dni: true },
      });

      if (existingPerson) {
        throw new Error(
          `Ya existe otra persona registrada con el DNI ${data.dni}: ${existingPerson.fullname}`,
        );
      }
    }

    const personData = {
      party_number_rop: toNullIfEmpty(data.party_number_rop),
      dni: data.dni,
      gender: data.gender,
      name: data.name,
      lastname: data.lastname,
      fullname: data.fullname,
      image_url: toNullIfEmpty(data.image_url),
      image_candidate_url: toNullIfEmpty(data.image_candidate_url),
      birth_date: toNullIfEmpty(data.birth_date),
      place_of_birth: toNullIfEmpty(data.place_of_birth),
      profession: toNullIfEmpty(data.profession),

      secondary_school: data.secondary_school,

      technical_education: toJsonInsert(data.technical_education),

      no_university_education: toJsonInsert(data.no_university_education),

      university_education: toJsonInsert(data.university_education),

      postgraduate_education: toJsonInsert(data.postgraduate_education),

      work_experience: toJsonInsert(data.work_experience),

      political_role: toJsonInsert(data.political_role),

      popular_election: toJsonInsert(data.popular_election),

      incomes: toJsonInsert(data.incomes),

      assets: toJsonInsert(data.assets),

      facebook_url: toNullIfEmpty(data.facebook_url),
      twitter_url: toNullIfEmpty(data.twitter_url),
      instagram_url: toNullIfEmpty(data.instagram_url),
      tiktok_url: toNullIfEmpty(data.tiktok_url),
    };

    const person = await prisma.person.update({
      where: { id: data.id },
      data: personData,
    });

    revalidatePersonEcosystem(); // 🔥 Dispara la actualización global
    return { success: true, data: person };
  } catch (error) {
    console.error("[updatePerson] Error capturado:", error);
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function deletePerson(personId: string) {
  await serverRequireEditor();
  try {
    await prisma.person.delete({ where: { id: personId } });

    revalidatePersonEcosystem(); // 🔥 Dispara la actualización global
    return { success: true, message: "Persona eliminada exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function bulkDeletePersons(personIds: string[]) {
  await serverRequireEditor();
  try {
    await prisma.person.deleteMany({
      where: { id: { in: personIds } },
    });

    revalidatePersonEcosystem(); // 🔥 Dispara la actualización global
    return {
      success: true,
      message: `${personIds.length} persona(s) eliminada(s) exitosamente`,
    };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

// Funciones de lectura puras (Buscadores / APIs externas) - No requieren invalidar caché
export async function searchPersonByDNI(dni: string) {
  try {
    const data = await prisma.person.findUnique({
      where: { dni },
      select: { id: true, dni: true, fullname: true, image_url: true },
    });

    if (!data) throw new Error("No rows found");

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

const cleanForDb = (val: string | null | undefined) => {
  if (!val || val.trim() === "") return null;
  return val.trim();
};

const BLOCKED_SOURCE_URLS_EXACT = new Set([
  "https://congrezoo.pe/fauna-electoral/2026/02/10/elecciones-2026-postulantes-condicion-de-deudores-alimentarios-morosos/",
  "https://congrezoo.pe/fauna-electoral/2026/01/11/podemos-fuerza-popular-app-peru-libre-mayor-numero-candidatos-con-sentencias-penales/",
  "https://congrezoo.pe/fauna-electoral/2026/01/18/elecciones-2026-lista-de-candidatos-con-sentencias-por-alimentos/",
]);

const BLOCKED_SOURCE_URL_PREFIXES = [
  "https://checabien.com/",
  "https://revisatucandidato.pe/",
  "https://votoinformado.jne.gob.pe/",
  "https://candidatos.pe/",
];

const isBlockedSourceUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  if (BLOCKED_SOURCE_URLS_EXACT.has(trimmed)) return true;
  return BLOCKED_SOURCE_URL_PREFIXES.some((prefix) =>
    trimmed.startsWith(prefix),
  );
};

export async function updatePersonBiography(
  personId: string,
  biography: BiographyDetail[],
) {
  await serverRequireEditor();
  try {
    const data = await prisma.person.update({
      where: { id: personId },

      data: { detailed_biography: toJsonInsert(biography) },
      select: { id: true, fullname: true, detailed_biography: true },
    });

    revalidatePersonEcosystem(); // 🔥
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function insertPersonBiography(
  personId: string,
  biography: BiographyDetail[],
) {
  await serverRequireEditor();
  try {
    const filtered = biography.filter(
      (item) => !isBlockedSourceUrl(item.source_url),
    );

    await prisma.person.update({
      where: { id: personId },

      data: { detailed_biography: toJsonInsert(filtered) },
    });

    revalidatePersonEcosystem(); // 🔥
    return { success: true, inserted: filtered.length };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function insertPersonBackgrounds(
  personId: string,
  backgrounds: BackgroundBase[],
) {
  await serverRequireEditor();
  try {
    const filtered = backgrounds.filter(
      (item) => !isBlockedSourceUrl(item.source_url),
    );

    if (filtered.length === 0) {
      return { success: true, inserted: 0 };
    }

    const insertData = filtered.map((item) => ({
      id: createId(),
      person_id: personId,
      type: item.type,
      status: item.status as BackgroundStatus,
      title: item.title,
      summary: item.summary,
      sanction: cleanForDb(item.sanction),
      source: item.source,
      source_url: cleanForDb(item.source_url),
      publication_date: cleanForDb(item.publication_date),
    }));

    await prisma.background.createMany({ data: insertData });

    revalidatePersonEcosystem(); // 🔥
    return { success: true, inserted: insertData.length };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updatePersonBackgrounds(
  personId: string,
  backgrounds: BackgroundBase[],
) {
  await serverRequireEditor();
  try {
    const newItems = backgrounds.filter((item) => item.id.startsWith("new_"));
    const existingItems = backgrounds.filter(
      (item) => !item.id.startsWith("new_"),
    );
    const existingIds = existingItems.map((item) => item.id);

    // Delete what is not in existingIds
    await prisma.background.deleteMany({
      where: {
        person_id: personId,
        id: existingIds.length > 0 ? { notIn: existingIds } : undefined,
      },
    });

    if (newItems.length > 0) {
      const insertData = newItems.map((item) => ({
        id: createId(),
        person_id: personId,
        type: item.type,
        status: item.status as BackgroundStatus,
        title: item.title,
        summary: item.summary,
        sanction: cleanForDb(item.sanction),
        source: item.source,
        source_url: cleanForDb(item.source_url),
        publication_date: cleanForDb(item.publication_date),
      }));

      await prisma.background.createMany({ data: insertData });
    }

    for (const item of existingItems) {
      await prisma.background.update({
        where: { id: item.id }, // person_id is implied unique with id or we just assume id is PK
        data: {
          type: item.type,
          status: item.status as BackgroundStatus,
          title: item.title,
          summary: item.summary,
          sanction: cleanForDb(item.sanction),
          source: item.source,
          source_url: cleanForDb(item.source_url),
          publication_date: cleanForDb(item.publication_date),
        },
      });
    }

    revalidatePersonEcosystem(); // 🔥
    return {
      success: true,
      inserted: newItems.length,
      updated: existingItems.length,
    };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deletePersonBackground(backgroundId: string) {
  await serverRequireEditor();
  try {
    await prisma.background.delete({ where: { id: backgroundId } });

    revalidatePersonEcosystem(); // 🔥
    return { success: true };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

// ==========================================
// APIS EXTERNAS - No tocan la base de datos local (solo leen o extraen)
// ==========================================

export async function fetchCandidateFromJNE(
  jne_mode: string,
  party_number_rop: string,
  dni: string,
) {
  try {
    const { user } = await serverGetUser();

    if (!user) {
      return new Response(
        JSON.stringify({ detail: "No autorizado - Debes iniciar sesión" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const accessToken = process.env.API_SECRET_KEY; // Mandamos la clave secreta compartida

    if (!party_number_rop || !dni) {
      return { success: false, error: "Faltan parámetros" };
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/votoinformado/get-hojadevida`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          jne_mode,
          party_number_rop,
          dni,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function fetchAntecedentesFromJNE(
  jne_mode: string,
  party_number_rop: string,
  dni: string,
) {
  try {
    const { user } = await serverGetUser();

    if (!user) {
      return { success: false, error: "No autorizado - Debes iniciar sesión" };
    }

    if (!party_number_rop || !dni) {
      return { success: false, error: "Faltan parámetros ROP o DNI" };
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/votoinformado/get-antecedentes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        },
        body: JSON.stringify({ jne_mode, party_number_rop, dni }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const data = await response.json();

    const antecedentes: BackgroundBase[] = (data.antecedentes || []).map(
      (item: Record<string, string | null>) => ({
        id: item.id || `new_${crypto.randomUUID()}`,
        type: item.type as BackgroundType,
        status: item.status as BackgroundStatus,
        publication_date: item.publication_date || null,
        title: item.title || "Sentencia penal",
        summary: item.summary || "",
        sanction: item.sanction || null,
        source: item.source,
        source_url: item.source_url,
      }),
    );

    return { success: true, data: antecedentes, total: data.total };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}
