"use client";

import { useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComparatorContext } from "@/components/context/comparator";
import { SearchableEntity } from "@/interfaces/ui-types";
import {
  ComparisonResponse,
  FormulaComparison,
  FormulaCompareItem,
  FormulaWithData,
} from "@/interfaces/comparator";

import PresidentialSelector from "./selector";
import FormulaComparisonView from "./formula-comparison-view";

interface ComparatorLayoutProps {
  data: ComparisonResponse;
  searchAction: (query: string) => Promise<SearchableEntity[]>;
}

function isFormulaComparison(
  data: ComparisonResponse,
): data is FormulaComparison {
  return (
    data !== null &&
    "items" in data &&
    Array.isArray(data.items) &&
    data.items.length > 0 &&
    "president_id" in data.items[0]
  );
}

export default function ComparatorLayout({
  data,
  searchAction,
}: ComparatorLayoutProps) {
  const { entities } = useContext(ComparatorContext);

  const availableFormulas = useMemo<FormulaWithData[]>(() => {
    if (!data || !isFormulaComparison(data)) return [];
    return data.items
      .filter(
        (
          item,
        ): item is FormulaCompareItem & {
          status: "available";
          data: FormulaWithData;
        } => item.status === "available" && item.data !== null,
      )
      .map((item) => item.data);
  }, [data]);

  const showComparison = availableFormulas.length >= 2;

  return (
    <div className="w-full md:pt-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compara fórmulas presidenciales
        </h1>
        {/* <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
          Información verificada sobre antecedentes, posturas públicas y
          trayectorias, investigada y documentada por VotaBien Perú.
        </p> */}
      </div>

      {/* Selector */}
      <section>
        <PresidentialSelector
          initialSelected={entities}
          onSearch={searchAction}
        />
      </section>

      {/* Comparison or empty */}
      <section className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {showComparison ? (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <FormulaComparisonView formulas={availableFormulas} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center max-w-xs mx-auto"
            >
              <div className="text-4xl mb-4 opacity-30">⚖️</div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Selecciona las fórmulas a comparar
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Agrega al menos 2 candidatos presidenciales para ver la
                comparación.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
