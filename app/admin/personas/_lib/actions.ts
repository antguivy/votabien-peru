"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createId } from "@paralleldrive/cuid2";
import { type TablesInsert, type TablesUpdate } from "@/interfaces/supabase";
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

export async function createPerson(data: CreatePersonRequest) {
  const supabase = await createClient();

  try {
    if (data.dni) {
      const { data: existingPerson, error: checkError } = await supabase
        .from("person")
        .select("id, fullname, dni")
        .eq("dni", data.dni)
        .maybeSingle();

      if (checkError) {
        console.error("[createPerson] Error al verificar DNI:", checkError);
        throw checkError;
      }

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

    // Preparar datos optimizados para inserción
    const personData: TablesInsert<"person"> = {
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

      // Campos JSON - Solo guardar si tienen datos
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

      // Redes sociales
      facebook_url: toNullIfEmpty(data.facebook_url),
      twitter_url: toNullIfEmpty(data.twitter_url),
      instagram_url: toNullIfEmpty(data.instagram_url),
      tiktok_url: toNullIfEmpty(data.tiktok_url),
    };

    const { data: person, error: personError } = await supabase
      .from("person")
      .insert(personData)
      .select()
      .single();

    if (personError) {
      console.error("[createPerson] Error al insertar persona:", personError);
      throw personError;
    }

    revalidatePath("/admin/personas");
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
  const supabase = await createClient();

  try {
    if (!data.id) {
      throw new Error("ID de la persona es requerido para actualizar");
    }

    // Validar si el DNI ya existe en otra persona
    if (data.dni) {
      const { data: existingPerson, error: checkError } = await supabase
        .from("person")
        .select("id, fullname, dni")
        .eq("dni", data.dni)
        .neq("id", data.id) // Excluir la persona actual
        .maybeSingle();

      if (checkError) {
        console.error("[updatePerson] Error al verificar DNI:", checkError);
        throw checkError;
      }

      if (existingPerson) {
        throw new Error(
          `Ya existe otra persona registrada con el DNI ${data.dni}: ${existingPerson.fullname}`,
        );
      }
    }

    const personData: TablesUpdate<"person"> = {
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

      // Campos JSON
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

    const { data: person, error: personError } = await supabase
      .from("person")
      .update(personData)
      .eq("id", data.id)
      .select()
      .single();

    if (personError) {
      console.error("[updatePerson] Error al actualizar persona:", personError);
      throw personError;
    }

    revalidatePath("/admin/personas");
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
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("person").delete().eq("id", personId);

    if (error) throw error;

    revalidatePath("/admin/personas");
    return { success: true, message: "Persona eliminada exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function bulkDeletePersons(personIds: string[]) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("person")
      .delete()
      .in("id", personIds);

    if (error) throw error;

    revalidatePath("/admin/personas");
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

export async function searchPersonByDNI(dni: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("person")
      .select("id, dni, fullname, image_url")
      .eq("dni", dni)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found

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

// URLs bloqueadas para nuevos registros
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
  const supabase = await createClient();

  try {
    // Filtrar entradas con source_url bloqueadas
    const filteredBiography = biography.filter(
      (item) => !isBlockedSourceUrl(item.source_url),
    );

    const { data, error } = await supabase
      .from("person")
      .update({
        detailed_biography: toJsonInsert(filteredBiography),
      })
      .eq("id", personId)
      .select("id, fullname, detailed_biography")
      .single();

    if (error) throw error;

    revalidatePath("/admin/personas");
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function insertPersonBackgrounds(
  personId: string,
  backgrounds: BackgroundBase[],
) {
  const supabase = await createClient();

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

    const { error } = await supabase.from("background").insert(insertData);
    if (error) throw new Error(`Error al insertar: ${error.message}`);

    revalidatePath("/admin/personas");
    return { success: true, inserted: insertData.length };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updatePersonBackgrounds(
  personId: string,
  backgrounds: BackgroundBase[],
) {
  const supabase = await createClient();

  try {
    const newItems = backgrounds.filter((item) => item.id.startsWith("new_"));
    const existingItems = backgrounds.filter(
      (item) => !item.id.startsWith("new_"),
    );
    const existingIds = existingItems.map((item) => item.id);

    // 1. Eliminar los que ya no están en el array
    let deleteQuery = supabase
      .from("background")
      .delete()
      .eq("person_id", personId);

    if (existingIds.length > 0) {
      deleteQuery = deleteQuery.not("id", "in", `(${existingIds.join(",")})`);
    }
    // Si existingIds está vacío, borra todos los existentes (el usuario los eliminó todos)

    const { error: deleteError } = await deleteQuery;
    if (deleteError)
      throw new Error(`Error al eliminar: ${deleteError.message}`);

    // 2. INSERT los nuevos
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

      const { error: insertError } = await supabase
        .from("background")
        .insert(insertData);
      if (insertError)
        throw new Error(`Error al insertar: ${insertError.message}`);
    }

    // 3. UPDATE los existentes
    for (const item of existingItems) {
      const { error: updateError } = await supabase
        .from("background")
        .update({
          type: item.type,
          status: item.status as BackgroundStatus,
          title: item.title,
          summary: item.summary,
          sanction: cleanForDb(item.sanction),
          source: item.source,
          source_url: cleanForDb(item.source_url),
          publication_date: cleanForDb(item.publication_date),
        })
        .eq("id", item.id)
        .eq("person_id", personId);

      if (updateError)
        throw new Error(`Error al actualizar: ${updateError.message}`);
    }

    revalidatePath("/admin/personas");
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
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("background")
      .delete()
      .eq("id", backgroundId);

    if (error) throw error;

    revalidatePath("/admin/personas");
    return { success: true };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function fetchCandidateFromJNE(
  jne_mode: string,
  party_number_rop: string,
  dni: string,
) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({ detail: "No autorizado - Debes iniciar sesión" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const accessToken = session.access_token;

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
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
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
          Authorization: `Bearer ${session.access_token}`,
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

    // Mapear al formato BackgroundBase que espera el frontend
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
