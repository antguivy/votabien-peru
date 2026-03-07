"use client";

import { useContext, useEffect, useMemo, useRef } from "react";
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
import { useReadiness } from "@/hooks/use-readiness";

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

// ─── SVG Balanza para empty state ────────────────────────────────────────────
function ScaleIllustration() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      className="text-muted-foreground/20"
    >
      <path
        d="M32 10 V54"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 54 H44"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M14 24 H50"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 24 L10 34"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M50 24 L54 34"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M7 34 Q10 40 13 34"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M51 34 Q54 40 57 34"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14" cy="24" r="2" fill="currentColor" />
      <circle cx="50" cy="24" r="2" fill="currentColor" />
    </svg>
  );
}

export default function ComparatorLayout({
  data,
  searchAction,
}: ComparatorLayoutProps) {
  const { entities } = useContext(ComparatorContext);
  const { markComparadorInteraction } = useReadiness();
  const lastTrackedPair = useRef<string>("");

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

  // Aggregate counts for tabs
  const tabCounts = useMemo(() => {
    if (!availableFormulas.length)
      return { backgrounds: 0, biography: 0, hoja_de_vida: 0 };
    const members = availableFormulas.flatMap((f) =>
      [f.president, f.vp1, f.vp2].filter(Boolean),
    );
    return {
      backgrounds: members.reduce(
        (sum, m) => sum + (m?.backgrounds?.length ?? 0),
        0,
      ),
      biography: members.reduce(
        (sum, m) => sum + (m?.person?.detailed_biography?.length ?? 0),
        0,
      ),
      hoja_de_vida: 0, // siempre presente
    };
  }, [availableFormulas]);

  useEffect(() => {
    if (!showComparison) return;
    const pairKey = entities
      .map((e) => e.id)
      .sort()
      .join("|");
    if (pairKey === lastTrackedPair.current) return;
    lastTrackedPair.current = pairKey;
    markComparadorInteraction();
  }, [showComparison, entities, markComparadorInteraction]);

  return (
    <div className="w-full md:pt-4 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Compara fórmulas presidenciales
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
          Antecedentes, posturas y trayectorias verificadas por VotaBien Perú.
        </p>
      </div>

      {/* ── Selector ── */}
      <section>
        <PresidentialSelector
          initialSelected={entities}
          onSearch={searchAction}
        />
      </section>

      {/* ── Comparison or empty state ── */}
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
              <FormulaComparisonView
                formulas={availableFormulas}
                tabCounts={tabCounts}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ScaleIllustration />
              </motion.div>
              <p className="text-base font-bold text-foreground mt-5 mb-1">
                Aún no hay nada que comparar
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Agrega al menos 2 fórmulas presidenciales usando el selector de
                arriba.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
