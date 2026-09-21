"use client";

import { useState } from "react";
import { useCopilotoStore } from "../_lib/store";
import { ElectionType } from "../_lib/types";
import {
  calculateElectionTotals,
  reconcileElection,
} from "../_lib/reconciliation";
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Users,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SHEETS_INFO: {
  type: ElectionType;
  label: string;
  shortLabel: string;
  badge: string;
}[] = [
  {
    type: "5A",
    label: "5A: Gobernador Regional",
    shortLabel: "5A Gobernador",
    badge: "Regional",
  },
  {
    type: "5B",
    label: "5B: Consejero Regional",
    shortLabel: "5B Consejero",
    badge: "Regional",
  },
  {
    type: "5C",
    label: "5C: Alcalde Provincial",
    shortLabel: "5C Provincial",
    badge: "Municipal",
  },
  {
    type: "5D",
    label: "5D: Alcalde Distrital",
    shortLabel: "5D Distrital",
    badge: "Municipal",
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

  const currentSheet = sheets[activeSheetType];
  const { validVotes, totalVotes } = calculateElectionTotals(currentSheet);
  const reconciliation = reconcileElection(totalVotes, votersTarget);

  const handleAddParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    addSheetOption(activeSheetType, newPartyName);
    setNewPartyName("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Target Voters Setup Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 sm:p-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Padrón Base: Total de Votantes
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              Número de firmas y huellas contadas en la Lista de Electores
              (Sección B del Acta de Sufragio).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                Total Votaron
              </label>
              <Input
                type="number"
                min="0"
                value={votersTarget || ""}
                onChange={(e) => setVotersTarget(parseInt(e.target.value) || 0)}
                placeholder="Ej. 245"
                className="text-lg font-bold font-mono bg-zinc-950 border-zinc-700 text-purple-300 focus:border-purple-500 text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Election Sheets Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SHEETS_INFO.map((info) => {
          const sheet = sheets[info.type];
          const sheetTotals = calculateElectionTotals(sheet);
          const sheetReconciliation = reconcileElection(
            sheetTotals.totalVotes,
            votersTarget,
          );
          const isCurrent = activeSheetType === info.type;

          return (
            <button
              key={info.type}
              onClick={() => setActiveSheetType(info.type)}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                isCurrent
                  ? "bg-zinc-900 border-purple-500 shadow-md shadow-purple-950/50"
                  : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {info.shortLabel}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 border-zinc-700 text-zinc-400 font-mono"
                >
                  {info.badge}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-zinc-400 font-mono">
                  {sheetTotals.totalVotes} votos
                </span>
                {votersTarget > 0 && (
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      sheetReconciliation.status === "match"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {sheetReconciliation.status === "match"
                      ? "✓ Cuadró"
                      : sheetReconciliation.difference > 0
                        ? `+${sheetReconciliation.difference}`
                        : `${sheetReconciliation.difference}`}
                  </span>
                )}
              </div>
              {isCurrent && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Reconciliation Feedback Banner */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
          reconciliation.status === "match"
            ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200"
            : reconciliation.status === "pending"
              ? "bg-zinc-900 border-zinc-800 text-zinc-300"
              : "bg-rose-950/40 border-rose-500/60 text-rose-200 animate-pulse"
        }`}
      >
        <div className="flex items-start gap-3.5">
          {reconciliation.status === "match" ? (
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          ) : reconciliation.status === "pending" ? (
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-400 shrink-0">
              <Info className="h-6 w-6" />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                {reconciliation.status === "match"
                  ? "¡CUADRE MATEMÁTICO EXACTO!"
                  : reconciliation.status === "pending"
                    ? "Esperando Padrón Base"
                    : "¡DESCUADRE DE VOTOS DETECTADO!"}
              </h3>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2.5 py-1 rounded-md bg-black/40 border border-white/10">
                  Contados: <strong>{totalVotes}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/40 border border-white/10">
                  Esperados: <strong>{votersTarget}</strong>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium leading-relaxed">
              {reconciliation.message}
            </p>

            {reconciliation.status === "match" && (
              <p className="text-xs text-emerald-300/80 pt-1 font-mono">
                ✓ Autorizado para transcribir al Acta Electoral Oficial (Sección
                C) y posterior colocado de láminas autoadhesivas.
              </p>
            )}

            {reconciliation.status !== "match" &&
              reconciliation.status !== "pending" && (
                <div className="pt-1 text-xs text-rose-300 font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  <span>
                    PROHIBIDO PEGAR LÁMINA O LLENAR ACTA OFICIAL HASTA CORREGIR
                    EL DESCUADRE.
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Input Sheet Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-400" />
              Hoja Borrador {currentSheet.title}
            </h3>
            <p className="text-xs text-zinc-400">{currentSheet.subtitle}</p>
          </div>
          <Badge
            variant="outline"
            className="border-zinc-700 bg-zinc-800 text-zinc-300 font-mono text-xs self-start sm:self-auto"
          >
            Válidos: {validVotes} | Total: {totalVotes}
          </Badge>
        </div>

        {/* List of Political Organizations */}
        <div className="space-y-3">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
            Votos por Organización Política
          </label>
          {currentSheet.options.map((option, idx) => (
            <div
              key={option.id}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition-colors"
            >
              <span className="text-xs font-mono text-zinc-500 w-6 text-center">
                #{idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200 truncate">
                  {option.name}
                </p>
              </div>

              {/* Vote controls */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
                  onClick={() =>
                    updateOptionVotes(
                      activeSheetType,
                      option.id,
                      Math.max(0, option.votes - 1),
                    )
                  }
                >
                  -1
                </Button>

                <Input
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
                  className="w-16 h-8 text-center font-mono font-bold text-sm bg-zinc-900 border-zinc-700 text-zinc-100"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
                  onClick={() =>
                    updateOptionVotes(
                      activeSheetType,
                      option.id,
                      option.votes + 1,
                    )
                  }
                >
                  +1
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 border-zinc-700 text-purple-300 hover:bg-zinc-800 text-xs font-mono"
                  onClick={() =>
                    updateOptionVotes(
                      activeSheetType,
                      option.id,
                      option.votes + 5,
                    )
                  }
                >
                  +5
                </Button>

                {currentSheet.options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 ml-1"
                    onClick={() =>
                      removeSheetOption(activeSheetType, option.id)
                    }
                    title="Eliminar fila"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Add Option Form */}
          <form
            onSubmit={handleAddParty}
            className="flex items-center gap-2 pt-1"
          >
            <Input
              type="text"
              placeholder="Nombre del partido / lista adicional..."
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              className="text-xs bg-zinc-950 border-zinc-800 text-zinc-200"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-xs border-zinc-700 text-zinc-200 hover:bg-zinc-800 shrink-0 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5 text-blue-400" />
              Añadir Lista
            </Button>
          </form>
        </div>

        {/* Special Votes Section (Blancos, Nulos, Impugnados) */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
            Votos No Válidos e Impugnados (Obligatorios en Acta)
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Votos en Blanco */}
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  Votos en Blanco
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Sin marcas
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-xs border-zinc-700"
                  onClick={() =>
                    updateSpecialVotes(
                      activeSheetType,
                      "whiteVotes",
                      Math.max(0, currentSheet.whiteVotes - 1),
                    )
                  }
                >
                  -1
                </Button>
                <Input
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
                  className="h-8 text-center font-mono font-bold text-sm bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-xs border-zinc-700"
                  onClick={() =>
                    updateSpecialVotes(
                      activeSheetType,
                      "whiteVotes",
                      currentSheet.whiteVotes + 1,
                    )
                  }
                >
                  +1
                </Button>
              </div>
            </div>

            {/* Votos Nulos */}
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  Votos Nulos
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Viciados / rotos
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-xs border-zinc-700"
                  onClick={() =>
                    updateSpecialVotes(
                      activeSheetType,
                      "nullVotes",
                      Math.max(0, currentSheet.nullVotes - 1),
                    )
                  }
                >
                  -1
                </Button>
                <Input
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
                  className="h-8 text-center font-mono font-bold text-sm bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-xs border-zinc-700"
                  onClick={() =>
                    updateSpecialVotes(
                      activeSheetType,
                      "nullVotes",
                      currentSheet.nullVotes + 1,
                    )
                  }
                >
                  +1
                </Button>
              </div>
            </div>

            {/* Votos Impugnados */}
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  Votos Impugnados
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Al Sobre Celeste
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-xs border-zinc-700"
                  onClick={() =>
                    updateSpecialVotes(
                      activeSheetType,
                      "impugnedVotes",
                      Math.max(0, currentSheet.impugnedVotes - 1),
                    )
                  }
                >
                  -1
                </Button>
                <Input
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
                  className="h-8 text-center font-mono font-bold text-sm bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-xs border-zinc-700"
                  onClick={() =>
                    updateSpecialVotes(
                      activeSheetType,
                      "impugnedVotes",
                      currentSheet.impugnedVotes + 1,
                    )
                  }
                >
                  +1
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen Final de la Hoja para Transcripción */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/80 p-4 rounded-xl">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Total Emitidos de esta Hoja
            </span>
            <div className="text-2xl font-black font-mono text-purple-300">
              {totalVotes} VOTOS
            </div>
          </div>

          <div className="text-xs text-zinc-400 font-mono text-center sm:text-right space-y-0.5">
            <div>Válidos: {validVotes}</div>
            <div>
              Blancos: {currentSheet.whiteVotes} | Nulos:{" "}
              {currentSheet.nullVotes}
            </div>
            <div>Impugnados: {currentSheet.impugnedVotes}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
