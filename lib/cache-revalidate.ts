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

  // 2. Vistas públicas (los layouts revalidan automáticamente las páginas dinámicas hijas /[id])
  revalidatePath("/legisladores", "layout");
  revalidatePath("/candidatos", "layout");
  revalidatePath("/comparador", "layout");
  revalidatePath("/");

  // 3. Invalidación inmediata de tags de datos (Next.js 16)
  // En Server Actions usamos updateTag (purga inmediata de caché en disco/memoria).
  // En Route Handlers/Webhooks usamos fallback a revalidateTag con expire: 0.
  try {
    updateTag(TAGS.persons);
    updateTag(TAGS.candidates);
    updateTag(TAGS.legislators);
  } catch {
    revalidateTag(TAGS.persons, { expire: 0 });
    revalidateTag(TAGS.candidates, { expire: 0 });
    revalidateTag(TAGS.legislators, { expire: 0 });
  }
}
