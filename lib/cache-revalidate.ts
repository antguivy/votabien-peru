import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";

/**
 * Revalida de forma exhaustiva e inmediata todo el ecosistema relacionado a personas,
 * candidatos y legisladores (panel admin + vistas públicas + cachés en memoria/disco).
 */
export function revalidatePersonEcosystem() {
  // 1. Bandejas y vistas administrativas
  revalidatePath("/admin/personas");
  revalidatePath("/admin/candidatos");
  revalidatePath("/admin/legisladores");
  revalidatePath("/admin/candidatos/revisiones");
  revalidatePath("/admin/legisladores/revisiones");

  // 2. Vistas públicas (revalidar layouts y páginas dinámicas)
  revalidatePath("/legisladores", "layout");
  revalidatePath("/candidatos", "layout");
  revalidatePath("/comparador", "layout");
  revalidatePath("/candidatos/[candidatosId]", "page");
  revalidatePath("/legisladores/[legisladoresId]", "page");
  revalidatePath("/", "layout");

  // 3. Invalidación inmediata de tags de datos (Next.js 16)
  // Siempre ejecutamos revalidateTag para invalidar el Data Cache en todas las instancias y clientes.
  try {
    revalidateTag(TAGS.persons, { expire: 0 });
    revalidateTag(TAGS.candidates, { expire: 0 });
    revalidateTag(TAGS.legislators, { expire: 0 });
  } catch (err) {
    console.warn("revalidateTag warning:", err);
  }

  // En Server Actions usamos updateTag para purga inmediata en el cliente activo.
  try {
    updateTag(TAGS.persons);
    updateTag(TAGS.candidates);
    updateTag(TAGS.legislators);
  } catch {
    // Silencioso si se ejecuta fuera de Server Action
  }
}
