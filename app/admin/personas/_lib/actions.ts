"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createId } from "@paralleldrive/cuid2";
import {
  Json,
  type TablesInsert,
  type TablesUpdate,
} from "@/interfaces/supabase";
import {
  BiographyDetail,
  CreatePersonRequest,
  UpdatePersonRequest,
} from "@/interfaces/person";
import { BackgroundBase, BackgroundStatus } from "@/interfaces/background";
import { API_BASE_URL } from "@/lib/config";
import { extractErrorMessage } from "@/lib/error-handler";

const prepareJsonField = <T>(data: T[] | undefined | null): Json => {
  if (!data || data.length === 0) return null;
  return data as Json;
};

const toNullIfEmpty = (value: string | null | undefined): string | null => {
  if (!value || value.trim() === "") return null;
  return value;
};

export async function createPerson(data: CreatePersonRequest) {
  const supabase = await createClient();

  try {
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
      birth_date: toNullIfEmpty(data.birth_date),
      place_of_birth: toNullIfEmpty(data.place_of_birth),
      profession: toNullIfEmpty(data.profession),

      // Campos JSON - Solo guardar si tienen datos
      secondary_school: data.secondary_school,
      no_university_education: prepareJsonField(data.no_university_education),
      technical_education: prepareJsonField(data.technical_education),
      university_education: prepareJsonField(data.university_education),
      postgraduate_education: prepareJsonField(data.postgraduate_education),
      work_experience: prepareJsonField(data.work_experience),
      political_role: prepareJsonField(data.political_role),
      popular_election: prepareJsonField(data.popular_election),
      incomes: prepareJsonField(data.incomes),
      assets: prepareJsonField(data.assets),

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

    if (personError) throw personError;

    revalidatePath("/admin/personas");
    return { success: true, data: person };
  } catch (error) {
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
      technical_education: prepareJsonField(data.technical_education),
      no_university_education: prepareJsonField(data.no_university_education),
      university_education: prepareJsonField(data.university_education),
      postgraduate_education: prepareJsonField(data.postgraduate_education),
      work_experience: prepareJsonField(data.work_experience),
      political_role: prepareJsonField(data.political_role),
      popular_election: prepareJsonField(data.popular_election),
      incomes: prepareJsonField(data.incomes),
      assets: prepareJsonField(data.assets),

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

    if (personError) throw personError;

    revalidatePath("/admin/personas");
    return { success: true, data: person };
  } catch (error) {
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

export async function updatePersonBiography(
  personId: string,
  biography: BiographyDetail[],
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("person")
      .update({
        detailed_biography: prepareJsonField(biography),
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

const cleanForDb = (val: string | null | undefined) => {
  if (!val || val.trim() === "") return null;
  return val.trim();
};

export async function updatePersonBackgrounds(
  personId: string,
  backgrounds: BackgroundBase[],
) {
  const supabase = await createClient();

  try {
    const upsertData = backgrounds.map((item) => {
      const isNew = item.id.startsWith("new_");
      const realId = isNew ? crypto.randomUUID() : item.id;
      return {
        id: realId,
        person_id: personId,
        type: item.type,
        status: item.status as BackgroundStatus,
        title: item.title,
        summary: item.summary,
        sanction: cleanForDb(item.sanction),
        source: item.source,
        source_url: cleanForDb(item.source_url),
        publication_date: cleanForDb(item.publication_date),
      };
    });
    const { error: upsertError } = await supabase
      .from("background")
      .upsert(upsertData, { onConflict: "id" });

    if (upsertError) {
      console.error("❌ Error en UPSERT:", upsertError);
      throw new Error(`Error al guardar: ${upsertError.message}`);
    }

    const currentIds = upsertData.map((d) => d.id);

    let deleteQuery = supabase
      .from("background")
      .delete()
      .eq("person_id", personId);

    if (currentIds.length > 0) {
      const formattedIds = `(${currentIds.map((id) => `"${id}"`).join(",")})`;
      deleteQuery = deleteQuery.filter("id", "not.in", formattedIds);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error("❌ Error en DELETE:", deleteError);
      throw new Error(`Error al limpiar antiguos: ${deleteError.message}`);
    }

    revalidatePath("/admin/personas");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function fetchCandidateFromJNE(
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
