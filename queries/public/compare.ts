import { createClient } from "@/lib/supabase/server";
import {
  ComparisonResponse,
  LegislatorCompareItem,
} from "@/interfaces/comparator";
import { ChamberType, LegislatorCondition } from "@/interfaces/politics";
import {
  LegislatorMetricsBase,
  LegislatorMetricsWithComputed,
} from "@/interfaces/legislator-metrics";
import { PostgrestError } from "@supabase/supabase-js";

// Función para agregar campos computados a las métricas
function computeMetrics(
  base: LegislatorMetricsBase,
): LegislatorMetricsWithComputed {
  // bills_in_progress: Proyectos que están en proceso activo
  const bills_in_progress = base.bills_presentado + base.bills_en_comision;

  // bills_finished: Proyectos que llegaron a su fin exitosamente
  const bills_finished = base.bills_aprobado;

  // bills_rejected: Proyectos rechazados o archivados
  const bills_rejected =
    base.bills_rechazado +
    base.bills_al_archivo +
    base.bills_decreto_archivo +
    base.bills_retirado_por_autor;

  return {
    ...base,
    bills_in_progress,
    bills_finished,
    bills_rejected,
  };
}

export async function getLegislatorsComparison(
  ids: string[],
): Promise<ComparisonResponse | null> {
  const supabase = await createClient();

  // Validaciones
  if (ids.length < 2 || ids.length > 4) return null;
  const uniqueIds = Array.from(new Set(ids));

  // 1. QUERY DE LEGISLADORES
  const { data: legislatorsData, error: legError } = (await supabase
    .from("legislator")
    .select(
      `
      id,
      chamber,
      condition,
      active,
      start_date,
      end_date,
      person:person_id!inner ( id, fullname, dni, image_url, image_candidate_url, profession ),
      electoral_district:electoral_district_id ( id, name, code ),
      current_parliamentary_group
    `,
    )
    .in("id", uniqueIds)) as {
    data: Array<{
      id: string;
      chamber: ChamberType;
      condition: LegislatorCondition;
      active: boolean;
      start_date: string;
      end_date: string | null;
      person: {
        id: string;
        fullname: string;
        dni: string | null;
        image_url: string | null;
        image_candidate_url: string | null;
        profession: string | null;
      };
      electoral_district: {
        id: string;
        name: string;
        code: string;
      };
      current_parliamentary_group: {
        id: string;
        name: string;
        acronym: string | null;
        color_hex: string | null;
        logo_url: string | null;
      } | null;
    }> | null;
    error: PostgrestError | null;
  };

  if (legError || !legislatorsData) {
    console.error("Error fetching legislators:", legError);
    return null;
  }

  // 2. QUERY DE MÉTRICAS
  const { data: metricsData } = await supabase
    .from("legislatormetrics")
    .select("*")
    .in("legislator_id", uniqueIds);

  // 3. MAPEO Y CONSTRUCCIÓN DE RESPUESTA
  const items: LegislatorCompareItem[] = uniqueIds.map((id) => {
    const leg = legislatorsData.find((l) => l.id === id);

    if (!leg) {
      return {
        legislator_id: id,
        legislator_name: null,
        status: "not_found" as const,
        message: "Legislador no encontrado",
        data: null,
      };
    }

    const metricsRaw = metricsData?.find((m) => m.legislator_id === id);

    if (!metricsRaw) {
      return {
        legislator_id: id,
        legislator_name: leg.person.fullname,
        status: "no_metrics" as const,
        message: "Métricas aún no calculadas",
        data: null,
      };
    }

    // Computar métricas adicionales
    const metricsComputed = computeMetrics(
      metricsRaw as unknown as LegislatorMetricsBase,
    );

    return {
      legislator_id: id,
      legislator_name: leg.person.fullname,
      status: "available" as const,
      message: null,
      data: {
        legislator: {
          id: leg.id,
          chamber: leg.chamber,
          condition: leg.condition,
          active: leg.active,
          person: {
            id: leg.person.id,
            fullname: leg.person.fullname,
            image_url: leg.person.image_url,
            image_candidate_url: leg.person.image_candidate_url,
            profession: leg.person.profession,
            dni: leg.person.dni,
          },
          electoral_district: {
            id: leg.electoral_district.id,
            name: leg.electoral_district.name,
          },
          current_parliamentary_group: leg.current_parliamentary_group,
        },
        metrics: metricsComputed,
      },
    };
  });

  const totalAvailable = items.filter((i) => i.status === "available").length;

  return {
    total_requested: uniqueIds.length,
    total_available: totalAvailable,
    comparison_date: new Date().toISOString(),
    items: items,
  };
}
