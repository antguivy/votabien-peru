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

export async function updatePersonBiography(
  personId: string,
  biography: BiographyDetail[],
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("person")
      .update({
        detailed_biography: toJsonInsert(biography),
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
      return {
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
