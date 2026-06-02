"use server";

import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function submitReportAction(formData: FormData) {
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

    // ─── Upload de imagen (Local / S3 Ready) ──────────────────────────
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
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // TODO: En producción, cambia esto para usar AWS S3 o Cloudflare R2
        const uploadDir = path.join(process.cwd(), "public", "reports");

        // Crear carpeta si no existe
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);

        imageUrl = `/reports/${fileName}`;
      } catch (uploadError) {
        console.error("[ACTION] Error upload imagen:", uploadError);
        console.warn("[ACTION] Continuando sin imagen...");
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

    await prisma.userfeedback.create({ data: payload });

    return { success: true };
  } catch (error: unknown) {
    console.error("[ACTION] Excepción:", error);
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    return { success: false, error: `Error: ${msg}` };
  }
}
