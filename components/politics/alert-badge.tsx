import { cn } from "@/lib/utils";
import { RnasSanction } from "@/interfaces/person";

// ── Variants ──────────────────────────────────────────────────────────────

export type AlertVariant = "blue" | "red" | "amber" | "orange" | "slate";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300",
  red: "bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300",
  orange:
    "bg-orange-50 text-orange-700 dark:bg-orange-900/25 dark:text-orange-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
};

export function AlertBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: AlertVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold leading-tight whitespace-nowrap",
        VARIANT_CLASSES[variant],
      )}
    >
      {children}
    </span>
  );
}

// ── RNAS ──────────────────────────────────────────────────────────────────

export const SANCION_SEVERITY: Record<string, number> = {
  EXPULSION: 3,
  SUSPENSION: 2,
  MULTA: 1,
  AMONESTACION: 0,
};

export const SANCION_LABEL: Record<string, string> = {
  EXPULSION: "RNAS · Expulsado",
  SUSPENSION: "RNAS · Suspendido",
  MULTA: "RNAS · Multado",
  AMONESTACION: "RNAS · Amonestado",
};

export function getWorstActiveSanction(
  rnas: RnasSanction[] | null,
): RnasSanction | null {
  if (!rnas || rnas.length === 0) return null;
  const active = rnas.filter((s) => s.vigente === "SI");
  if (active.length === 0) return null;
  return active.reduce((worst, s) =>
    (SANCION_SEVERITY[s.tipo_sancion] ?? 0) >
    (SANCION_SEVERITY[worst.tipo_sancion] ?? 0)
      ? s
      : worst,
  );
}
