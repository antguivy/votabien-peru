"use client";

import { useState, useRef } from "react";
import { useCopilotoStore } from "../_lib/store";
import { ElectionType, TallyItem } from "../_lib/types";
import { calculateTallyTotal, reconcileElection } from "../_lib/reconciliation";
import {
  Users,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  RotateCcw,
  Pencil,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ELECTIONS_INFO: {
  type: ElectionType;
  num: string;
  label: string;
  shortLabel: string;
  sheetCode: string;
}[] = [
  {
    type: "5A",
    num: "01",
    label: "5A: Gobernador y Vicegobernador",
    shortLabel: "5A Gobernador",
    sheetCode: "Hoja Borrador 5A",
  },
  {
    type: "5B",
    num: "02",
    label: "5B: Consejeros Regionales",
    shortLabel: "5B Consejeros",
    sheetCode: "Hoja Borrador 5B",
  },
  {
    type: "5C",
    num: "03",
    label: "5C: Alcalde Provincial",
    shortLabel: "5C Provincial",
    sheetCode: "Hoja Borrador 5C",
  },
  {
    type: "5D",
    num: "04",
    label: "5D: Alcalde Distrital",
    shortLabel: "5D Distrital",
    sheetCode: "Hoja Borrador 5D",
  },
];

export function TabCalculadora() {
  const votersTarget = useCopilotoStore((s) => s.votersTarget);
  const setVotersTarget = useCopilotoStore((s) => s.setVotersTarget);
  const tallies = useCopilotoStore((s) => s.tallies);
  const addTallyItem = useCopilotoStore((s) => s.addTallyItem);
  const updateTallyItem = useCopilotoStore((s) => s.updateTallyItem);
  const removeTallyItem = useCopilotoStore((s) => s.removeTallyItem);
  const clearTally = useCopilotoStore((s) => s.clearTally);

  const [activeType, setActiveType] = useState<ElectionType>("5A");
  const [inputValue, setInputValue] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const currentItems: TallyItem[] = tallies?.[activeType] ?? [];
  const currentTotal = calculateTallyTotal(currentItems);
  const currentElection = ELECTIONS_INFO.find((e) => e.type === activeType)!;
  const reconciliation = reconcileElection(currentTotal, votersTarget);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(inputValue, 10);
    if (isNaN(val) || val < 0) return;

    addTallyItem(activeType, val, customLabel.trim() || undefined);
    setInputValue("");
    setCustomLabel("");
    inputRef.current?.focus();
  };

  const handleStartEdit = (item: TallyItem) => {
    setEditingItemId(item.id);
    setEditingValue(String(item.value));
  };

  const handleSaveEdit = (itemId: string) => {
    const val = parseInt(editingValue, 10);
    if (!isNaN(val) && val >= 0) {
      updateTallyItem(activeType, itemId, val);
    }
    setEditingItemId(null);
  };

  const handlePresetLabel = (label: string) => {
    setCustomLabel(label);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── 1. Total de Ciudadanos que Votaron (Padrón de Firmas) ── */}
      <section className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-brand shrink-0" />
              <span>¿Cuántos firmaron en la lista de electores?</span>
            </h3>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Total de firmas y huellas en el padrón a las 5:00 PM (Acta de
              Sufragio Sección B).
            </p>
          </div>

          <div className="p-1 rounded-xl bg-muted/40 border border-border/70 shadow-2xs shrink-0">
            <Input
              type="number"
              min="0"
              inputMode="numeric"
              pattern="[0-9]*"
              value={votersTarget || ""}
              onChange={(e) => setVotersTarget(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="no-spinner w-24 h-11 text-center font-mono font-black text-xl bg-background border-border text-foreground focus:border-brand rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* ── 2. Chips de Selección de Elección (5A, 5B, 5C, 5D) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {ELECTIONS_INFO.map((info) => {
          const items = tallies?.[info.type] ?? [];
          const total = calculateTallyTotal(items);
          const isMatched = votersTarget > 0 && total === votersTarget;
          const isPending = votersTarget > 0 && total > 0 && !isMatched;
          const isCurrent = activeType === info.type;

          let chipClass = "";
          if (isMatched) {
            chipClass = isCurrent
              ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
              : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/40 hover:bg-emerald-500/25";
          } else if (isPending) {
            chipClass = isCurrent
              ? "bg-amber-600 text-white border-amber-700 shadow-xs"
              : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25";
          } else {
            chipClass = isCurrent
              ? "bg-foreground text-background border-foreground shadow-xs"
              : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground";
          }

          return (
            <button
              key={info.type}
              type="button"
              onClick={() => setActiveType(info.type)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border select-none active:scale-95 ${chipClass}`}
            >
              <span
                className={`text-[10px] font-bold ${
                  isCurrent && (isMatched || isPending)
                    ? "text-white/80"
                    : isCurrent
                      ? "text-background/70"
                      : "text-brand"
                }`}
              >
                {info.num}
              </span>
              <span>{info.shortLabel}</span>
              <span className="text-[10px] opacity-85 inline-flex items-center gap-0.5">
                (
                {isMatched ? (
                  <Check className="h-2.5 w-2.5 text-current stroke-[3]" />
                ) : isPending ? (
                  <span className="inline-flex items-center gap-0.5 font-bold">
                    {total}
                    <AlertTriangle className="h-2.5 w-2.5" />
                  </span>
                ) : (
                  total
                )}
                )
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Veredicto Matemático de Cuadre en Vivo ── */}
      {votersTarget === 0 ? (
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 text-center text-xs font-medium text-muted-foreground">
          Ingresa arriba cuántos electores firmaron en el padrón para contrastar
          si la suma de la mesa cuadra.
        </div>
      ) : reconciliation.status === "match" ? (
        <section className="p-4 rounded-2xl border border-emerald-600/40 bg-emerald-500/10 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="h-5 w-5 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                ¡CUADRE EXACTO! ({currentTotal} = {votersTarget})
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300 font-medium leading-snug">
                La suma de los votos emitidos coincide perfectamente con el
                padrón. Ya puedes transcribir estos resultados al Acta Oficial
                con lapicero.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="p-3.5 sm:p-4 rounded-2xl border border-destructive/40 bg-destructive/10 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-destructive tracking-tight">
                {reconciliation.status === "surplus"
                  ? `SOBRAN ${reconciliation.difference} VOTOS (${currentTotal} de ${votersTarget} sumados)`
                  : `FALTAN ${Math.abs(reconciliation.difference)} VOTOS (${currentTotal} de ${votersTarget} sumados)`}
              </h3>
              <p className="text-xs text-destructive/85 font-medium leading-snug">
                {reconciliation.status === "surplus"
                  ? "Hay más votos sumados que electores en el padrón. Revisa si sumaste una fila dos veces o si hubo error al sumar los palotes."
                  : "La suma es menor que los electores del padrón. Revisa si olvidaste sumar alguna fila de la Hoja Borrador o los votos en blanco y nulos."}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Entrada Rápida de Sumandos (Hoja Borrador) ── */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-brand shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              {currentElection.label}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground font-bold">
            {currentElection.sheetCode}
          </span>
        </div>

        {/* Input form */}
        <form onSubmit={handleAdd} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                ref={inputRef}
                type="number"
                min="0"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={
                  customLabel
                    ? `Votos para ${customLabel}...`
                    : `Votos fila #${currentItems.length + 1}...`
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-11 font-mono text-base bg-background border-border text-foreground rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={!inputValue.trim()}
              className="h-11 px-4 sm:px-5 text-xs font-mono font-bold bg-brand text-brand-foreground rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Sumar</span>
            </Button>
          </div>

          {/* Quick preset pills for special rows */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-mono uppercase text-muted-foreground font-bold mr-1">
              Atajos:
            </span>
            {["Votos en Blanco", "Votos Nulos", "Votos Impugnados"].map(
              (preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetLabel(preset)}
                  className={`text-[10.5px] font-mono font-medium px-2 py-0.5 rounded-md border transition-all ${
                    customLabel === preset
                      ? "bg-brand/10 text-brand border-brand/40 font-bold"
                      : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  + {preset}
                </button>
              ),
            )}

            {customLabel && (
              <button
                type="button"
                onClick={() => setCustomLabel("")}
                className="text-[10px] font-mono text-muted-foreground hover:text-destructive underline ml-1"
              >
                Limpiar etiqueta
              </button>
            )}
          </div>
        </form>

        {/* ── 5. Tira de Auditoría (Historial de Sumandos Editable) ── */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground font-bold px-1">
            <span>TIRA DE SUMANDOS ({currentItems.length} filas)</span>
            <span>TOTAL: {currentTotal}</span>
          </div>

          {currentItems.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-border/80 text-center space-y-1 bg-muted/10">
              <p className="text-xs font-medium text-foreground">
                Aún no has sumado votos en esta elección.
              </p>
              <p className="text-[11px] text-muted-foreground">
                Mira las filas con palotes de tu {currentElection.sheetCode} e
                ingresa cada total arriba.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
              {currentItems.map((item, idx) => {
                const isEditing = editingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl border border-border/70 bg-background hover:border-border transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="h-5 w-6 rounded bg-muted/60 text-muted-foreground font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-foreground truncate">
                        {item.label || `Fila ${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(item.id);
                              if (e.key === "Escape") setEditingItemId(null);
                            }}
                            className="w-16 h-7 font-mono font-bold text-center text-xs p-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveEdit(item.id)}
                            className="h-7 px-2 text-[10px] font-mono font-bold bg-emerald-600 text-white"
                          >
                            OK
                          </Button>
                        </div>
                      ) : (
                        <span
                          onClick={() => handleStartEdit(item)}
                          className="font-mono font-black text-sm sm:text-base text-foreground cursor-pointer hover:underline px-1.5"
                          title="Toca para editar este número"
                        >
                          {item.value}
                        </span>
                      )}

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                          title="Editar valor"
                          aria-label={`Editar valor de fila ${idx + 1}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeTallyItem(activeType, item.id)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                        title="Eliminar este sumando"
                        aria-label={`Eliminar fila ${idx + 1}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Running total footer & Clear button */}
          {currentItems.length > 0 && (
            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `¿Reiniciar la suma de ${currentElection.shortLabel}?`,
                    )
                  ) {
                    clearTally(activeType);
                  }
                }}
                className="text-[10.5px] font-mono text-muted-foreground hover:text-destructive inline-flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reiniciar suma de esta hoja</span>
              </button>

              <div className="text-right">
                <span className="text-[11px] text-muted-foreground font-mono mr-2">
                  Total Emitidos:
                </span>
                <span className="text-base sm:text-lg font-mono font-black text-foreground">
                  {currentTotal}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
