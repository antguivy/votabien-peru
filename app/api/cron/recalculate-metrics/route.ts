import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { executeBatchRecalculateLegislatorMetrics } from "@/lib/services/legislator-metrics";

/**
 * Route Handler para ejecución programada (Cron Job) del recálculo de métricas de legisladores.
 * Puede ser invocado por Vercel Cron, GitHub Actions, pg_cron o scripts externos autorizados.
 *
 * Headers esperados:
 * - Authorization: Bearer <CRON_SECRET | API_SECRET_KEY>
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.API_SECRET_KEY;

    // Validación de seguridad para prevenir ejecuciones no autorizadas
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("periodId") || undefined;

    const result = await executeBatchRecalculateLegislatorMetrics({ periodId });

    // Revalidación de tags de caché para mantener la plataforma fresca
    try {
      revalidateTag(TAGS.legislators, "max");
      revalidatePath("/admin/legisladores");
      revalidatePath("/legisladores");
    } catch (cacheErr) {
      console.warn("Advertencia al revalidar caché en cron:", cacheErr);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Error en cron recalculate-metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno en cron",
      },
      { status: 500 },
    );
  }
}

// Soporte también para GET si el scheduler solo emite GET
export async function GET(request: Request) {
  return POST(request);
}
