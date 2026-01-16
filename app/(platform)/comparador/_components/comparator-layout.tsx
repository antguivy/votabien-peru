"use client";

import { useContext, useMemo } from "react";
import { useQueryStates } from "nuqs";
import { ComparatorContext } from "@/components/context/comparator";
import {
  SearchableEntity,
  EntityType,
  CandidateConfigKeys,
} from "@/interfaces/ui-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComparisonResponse,
  LegislatorComparison,
  CandidateComparison,
  LegislatorCompareItem,
  CandidateCompareItem,
  LegislatorWithMetrics,
  CandidateWithMetrics,
} from "@/interfaces/comparator";

// Components
import ComparisonView from "./comparison-table";
import FilterSystem from "./filter-system";

// UI
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, AlertCircle } from "lucide-react";
import AsyncEntitySelector from "./selector";
import { ChamberType } from "@/interfaces/politics";

interface ComparatorLayoutProps {
  data: ComparisonResponse;
  searchAction: (query: string) => Promise<SearchableEntity[]>;
}

// ============================================
// PARSERS PARA NUQS (deben coincidir con FilterSystem)
// ============================================

const filterParsers = {
  mode: {
    parse: (v: string) => v || "legislator",
    serialize: (v: string) => v,
  },
  chamber: { parse: (v: string) => v || "", serialize: (v: string) => v },
  type: { parse: (v: string) => v || "", serialize: (v: string) => v },
  districts: { parse: (v: string) => v || "", serialize: (v: string) => v },
  parties: { parse: (v: string) => v || "", serialize: (v: string) => v },
  // process_id: {
  //   parse: (v: string) => v || "elecciones-2026",
  //   serialize: (v: string) => v,
  // },
  // active_only: {
  //   parse: (v: string) => v === "true",
  //   serialize: (v: boolean) => String(v),
  // },
};

// ============================================
// TYPE GUARDS
// ============================================

function isLegislatorComparison(
  data: ComparisonResponse,
): data is LegislatorComparison {
  return (
    data !== null &&
    "items" in data &&
    data.items.length > 0 &&
    "legislator_id" in data.items[0]
  );
}

function isCandidateComparison(
  data: ComparisonResponse,
): data is CandidateComparison {
  return (
    data !== null &&
    "items" in data &&
    data.items.length > 0 &&
    "candidate_id" in data.items[0]
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ComparatorLayout({
  data,
  searchAction,
}: ComparatorLayoutProps) {
  const { entities } = useContext(ComparatorContext);

  // ✅ ÚNICA FUENTE DE VERDAD: URL vía nuqs
  const [filters] = useQueryStates(filterParsers, {
    history: "replace",
    shallow: false,
  });

  // Derivar category del mode
  const category = useMemo(() => {
    if (!filters.mode) return null;
    return filters.mode.includes("candidate") ? "candidate" : "legislator";
  }, [filters.mode]);

  const filtersComplete = Boolean(category && filters.mode);

  // ✅ Calcular disponibilidad
  const showComparison =
    data !== null &&
    data.items.filter((item) => item.status === "available").length >= 2;

  // ✅ Enhanced search con validación
  const enhancedSearchAction = async (
    query: string,
  ): Promise<SearchableEntity[]> => {
    try {
      const results = await searchAction(query);

      if (!results || !Array.isArray(results)) {
        console.warn("⚠️ searchAction returned invalid data:", results);
        return [];
      }

      return results;
    } catch (error) {
      console.error("💥 Enhanced search error:", error);
      return [];
    }
  };

  // ✅ Preparar datos para ComparisonView según el tipo
  const comparisonData: {
    legislators?: LegislatorWithMetrics[];
    candidates?: CandidateWithMetrics[];
  } | null = useMemo(() => {
    if (!data) return null;

    if (filters.mode === "legislator" && isLegislatorComparison(data)) {
      return {
        legislators: data.items
          .filter(
            (
              item,
            ): item is LegislatorCompareItem & {
              status: "available";
              data: NonNullable<LegislatorCompareItem["data"]>;
            } => item.status === "available" && item.data !== null,
          )
          .map((item) => item.data),
      };
    }

    if (filters.mode !== "legislator" && isCandidateComparison(data)) {
      return {
        candidates: data.items
          .filter(
            (
              item,
            ): item is CandidateCompareItem & {
              status: "available";
              data: NonNullable<CandidateCompareItem["data"]>;
            } => item.status === "available" && item.data !== null,
          )
          .map((item) => item.data),
      };
    }

    return null;
  }, [data, filters.mode]);

  return (
    <div className="container mx-auto w-full py-6 px-4 md:px-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* ============================================
            SIDEBAR: FilterSystem
            ============================================ */}
        <aside className="lg:sticky lg:top-22 h-fit">
          <FilterSystem />
        </aside>

        {/* ============================================
            MAIN CONTENT
            ============================================ */}
        <main className="space-y-6">
          {filtersComplete ? (
            <section>
              <AsyncEntitySelector
                mode={filters.mode as EntityType}
                initialSelected={entities}
                onSearch={enhancedSearchAction}
                maxSlots={4}
                showMetricsWarning={true}
                chamber={(filters.chamber as ChamberType) || undefined}
                type={(filters.type as CandidateConfigKeys) || undefined}
                district={filters.districts || undefined}
                party={filters.parties || undefined}
              />
            </section>
          ) : (
            <section>
              <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Configura los filtros
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-200">
                  Selecciona el tipo y cargo que deseas comparar.
                </AlertDescription>
              </Alert>
            </section>
          )}

          {filtersComplete && (
            <>
              <Separator />

              <section className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  {showComparison && comparisonData ? (
                    <motion.div
                      key="comparison-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="mb-6 flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight">
                            Análisis Comparativo
                          </h2>
                          <p className="text-muted-foreground text-sm">
                            {filters.mode === "legislator"
                              ? "Contrastando desempeño legislativo oficial."
                              : "Evaluación de perfiles y hojas de vida."}
                          </p>
                        </div>
                      </div>
                      <ComparisonView
                        {...comparisonData}
                        mode={filters.mode as EntityType}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto"
                    >
                      <div className="bg-muted/30 p-6 rounded-full mb-6">
                        <BarChart3 className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        Esperando contendientes
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Selecciona al menos 2{" "}
                        {filters.mode === "legislator"
                          ? "congresistas"
                          : "candidatos"}{" "}
                        con datos disponibles para generar la matriz de
                        comparación.
                      </p>

                      {/* <Alert
                        variant="default"
                        className="bg-blue-50/50 border-blue-100 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-300 text-left"
                      >
                        <Info className="h-4 w-4" />
                        <AlertTitle>¿Sabías que?</AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                          {filters.mode === "legislator"
                            ? "Puedes comparar legisladores de diferentes bancadas para ver quién tiene mayor tasa de éxito en sus proyectos."
                            : "Podrás comparar el patrimonio declarado vs. los años de experiencia laboral."}
                        </AlertDescription>
                      </Alert> */}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
