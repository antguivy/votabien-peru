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
import {
  Users,
  Plus,
  Camera,
  Lock,
  Trash2,
  Check,
  AlertTriangle,
  Copy,
} from "lucide-react";
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
  const copyOptionsToAllSheets = useCopilotoStore(
    (s) => s.copyOptionsToAllSheets,
  );

  const [activeSheetType, setActiveSheetType] = useState<ElectionType>("5A");
  const [newPartyName, setNewPartyName] = useState("");
  const [showAddPartyInput, setShowAddPartyInput] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showDictationDialog, setShowDictationDialog] = useState(false);
  const [copiedAllSuccess, setCopiedAllSuccess] = useState(false);

  const currentSheet = sheets[activeSheetType];
  const { validVotes, totalVotes } = calculateElectionTotals(currentSheet);
  const reconciliation = reconcileElection(totalVotes, votersTarget);

  const otherSheetWithParties = SHEETS_INFO.find(
    (info) =>
      info.type !== activeSheetType &&
      (sheets[info.type]?.options?.length || 0) > 0,
  );

  const handleCopyAll = () => {
    copyOptionsToAllSheets(activeSheetType);
    setCopiedAllSuccess(true);
    setTimeout(() => setCopiedAllSuccess(false), 2000);
  };

  const handleAddParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    addSheetOption(activeSheetType, newPartyName);
    setNewPartyName("");
    setShowAddPartyInput(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── 1. Total de Ciudadanos que Votaron ── */}
      <section className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-brand" />
              <span>¿Cuántos firmaron en la lista?</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Cuenta las firmas y huellas en el padrón a las 5:00 PM.
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

      {/* ── 2. Veredicto Matemático de Cuadre ── */}
      {votersTarget === 0 ? (
        <div className="p-3 rounded-xl bg-muted/30 border border-border/70 text-center text-xs font-medium text-muted-foreground">
          Ingresa arriba cuántos electores firmaron en la lista para verificar
          si la mesa cuadra.
        </div>
      ) : reconciliation.status === "match" ? (
        <section className="p-4 rounded-2xl border border-emerald-600/40 bg-emerald-500/10 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="h-5 w-5 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                ¡CUADRE EXACTO! ({totalVotes} de {votersTarget})
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300 font-medium">
                Todo coincide perfecto. Ya podés pasar estos datos con lapicero
                al acta.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setShowDictationDialog(true)}
            className="h-10 px-5 text-xs font-mono font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs shrink-0 flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4" />
            <span>Dictar al Acta Oficial</span>
          </Button>
        </section>
      ) : (
        <section className="p-3.5 rounded-2xl border border-destructive/40 bg-destructive/10 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-destructive text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-destructive tracking-tight">
                {reconciliation.status === "surplus"
                  ? `SOBRAN ${reconciliation.difference} VOTOS (${totalVotes} de ${votersTarget})`
                  : `FALTAN ${Math.abs(reconciliation.difference)} VOTOS (${totalVotes} de ${votersTarget})`}
              </h3>
              <p className="text-xs text-destructive/80 font-medium">
                {reconciliation.status === "surplus"
                  ? "Hay más cédulas que votantes. Revisa si alguien sumó doble."
                  : "Faltan votos por contar. Revisa el montón de blancos o nulos."}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Chips de Selección de Elección (Color Dinámico por Estado) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {SHEETS_INFO.map((info) => {
          const sheet = sheets[info.type];
          const sheetTotals = calculateElectionTotals(sheet);
          const isMatched =
            votersTarget > 0 && sheetTotals.totalVotes === votersTarget;
          const isPending =
            votersTarget > 0 && sheetTotals.totalVotes > 0 && !isMatched;
          const isCurrent = activeSheetType === info.type;

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
              onClick={() => setActiveSheetType(info.type)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border select-none active:scale-95 ${chipClass}`}
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
                  <Check className="h-2.5 w-2.5 text-current" />
                ) : isPending ? (
                  <span className="inline-flex items-center gap-0.5 font-bold">
                    {sheetTotals.totalVotes}
                    <AlertTriangle className="h-2.5 w-2.5" />
                  </span>
                ) : (
                  sheetTotals.totalVotes
                )}
                )
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
            {currentSheet.options.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="h-7 px-2 text-[10.5px] font-mono border-border/80 text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg"
                title="Copiar estas organizaciones a las demás hojas"
              >
                {copiedAllSuccess ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="hidden sm:inline">Copiar a otras</span>
                  </>
                )}
              </Button>
            )}

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

        {/* Empty State when no parties loaded */}
        {currentSheet.options.length === 0 ? (
          <div className="p-6 rounded-2xl border-2 border-dashed border-border/80 bg-muted/10 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand mx-auto flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Sin organizaciones cargadas en Hoja {currentSheet.type}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Esta hoja inicia limpia para no hacerte perder tiempo borrando
                listas de prueba. Cargá los partidos en 2 segundos:
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                onClick={() => setShowScanDialog(true)}
                className="w-full sm:w-auto h-9 text-xs font-bold bg-brand text-white hover:bg-brand/90 rounded-xl shadow-xs"
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                <span>Foto o Lista Oficial</span>
              </Button>

              {otherSheetWithParties && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    copyOptionsToAllSheets(otherSheetWithParties.type)
                  }
                  className="w-full sm:w-auto h-9 text-xs font-mono font-semibold rounded-xl border-border hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  <span>Copiar de {otherSheetWithParties.shortLabel}</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Stepper Rows */
          <div className="space-y-2">
            {currentSheet.options.map((option, idx) => (
              <div
                key={option.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-colors"
              >
                <div className="min-w-0 flex-1 pr-1.5">
                  <p className="text-xs font-semibold text-foreground leading-snug break-words">
                    <span className="text-muted-foreground font-mono text-[11px] mr-1.5 shrink-0 inline-block">
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
                    onClick={() =>
                      removeSheetOption(activeSheetType, option.id)
                    }
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
        )}

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
