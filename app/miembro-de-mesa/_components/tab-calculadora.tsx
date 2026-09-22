"use client";

import { useState } from "react";
import { useCopilotoStore } from "../_lib/store";
import { ElectionType } from "../_lib/types";
import {
  calculateElectionTotals,
  reconcileElection,
} from "../_lib/reconciliation";
import { ScanCartelDialog } from "./scan-cartel-dialog";
import { DictationModeDialog } from "./dictation-mode-dialog";
import { Users, Plus, Camera, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SHEETS_INFO: {
  type: ElectionType;
  num: string;
  label: string;
  shortLabel: string;
}[] = [
  {
    type: "5A",
    num: "01",
    label: "5A: Gobernador y Vicegobernador",
    shortLabel: "5A Gobernador",
  },
  {
    type: "5B",
    num: "02",
    label: "5B: Consejeros Regionales",
    shortLabel: "5B Consejeros",
  },
  {
    type: "5C",
    num: "03",
    label: "5C: Alcalde Provincial",
    shortLabel: "5C Provincial",
  },
  {
    type: "5D",
    num: "04",
    label: "5D: Alcalde Distrital",
    shortLabel: "5D Distrital",
  },
];

export function TabCalculadora() {
  const votersTarget = useCopilotoStore((s) => s.votersTarget);
  const setVotersTarget = useCopilotoStore((s) => s.setVotersTarget);
  const sheets = useCopilotoStore((s) => s.sheets);
  const updateOptionVotes = useCopilotoStore((s) => s.updateOptionVotes);
  const addSheetOption = useCopilotoStore((s) => s.addSheetOption);
  const removeSheetOption = useCopilotoStore((s) => s.removeSheetOption);
  const updateSpecialVotes = useCopilotoStore((s) => s.updateSpecialVotes);

  const [activeSheetType, setActiveSheetType] = useState<ElectionType>("5A");
  const [newPartyName, setNewPartyName] = useState("");
  const [showAddPartyInput, setShowAddPartyInput] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showDictationDialog, setShowDictationDialog] = useState(false);

  const currentSheet = sheets[activeSheetType];
  const { validVotes, totalVotes } = calculateElectionTotals(currentSheet);
  const reconciliation = reconcileElection(totalVotes, votersTarget);

  const handleAddParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    addSheetOption(activeSheetType, newPartyName);
    setNewPartyName("");
    setShowAddPartyInput(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── 1. Total de Ciudadanos que Votaron (Acta de Sufragio) ── */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-brand" />
                <span>Total de Ciudadanos que Votaron</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 font-medium">
              Número de firmas y huellas contadas en la{" "}
              <strong>Lista de Electores</strong> (anotado en la Sección B del{" "}
              <strong>Acta de Sufragio</strong>).
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-mono text-muted-foreground">
              Total Votantes:
            </span>
            <div className="p-1 rounded-xl bg-muted/40 border border-border/70 shadow-2xs">
              <Input
                type="number"
                min="0"
                inputMode="numeric"
                pattern="[0-9]*"
                value={votersTarget || ""}
                onChange={(e) => setVotersTarget(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="no-spinner w-24 h-10 text-center font-mono font-black text-lg bg-background border-border text-foreground focus:border-brand rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Veredicto Matemático de Cuadre ── */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${
          reconciliation.status === "match"
            ? "bg-card border-emerald-600/40 text-foreground"
            : reconciliation.status === "pending"
              ? "bg-card border-border/80 text-foreground"
              : "bg-card border-destructive/40 text-foreground"
        }`}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
            Estado de Cuadre
          </span>

          <span
            className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded border -rotate-1 shadow-2xs ${
              reconciliation.status === "match"
                ? "text-emerald-700 bg-emerald-500/10 border-emerald-600/30 dark:text-emerald-400"
                : reconciliation.status === "pending"
                  ? "text-muted-foreground bg-muted/40 border-border"
                  : "text-destructive bg-destructive/10 border-destructive/30"
            }`}
          >
            {reconciliation.status === "match"
              ? "✓ Cuadre Exacto"
              : reconciliation.status === "pending"
                ? "Esperando Total de Votantes"
                : "⚠️ Descuadre en Hoja Borrador"}
          </span>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
            {reconciliation.message}
          </p>

          <div className="flex items-center gap-2 font-mono text-xs shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/70 text-foreground">
              Contados: <strong>{totalVotes}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/70 text-foreground">
              Esperados: <strong>{votersTarget}</strong>
            </span>
          </div>
        </div>

        {/* Action to activate dictation mode */}
        {reconciliation.status === "match" && (
          <div className="pt-3 mt-3 border-t border-border/60">
            <Button
              type="button"
              onClick={() => setShowDictationDialog(true)}
              className="w-full text-xs font-mono font-bold bg-foreground text-background hover:bg-foreground/90 rounded-xl py-3.5 shadow-xs flex items-center justify-center gap-2"
            >
              <Lock className="h-3.5 w-3.5 text-brand" />
              <span>Dictar al Acta Oficial</span>
            </Button>
          </div>
        )}
      </section>

      {/* ── 3. Chips de Selección de Elección (CandidateNavChips style) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {SHEETS_INFO.map((info) => {
          const sheet = sheets[info.type];
          const sheetTotals = calculateElectionTotals(sheet);
          const isMatched =
            votersTarget > 0 && sheetTotals.totalVotes === votersTarget;
          const isCurrent = activeSheetType === info.type;

          return (
            <button
              key={info.type}
              onClick={() => setActiveSheetType(info.type)}
              className={`shrink-0 inline-flex items-baseline gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border select-none active:scale-95 ${
                isCurrent
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <span
                className={`text-[10px] font-bold ${
                  isCurrent ? "text-background/70" : "text-brand"
                }`}
              >
                {info.num}
              </span>
              <span>{info.shortLabel}</span>
              <span className="text-[10px] opacity-70">
                ({isMatched ? "✓" : sheetTotals.totalVotes})
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 4. Lista de Organizaciones Políticas (Conteo Limpio) ── */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {currentSheet.title}
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">
              Válidos: {validVotes} | Total Emitidos: {totalVotes}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Camera / Presets Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowScanDialog(true)}
              className="h-7 px-2.5 text-[10.5px] font-mono border-border/80 text-foreground font-bold flex items-center gap-1 hover:bg-muted/60 rounded-lg"
              title="Cargar partidos oficiales o foto del cartel"
            >
              <Camera className="h-3 w-3 text-brand" />
              <span>Cargar Partidos</span>
            </Button>
          </div>
        </div>

        {/* Stepper Rows */}
        <div className="space-y-2">
          {currentSheet.options.map((option, idx) => (
            <div
              key={option.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  <span className="text-muted-foreground font-mono text-[11px] mr-1.5">
                    {idx + 1}.
                  </span>
                  {option.name}
                </p>
              </div>

              {/* Minimal Stepper with Clean Touch Targets */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    updateOptionVotes(
                      activeSheetType,
                      option.id,
                      Math.max(0, option.votes - 1),
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-sm font-bold text-muted-foreground hover:text-foreground active:scale-90 transition-all select-none shadow-2xs"
                  aria-label="Restar un voto"
                >
                  -
                </button>

                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={option.votes || ""}
                  onChange={(e) =>
                    updateOptionVotes(
                      activeSheetType,
                      option.id,
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="0"
                  className="no-spinner w-12 h-8 rounded-lg bg-background border border-border/80 text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:border-brand shadow-2xs"
                />

                <button
                  type="button"
                  onClick={() =>
                    updateOptionVotes(
                      activeSheetType,
                      option.id,
                      option.votes + 1,
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-sm font-bold text-muted-foreground hover:text-foreground active:scale-90 transition-all select-none shadow-2xs"
                  aria-label="Sumar un voto"
                >
                  +
                </button>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeSheetOption(activeSheetType, option.id)}
                  className="w-8 h-8 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors ml-0.5 select-none"
                  title="Eliminar organización política"
                  aria-label={`Eliminar ${option.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Party Toggle */}
        {!showAddPartyInput ? (
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => setShowAddPartyInput(true)}
              className="text-xs font-mono font-semibold text-brand hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir lista manual</span>
            </button>

            {reconciliation.status === "match" && (
              <button
                type="button"
                onClick={() => setShowDictationDialog(true)}
                className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Dictar al acta</span>
              </button>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleAddParty}
            className="flex items-center gap-2 pt-1"
          >
            <Input
              type="text"
              placeholder="Nombre de la lista..."
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              className="text-xs h-8 bg-background border-border"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs bg-foreground text-background font-mono"
            >
              Guardar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddPartyInput(false)}
              className="h-8 text-xs text-muted-foreground font-mono"
            >
              Cancelar
            </Button>
          </form>
        )}
      </section>

      {/* ── 5. Votos en Blanco, Nulos e Impugnados ── */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-muted-foreground">
          Votos No Válidos (Obligatorios en Acta)
        </h4>

        <div className="space-y-2">
          {/* Blanco */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-foreground font-medium">
              Votos en Blanco
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  updateSpecialVotes(
                    activeSheetType,
                    "whiteVotes",
                    Math.max(0, currentSheet.whiteVotes - 1),
                  )
                }
                className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentSheet.whiteVotes || ""}
                onChange={(e) =>
                  updateSpecialVotes(
                    activeSheetType,
                    "whiteVotes",
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="0"
                className="no-spinner w-12 h-8 rounded-lg bg-background border border-border/80 text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() =>
                  updateSpecialVotes(
                    activeSheetType,
                    "whiteVotes",
                    currentSheet.whiteVotes + 1,
                  )
                }
                className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          {/* Nulo */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-foreground font-medium">
              Votos Nulos
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  updateSpecialVotes(
                    activeSheetType,
                    "nullVotes",
                    Math.max(0, currentSheet.nullVotes - 1),
                  )
                }
                className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentSheet.nullVotes || ""}
                onChange={(e) =>
                  updateSpecialVotes(
                    activeSheetType,
                    "nullVotes",
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="0"
                className="no-spinner w-12 h-8 rounded-lg bg-background border border-border/80 text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() =>
                  updateSpecialVotes(
                    activeSheetType,
                    "nullVotes",
                    currentSheet.nullVotes + 1,
                  )
                }
                className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          {/* Impugnados */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-foreground font-medium">
              Votos Impugnados
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  updateSpecialVotes(
                    activeSheetType,
                    "impugnedVotes",
                    Math.max(0, currentSheet.impugnedVotes - 1),
                  )
                }
                className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentSheet.impugnedVotes || ""}
                onChange={(e) =>
                  updateSpecialVotes(
                    activeSheetType,
                    "impugnedVotes",
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="0"
                className="no-spinner w-12 h-8 rounded-lg bg-background border border-border/80 text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() =>
                  updateSpecialVotes(
                    activeSheetType,
                    "impugnedVotes",
                    currentSheet.impugnedVotes + 1,
                  )
                }
                className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cartel / Photo Scanner Dialog */}
      <ScanCartelDialog
        open={showScanDialog}
        onOpenChange={setShowScanDialog}
        activeSheetType={activeSheetType}
      />

      {/* Dictation Mode Dialog */}
      <DictationModeDialog
        open={showDictationDialog}
        onOpenChange={setShowDictationDialog}
        sheet={currentSheet}
        votersTarget={votersTarget}
      />
    </div>
  );
}
