"use client";

import { useRef, useState } from "react";
import { useCopilotoStore } from "../_lib/store";
import { ElectionType, TallyItem } from "../_lib/types";
import {
  calculateTallyTotal,
  isFixedTallyId,
  normalizeTallies,
  reconcileElection,
} from "../_lib/reconciliation";
import { Plus, Trash2, Check, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ELECTIONS_INFO: {
  type: ElectionType;
  label: string;
  shortLabel: string;
  sheetCode: string;
  group: "regional" | "municipal";
}[] = [
  {
    type: "5A",
    label: "Gobernador y vicegobernador",
    shortLabel: "5A Gobernador",
    sheetCode: "Hoja 5A",
    group: "regional",
  },
  {
    type: "5B",
    label: "Consejeros regionales",
    shortLabel: "5B Consejeros",
    sheetCode: "Hoja 5B",
    group: "regional",
  },
  {
    type: "5C",
    label: "Municipal provincial",
    shortLabel: "5C Provincial",
    sheetCode: "Hoja 5C",
    group: "municipal",
  },
  {
    type: "5D",
    label: "Municipal distrital",
    shortLabel: "5D Distrital",
    sheetCode: "Hoja 5D",
    group: "municipal",
  },
];

const GROUPS = [
  { id: "regional" as const, label: "Regional", hint: "Primero" },
  {
    id: "municipal" as const,
    label: "Municipal",
    hint: "Después del cartel",
  },
];

function sheetStatus(total: number, target: number) {
  if (target <= 0) return "idle" as const;
  if (total === target) return "match" as const;
  if (total > target) return "surplus" as const;
  if (total === 0) return "empty" as const;
  return "short" as const;
}

export function TabCalculadora() {
  const votersTarget = useCopilotoStore((s) => s.votersTarget);
  const setVotersTarget = useCopilotoStore((s) => s.setVotersTarget);
  const tallies = useCopilotoStore((s) => s.tallies);
  const addTallyItem = useCopilotoStore((s) => s.addTallyItem);
  const updateTallyItem = useCopilotoStore((s) => s.updateTallyItem);
  const removeTallyItem = useCopilotoStore((s) => s.removeTallyItem);
  const clearTally = useCopilotoStore((s) => s.clearTally);
  const activeType = useCopilotoStore((s) => s.calculadoraSheet);
  const setActiveType = useCopilotoStore((s) => s.setCalculadoraSheet);

  const [addend, setAddend] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const addendRef = useRef<HTMLInputElement>(null);

  const currentItems = normalizeTallies(tallies?.[activeType]);
  const partyRows = currentItems.filter((item) => !isFixedTallyId(item.id));
  const fixedRows = currentItems.filter((item) => isFixedTallyId(item.id));
  const currentTotal = calculateTallyTotal(currentItems);
  const currentElection = ELECTIONS_INFO.find((e) => e.type === activeType)!;
  const reconciliation = reconcileElection(currentTotal, votersTarget);
  const status = sheetStatus(currentTotal, votersTarget);
  const progress =
    votersTarget > 0
      ? Math.min(100, Math.round((currentTotal / votersTarget) * 100))
      : 0;

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(addend, 10);
    if (Number.isNaN(val) || val < 0) return;
    addTallyItem(activeType, val);
    setAddend("");
    addendRef.current?.focus();
  };

  const setRowValue = (item: TallyItem, raw: string) => {
    if (raw.trim() === "") {
      updateTallyItem(activeType, item.id, 0);
      return;
    }
    const val = parseInt(raw, 10);
    if (Number.isNaN(val) || val < 0) return;
    updateTallyItem(activeType, item.id, val);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Meta del cuadre */}
      <section className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/80 bg-card">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-foreground">
            Ciudadanos que votaron
          </h3>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Firmas del padrón. Es lo que debe dar cada hoja.
          </p>
        </div>
        <Input
          type="number"
          min="0"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Total de ciudadanos que votaron"
          value={votersTarget || ""}
          onChange={(e) => setVotersTarget(parseInt(e.target.value) || 0)}
          placeholder="0"
          className="no-spinner w-24 h-12 text-center font-mono font-black text-xl bg-background border-border text-foreground focus:border-brand rounded-xl shrink-0"
        />
      </section>

      {/* Selector de hoja */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GROUPS.map((group) => (
          <div key={group.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between px-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {group.hint}
              </span>
            </div>
            <div className="flex gap-2">
              {ELECTIONS_INFO.filter((info) => info.group === group.id).map(
                (info) => {
                  const total = calculateTallyTotal(tallies?.[info.type]);
                  const chipStatus = sheetStatus(total, votersTarget);
                  const isCurrent = activeType === info.type;
                  const chipClass =
                    chipStatus === "match"
                      ? isCurrent
                        ? "bg-emerald-600 text-white border-emerald-700"
                        : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/40"
                      : chipStatus === "surplus"
                        ? isCurrent
                          ? "bg-destructive text-white border-destructive"
                          : "bg-destructive/10 text-destructive border-destructive/40"
                        : chipStatus === "short"
                          ? isCurrent
                            ? "bg-amber-600 text-white border-amber-700"
                            : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40"
                          : isCurrent
                            ? "bg-foreground text-background border-foreground"
                            : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground";

                  return (
                    <button
                      key={info.type}
                      type="button"
                      onClick={() => setActiveType(info.type)}
                      className={`flex-1 min-w-0 inline-flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-[0.98] ${chipClass}`}
                      aria-pressed={isCurrent}
                    >
                      <span className="truncate">{info.shortLabel}</span>
                      <span className="font-mono text-[10px] shrink-0 inline-flex items-center gap-0.5">
                        {chipStatus === "match" ? (
                          <Check className="h-3 w-3 stroke-[3]" />
                        ) : (
                          total
                        )}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cuadre */}
      <SheetVerdict
        status={status}
        total={currentTotal}
        target={votersTarget}
        progress={progress}
        difference={reconciliation.difference}
      />

      {/* Suma de la hoja */}
      <section className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <header className="px-4 py-2.5 border-b border-border/60 flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand">
            {currentElection.sheetCode}
          </span>
          <span className="text-xs font-semibold text-foreground truncate">
            {currentElection.label}
          </span>
        </header>

        <form
          onSubmit={handleAdd}
          className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-border/60"
        >
          <Input
            ref={addendRef}
            type="number"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            value={addend}
            onChange={(e) => setAddend(e.target.value)}
            placeholder="Cantidad"
            aria-label="Cantidad a sumar"
            className="no-spinner h-11 flex-1 font-mono text-base rounded-xl bg-background"
          />
          <Button
            type="submit"
            disabled={!addend.trim()}
            className="h-11 px-4 rounded-xl bg-brand text-brand-foreground font-semibold shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Sumar</span>
          </Button>
        </form>

        <div className="divide-y divide-border/50">
          {partyRows.length === 0 ? (
            <p className="px-4 py-5 text-xs text-muted-foreground">
              Agrega cada subtotal de la hoja.
            </p>
          ) : (
            partyRows.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 sm:px-4 py-2"
              >
                <span className="w-6 text-[10px] font-mono font-bold text-muted-foreground shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="flex-1" />
                <Input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label={`Sumando ${idx + 1}`}
                  value={item.value === 0 ? "" : String(item.value)}
                  placeholder="0"
                  onChange={(e) => setRowValue(item, e.target.value)}
                  className="no-spinner w-[4.75rem] h-10 text-center font-mono font-bold text-base rounded-lg bg-background"
                />
                <button
                  type="button"
                  onClick={() => removeTallyItem(activeType, item.id)}
                  className="w-8 h-8 inline-flex items-center justify-center text-muted-foreground hover:text-destructive rounded-lg shrink-0"
                  aria-label={`Quitar sumando ${idx + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="bg-muted/30 border-t border-border/70">
          <p className="px-4 pt-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Cierre de la hoja
          </p>
          {fixedRows.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 sm:px-4 py-2"
            >
              <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                {item.label}
              </span>
              <Input
                type="number"
                min="0"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label={`Votos de ${item.label}`}
                value={item.value === 0 ? "" : String(item.value)}
                placeholder="0"
                onChange={(e) => setRowValue(item, e.target.value)}
                className="no-spinner w-[4.75rem] h-10 text-center font-mono font-bold text-base rounded-lg bg-background"
              />
              <span className="w-8 shrink-0" />
            </div>
          ))}
          <p className="px-4 pb-3 text-[11px] text-muted-foreground leading-snug">
            No anotes aquí un impugnado que la mesa ya resolvió.
          </p>
        </div>

        <footer className="px-4 py-3 border-t border-border/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="text-[11px] font-mono text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reiniciar hoja
          </button>
          <p className="font-mono font-black text-lg leading-none text-foreground">
            {currentTotal}
            {votersTarget > 0 && (
              <span className="text-sm font-semibold text-muted-foreground">
                {" "}
                / {votersTarget}
              </span>
            )}
          </p>
        </footer>
      </section>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {`¿Reiniciar ${currentElection.sheetCode}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se borran los sumandos de esta hoja y blancos, nulos e impugnados
              vuelven a cero. Las demás hojas no cambian. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearTally(activeType)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SheetVerdict({
  status,
  total,
  target,
  progress,
  difference,
}: {
  status: "idle" | "empty" | "short" | "match" | "surplus";
  total: number;
  target: number;
  progress: number;
  difference: number;
}) {
  if (status === "idle") {
    return (
      <p className="text-[11px] text-muted-foreground px-1">
        Anota el padrón para poder cuadrar.
      </p>
    );
  }

  const barClass =
    status === "match"
      ? "bg-emerald-600"
      : status === "surplus"
        ? "bg-destructive"
        : status === "short"
          ? "bg-amber-500"
          : "bg-muted-foreground/30";

  const copy =
    status === "match"
      ? "Cuadra. Ya puedes copiar la hoja al acta."
      : status === "surplus"
        ? `Sobran ${difference}. Revisa un sumando repetido.`
        : status === "empty"
          ? `Faltan ${target}.`
          : `Faltan ${target - total}.`;

  return (
    <div className="space-y-1.5 px-0.5">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span
          className={`font-medium inline-flex items-center gap-1 ${
            status === "match"
              ? "text-emerald-700 dark:text-emerald-300"
              : status === "surplus"
                ? "text-destructive"
                : "text-muted-foreground"
          }`}
        >
          {status === "match" && <Check className="h-3.5 w-3.5" />}
          {status === "surplus" && <AlertTriangle className="h-3.5 w-3.5" />}
          {copy}
        </span>
        <span className="font-mono font-bold text-foreground shrink-0">
          {total}/{target}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${status === "empty" ? 0 : progress}%` }}
        />
      </div>
    </div>
  );
}
