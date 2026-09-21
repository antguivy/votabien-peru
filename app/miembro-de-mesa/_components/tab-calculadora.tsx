"use client";

import { useState } from "react";
import { useCopilotoStore } from "../_lib/store";
import { ElectionType } from "../_lib/types";
import {
  calculateElectionTotals,
  reconcileElection,
} from "../_lib/reconciliation";
import { CheckCircle2, AlertTriangle, Users, Plus, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SHEETS_INFO: {
  type: ElectionType;
  label: string;
  shortLabel: string;
}[] = [
  { type: "5A", label: "5A: Gobernador", shortLabel: "5A Gob" },
  { type: "5B", label: "5B: Consejeros", shortLabel: "5B Cons" },
  { type: "5C", label: "5C: Provincial", shortLabel: "5C Prov" },
  { type: "5D", label: "5D: Distrital", shortLabel: "5D Dist" },
];

export function TabCalculadora() {
  const votersTarget = useCopilotoStore((s) => s.votersTarget);
  const setVotersTarget = useCopilotoStore((s) => s.setVotersTarget);
  const sheets = useCopilotoStore((s) => s.sheets);
  const updateOptionVotes = useCopilotoStore((s) => s.updateOptionVotes);
  const addSheetOption = useCopilotoStore((s) => s.addSheetOption);
  const updateSpecialVotes = useCopilotoStore((s) => s.updateSpecialVotes);

  const [activeSheetType, setActiveSheetType] = useState<ElectionType>("5A");
  const [newPartyName, setNewPartyName] = useState("");
  const [showAddPartyInput, setShowAddPartyInput] = useState(false);

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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Target Voters Setup Card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
              <Users className="h-3.5 w-3.5 text-brand" />
              <span>Padrón: Total Votantes</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Firmas y huellas contadas a las 5:00 PM (Sección B).
            </p>
          </div>

          <div className="w-24 shrink-0">
            <Input
              type="number"
              min="0"
              value={votersTarget || ""}
              onChange={(e) => setVotersTarget(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="text-base font-black font-mono text-center h-10 rounded-xl bg-background border-border text-foreground focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* Real-time Reconciliation Status Banner */}
      <div
        className={`rounded-2xl border p-3.5 transition-all shadow-sm ${
          reconciliation.status === "match"
            ? "bg-success/10 border-success/30 text-success"
            : reconciliation.status === "pending"
              ? "bg-muted/40 border-border text-muted-foreground"
              : "bg-destructive/10 border-destructive/30 text-destructive"
        }`}
      >
        <div className="flex items-start gap-2.5">
          {reconciliation.status === "match" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : reconciliation.status === "pending" ? (
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black tracking-tight uppercase">
                {reconciliation.status === "match"
                  ? "Cuadre Exacto"
                  : reconciliation.status === "pending"
                    ? "Esperando Total Votantes"
                    : "Descuadre en Borrador"}
              </h3>
              <span className="text-[11px] font-mono font-bold">
                {totalVotes} / {votersTarget}
              </span>
            </div>

            <p className="text-[11.5px] leading-snug font-medium">
              {reconciliation.message}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Election Sheets Segmented Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-muted/50 rounded-xl border border-border/60">
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
              className={`py-2 px-1 rounded-lg text-center transition-all select-none ${
                isCurrent
                  ? "bg-background text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <span className="text-xs block leading-tight">
                {info.shortLabel}
              </span>
              <span className="text-[10px] font-mono block text-muted-foreground">
                {isMatched ? (
                  <span className="text-success font-bold">
                    ✓ {sheetTotals.totalVotes}
                  </span>
                ) : (
                  `${sheetTotals.totalVotes}`
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Party Votes List (Clean & Minimalist) */}
      <div className="rounded-2xl border border-border bg-card p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div>
            <h3 className="text-xs font-bold text-foreground">
              {currentSheet.title}
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">
              Válidos: {validVotes} | Total: {totalVotes}
            </span>
          </div>

          <Badge
            variant="outline"
            className="text-[10px] font-mono border-border text-muted-foreground"
          >
            Hoja {activeSheetType}
          </Badge>
        </div>

        {/* Rows with Ergonomic Steppers */}
        <div className="space-y-2">
          {currentSheet.options.map((option, idx) => (
            <div
              key={option.id}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/20 border border-border/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  <span className="text-muted-foreground font-mono text-[11px] mr-1.5">
                    {idx + 1}.
                  </span>
                  {option.name}
                </p>
              </div>

              {/* Minimal Stepper */}
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
                  className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-bold text-muted-foreground hover:text-foreground active:scale-90 transition-all select-none"
                  aria-label="Restar un voto"
                >
                  -
                </button>

                <input
                  type="number"
                  min="0"
                  value={option.votes || ""}
                  onChange={(e) =>
                    updateOptionVotes(
                      activeSheetType,
                      option.id,
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="0"
                  className="w-12 h-8 rounded-lg bg-background border border-border text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:border-brand"
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
                  className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-bold text-muted-foreground hover:text-foreground active:scale-90 transition-all select-none"
                  aria-label="Sumar un voto"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Party Toggle / Form */}
        {!showAddPartyInput ? (
          <button
            type="button"
            onClick={() => setShowAddPartyInput(true)}
            className="w-full py-2 text-center text-xs font-semibold text-brand hover:underline flex items-center justify-center gap-1 pt-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Añadir lista política</span>
          </button>
        ) : (
          <form
            onSubmit={handleAddParty}
            className="flex items-center gap-2 pt-1"
          >
            <Input
              type="text"
              placeholder="Nombre del partido..."
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              className="text-xs h-8 bg-background border-border"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs bg-brand text-brand-foreground"
            >
              Guardar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddPartyInput(false)}
              className="h-8 text-xs text-muted-foreground"
            >
              Cancelar
            </Button>
          </form>
        )}
      </div>

      {/* Special Votes Section (Blancos, Nulos, Impugnados) */}
      <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2.5 shadow-sm">
        <h4 className="text-xs font-bold text-foreground">
          Votos en Blanco, Nulos e Impugnados
        </h4>

        <div className="space-y-2">
          {/* Blanco */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/20 border border-border/50">
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
                className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={currentSheet.whiteVotes || ""}
                onChange={(e) =>
                  updateSpecialVotes(
                    activeSheetType,
                    "whiteVotes",
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="0"
                className="w-12 h-8 rounded-lg bg-background border border-border text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:border-brand"
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
                className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          {/* Nulo */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/20 border border-border/50">
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
                className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={currentSheet.nullVotes || ""}
                onChange={(e) =>
                  updateSpecialVotes(
                    activeSheetType,
                    "nullVotes",
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="0"
                className="w-12 h-8 rounded-lg bg-background border border-border text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:border-brand"
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
                className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          {/* Impugnados */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/20 border border-border/50">
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
                className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={currentSheet.impugnedVotes || ""}
                onChange={(e) =>
                  updateSpecialVotes(
                    activeSheetType,
                    "impugnedVotes",
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="0"
                className="w-12 h-8 rounded-lg bg-background border border-border text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:border-brand"
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
                className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-bold text-muted-foreground active:scale-90"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
