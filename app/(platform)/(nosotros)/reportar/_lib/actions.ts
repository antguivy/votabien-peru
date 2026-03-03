// app/reportar/_lib/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitReportAction(formData: FormData) {
  // Usamos el cliente de servidor → tiene service_role → bypasea RLS
  const supabase = await createClient();

  try {
    const type = formData.get("type") as string;
    const email = (formData.get("email") as string) || null;
    const message = (formData.get("message") as string) || null;
    const referenceUrl = (formData.get("referenceUrl") as string) || null;
    const candidateName = (formData.get("candidateName") as string) || null;
    const candidateUrl = (formData.get("candidateUrl") as string) || null;
    const correctionField = (formData.get("correctionField") as string) || null;
    const currentValue = (formData.get("currentValue") as string) || null;
    const correctValue = (formData.get("correctValue") as string) || null;
    const sourceUrl = (formData.get("sourceUrl") as string) || null;
    const imageFile = formData.get("imageFile") as File | null;

    // Validaciones
    if (!type) return { success: false, error: "El tipo es obligatorio." };
    if (type !== "correccion_candidato" && !message)
      return { success: false, error: "El detalle es obligatorio." };
    if (type === "correccion_candidato" && !candidateName)
      return {
        success: false,
        error: "El nombre del candidato es obligatorio.",
      };
    if (type === "correccion_candidato" && !correctionField)
      return { success: false, error: "Indica qué campo está incorrecto." };

    // ─── Upload de imagen (server-side, bypasea RLS) ──────────────────────────
    let imageUrl: string | null = null;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          error: "La imagen no puede superar los 5 MB.",
        };
      }

      const ext = (imageFile.name.split(".").pop() ?? "jpg")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const filePath = `reports/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("report-screenshots")
        .upload(filePath, buffer, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("[ACTION] Error upload imagen:", uploadError);
        // No bloqueamos el envío si falla la imagen — guardamos el reporte igual
        console.warn("[ACTION] Continuando sin imagen...");
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("report-screenshots")
          .getPublicUrl(uploadData.path);
        imageUrl = publicUrl;
      }
    }

    // ─── Insert en DB ─────────────────────────────────────────────────────────
    const payload = {
      type,
      status: "pendiente",
      email,
      message,
      image_url: imageUrl,
      reference_url: referenceUrl,
      candidate_name: candidateName,
      candidate_url: candidateUrl,
      correction_field: correctionField,
      current_value: currentValue,
      correct_value: correctValue,
      source_url: sourceUrl,
    };

    const { error: dbError } = await supabase
      .from("userfeedback")
      .insert([payload]);

    if (dbError) {
      console.error("[ACTION] Error DB:", dbError);
      throw dbError;
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("[ACTION] Excepción:", error);
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    return { success: false, error: `Error: ${msg}` };
  }
}
