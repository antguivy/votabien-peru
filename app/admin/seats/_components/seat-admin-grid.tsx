"use client";

import { useState, useMemo } from "react";
import {
  updateSeatAssignment,
  batchAssignGroupToSeats,
  autoAssignLegislators,
  generateSeatsForPeriod,
  clearSeatsAssignments,
  regenerateSeatsForPeriod,
} from "@/actions/seats";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Wand2, Paintbrush, RotateCcw, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  type legislativeperiod,
  type parliamentarygroup,
  Prisma,
} from "@/prisma/generated/client";

type SeatType = Prisma.seatparliamentaryGetPayload<{
  include: {
    parliamentarygroup: true;
    legislativeperiod: true;
    legislator: {
      include: {
        person: true;
        parliamentarymembership: {
          include: { parliamentarygroup: true };
        };
      };
    };
  };
}>;

type LegislatorType = Prisma.legislatorGetPayload<{
  include: {
    person: true;
    parliamentarymembership: {
      include: { parliamentarygroup: true };
    };
  };
}>;

interface SeatAdminGridProps {
  initialSeats: SeatType[];
  legislators: LegislatorType[];
  groups: parliamentarygroup[];
  periods: legislativeperiod[];
}

export function SeatAdminGrid({
  initialSeats,
  legislators,
  groups,
  periods,
}: SeatAdminGridProps) {
  const [seats, setSeats] = useState(initialSeats);
  const [chamber, setChamber] = useState<"SENADO" | "DIPUTADOS" | "CONGRESO">(
    "DIPUTADOS",
  );
  const [isPending, setIsPending] = useState(false);
  const [paintModeGroup, setPaintModeGroup] = useState<string | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(
    new Set(),
  );

  // Period states
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(
    periods.find((p: legislativeperiod) => p.active)?.id ||
      periods[0]?.id ||
      null,
  );

  // Individual Assignment Modal State
  const [assignModalSeat, setAssignModalSeat] = useState<SeatType | null>(null);
  const [assignModalLegislatorId, setAssignModalLegislatorId] =
    useState<string>("none");

  // Filtering
  const filteredSeats = seats.filter(
    (s: SeatType) =>
      s.chamber === chamber && s.legislative_period_id === selectedPeriod,
  );
  const filteredLegislators = legislators.filter(
    (l: LegislatorType) => l.chamber === chamber,
  );

  const handleSeatClick = (seat: SeatType) => {
    if (paintModeGroup) {
      const newSet = new Set(selectedSeatIds);
      if (newSet.has(seat.id)) newSet.delete(seat.id);
      else newSet.add(seat.id);
      setSelectedSeatIds(newSet);
    } else {
      setAssignModalSeat(seat);
      setAssignModalLegislatorId(seat.legislator_id || "none");
    }
  };

  const applyBatchPaint = async () => {
    if (!paintModeGroup || selectedSeatIds.size === 0) return;
    setIsPending(true);
    const idsArray = Array.from(selectedSeatIds);
    const result = await batchAssignGroupToSeats(idsArray, paintModeGroup);
    if (result.success) {
      toast.success(`${idsArray.length} asientos asignados a la bancada.`);
      const selectedGroupObj = groups.find(
        (g: parliamentarygroup) => g.id === paintModeGroup,
      );
      setSeats((prev: SeatType[]) =>
        prev.map((s: SeatType) => {
          if (idsArray.includes(s.id)) {
            return {
              ...s,
              parliamentary_group_id: paintModeGroup,
              parliamentarygroup: selectedGroupObj || null,
              legislator_id: null,
              legislator: null,
            };
          }
          return s;
        }),
      );
      setSelectedSeatIds(new Set());
    } else {
      toast.error("Error al asignar asientos");
    }
    setIsPending(false);
  };

  const handleAutoAssign = async () => {
    if (!paintModeGroup || !selectedPeriod) {
      toast.error("Selecciona una bancada y un periodo.");
      return;
    }
    setIsPending(true);
    const result = await autoAssignLegislators(
      paintModeGroup,
      chamber,
      selectedPeriod,
    );
    if (result.success) {
      if (result.assignedCount) {
        toast.success(`${result.assignedCount} legisladores auto-asignados.`);
        window.location.reload();
      } else {
        toast.info(result.message || "No se hicieron cambios.");
      }
    } else {
      toast.error("Error al auto-asignar");
    }
    setIsPending(false);
  };

  const handleIndividualAssign = async () => {
    if (!assignModalSeat) return;
    setIsPending(true);
    const valueToSave =
      assignModalLegislatorId === "none" ? null : assignModalLegislatorId;
    const result = await updateSeatAssignment(assignModalSeat.id, valueToSave);
    if (result.success) {
      toast.success("Asiento actualizado");
      setSeats((prev: SeatType[]) =>
        prev.map((s: SeatType) => {
          if (
            valueToSave &&
            s.legislator_id === valueToSave &&
            s.id !== assignModalSeat.id
          ) {
            return { ...s, legislator_id: null, legislator: null };
          }
          if (s.id === assignModalSeat.id) {
            const newLegislator = legislators.find(
              (l: LegislatorType) => l.id === valueToSave,
            );
            return {
              ...s,
              legislator_id: valueToSave,
              legislator: newLegislator || null,
            };
          }
          return s;
        }),
      );
      setAssignModalSeat(null);
    } else {
      toast.error("Error al actualizar");
    }
    setIsPending(false);
  };

  const handleGenerateSeats = async () => {
    if (!selectedPeriod) return;
    setIsPending(true);
    const result = await generateSeatsForPeriod(selectedPeriod, chamber);
    if (result.success) {
      toast.success(`${result.count} escaños generados.`);
      window.location.reload();
    } else {
      toast.error(result.error || "Error generando escaños");
    }
    setIsPending(false);
  };

  const handleClearAssignments = async () => {
    if (!selectedPeriod) return;
    if (
      !window.confirm(
        `¿Estás seguro de limpiar todas las asignaciones de escaños en ${chamber}? Podrás volver a pintar desde cero.`,
      )
    )
      return;
    setIsPending(true);
    const result = await clearSeatsAssignments(selectedPeriod, chamber);
    if (result.success) {
      toast.success("Asignaciones limpiadas.");
      window.location.reload();
    } else {
      toast.error(result.error || "Error al limpiar asignaciones");
    }
    setIsPending(false);
  };

  const handleRegenerateSeats = async () => {
    if (!selectedPeriod) return;
    if (
      !window.confirm(
        `¿Estás seguro de regenerar todos los escaños de ${chamber}? Se eliminarán los escaños actuales y se crearán de nuevo con la estructura de filas actualizada.`,
      )
    )
      return;
    setIsPending(true);
    const result = await regenerateSeatsForPeriod(selectedPeriod, chamber);
    if (result.success) {
      toast.success(`${result.count} escaños regenerados con éxito.`);
      window.location.reload();
    } else {
      toast.error(result.error || "Error al regenerar escaños");
    }
    setIsPending(false);
  };

  const svgConfig = useMemo(() => {
    if (chamber === "SENADO" || filteredSeats.length <= 65) {
      return {
        viewBox: "0 0 840 500",
        cx: 420,
        cy: 430,
        bubbleRadius: 25,
        rows: [
          { radius: 360, count: 16 },
          { radius: 302, count: 14 },
          { radius: 244, count: 12 },
          { radius: 186, count: 10 },
          { radius: 128, count: 8 },
        ],
      };
    }
    if (chamber === "CONGRESO" || filteredSeats.length > 140) {
      return {
        viewBox: "0 0 840 500",
        cx: 420,
        cy: 430,
        bubbleRadius: 13.2,
        rows: [
          { radius: 380, count: 31 },
          { radius: 347, count: 29 },
          { radius: 314, count: 27 },
          { radius: 281, count: 25 },
          { radius: 248, count: 23 },
          { radius: 215, count: 20 },
          { radius: 182, count: 18 },
          { radius: 149, count: 17 },
        ],
      };
    }
    return {
      viewBox: "0 0 840 500",
      cx: 420,
      cy: 430,
      bubbleRadius: 14.5,
      rows: [
        { radius: 380, count: 22 },
        { radius: 346, count: 20 },
        { radius: 312, count: 18 },
        { radius: 278, count: 17 },
        { radius: 244, count: 15 },
        { radius: 210, count: 14 },
        { radius: 176, count: 13 },
        { radius: 142, count: 11 },
      ],
    };
  }, [chamber, filteredSeats.length]);

  const bubbles = useMemo(() => {
    const sortedSeats = [...filteredSeats].sort((a, b) => {
      const groupA =
        a.parliamentarygroup?.name ||
        a.legislator?.parliamentarymembership?.[0]?.parliamentarygroup?.name ||
        "ZZZ";
      const groupB =
        b.parliamentarygroup?.name ||
        b.legislator?.parliamentarymembership?.[0]?.parliamentarygroup?.name ||
        "ZZZ";
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      if (a.row !== b.row) return a.row - b.row;
      return a.number_seat - b.number_seat;
    });

    const calculated: { x: number; y: number; seat: SeatType }[] = [];
    let seatIndex = 0;
    svgConfig.rows.forEach((rowConfig, _rowIndex) => {
      const angleStep = Math.PI / (rowConfig.count - 1);
      for (let i = 0; i < rowConfig.count; i++) {
        if (seatIndex >= sortedSeats.length) break;
        const seat = sortedSeats[seatIndex];
        const angle = Math.PI - i * angleStep;
        calculated.push({
          x: svgConfig.cx + rowConfig.radius * Math.cos(angle),
          y: svgConfig.cy - rowConfig.radius * Math.sin(angle),
          seat,
        });
        seatIndex++;
      }
    });
    return calculated;
  }, [filteredSeats, svgConfig]);

  if (periods.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl">
        <h3 className="text-lg font-bold mb-2">
          No hay Periodos Parlamentarios
        </h3>
        <p className="text-muted-foreground">
          Debes crear al menos un Periodo Parlamentario en la sección de
          &quot;Periodos&quot; antes de poder gestionar los escaños.
        </p>
      </div>
    );
  }

  const _activePeriodObj = periods.find((p) => p.id === selectedPeriod);

  return (
    <div className="space-y-6">
      {/* HEADER: Period Selection */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center p-4 bg-muted/30 rounded-xl border">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Periodo Legislativo
          </label>
          <div className="flex gap-2">
            <Select
              value={selectedPeriod || ""}
              onValueChange={setSelectedPeriod}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecciona un periodo" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p: legislativeperiod) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.active ? " (Activo/Portada)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="DIPUTADOS"
        onValueChange={(val) => {
          setChamber(val as "DIPUTADOS" | "SENADO" | "CONGRESO");
          setSelectedSeatIds(new Set());
          setPaintModeGroup(null);
        }}
      >
        <TabsList>
          <TabsTrigger value="DIPUTADOS">Cámara de Diputados</TabsTrigger>
          <TabsTrigger value="SENADO">Senado</TabsTrigger>
          <TabsTrigger value="CONGRESO">Congreso (Histórico)</TabsTrigger>
        </TabsList>

        <div className="p-4 border rounded-xl mt-4 bg-primary/5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Paintbrush className="w-4 h-4" /> Herramientas de Asignación Rápida
          </h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full max-w-sm">
              <label className="text-xs text-muted-foreground mb-1 block">
                Bancada a pintar (Haz clic en los escaños del SVG)
              </label>
              <Select
                value={paintModeGroup || "none"}
                onValueChange={(val) => {
                  setPaintModeGroup(val === "none" ? null : val);
                  setSelectedSeatIds(new Set());
                }}
              >
                <SelectTrigger className="border-primary/50">
                  <SelectValue placeholder="Selecciona bancada..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    -- Modo Cursor Individual (Clic para asignar 1 a 1) --
                  </SelectItem>
                  {groups.map((g: parliamentarygroup) => (
                    <SelectItem key={g.id} value={g.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: g.color_hex || "#ccc" }}
                        />
                        {g.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {paintModeGroup && (
              <div className="flex gap-2">
                <Button
                  onClick={applyBatchPaint}
                  disabled={selectedSeatIds.size === 0 || isPending}
                  variant="default"
                >
                  Pintar {selectedSeatIds.size} escaño(s)
                </Button>
                <Button
                  onClick={handleAutoAssign}
                  disabled={isPending}
                  variant="secondary"
                  className="gap-2"
                >
                  <Wand2 className="w-4 h-4" /> Auto-Asignar Legisladores
                </Button>
              </div>
            )}
          </div>

          {filteredSeats.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t mt-3 justify-end">
              <Button
                onClick={handleClearAssignments}
                disabled={isPending}
                variant="outline"
                size="sm"
                className="gap-1.5 text-amber-600 hover:text-amber-700 border-amber-300 dark:border-amber-800"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Limpiar Asignaciones
                (Empezar de nuevo)
              </Button>
              <Button
                onClick={handleRegenerateSeats}
                disabled={isPending}
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerar Escaños (Recrear
                Filas)
              </Button>
            </div>
          )}
        </div>

        {/* SVG RENDERER */}
        <div className="w-full flex justify-center py-10">
          {filteredSeats.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">
                No hay escaños generados para la cámara de {chamber} en este
                periodo.
              </p>
              <Button
                onClick={handleGenerateSeats}
                disabled={isPending}
                size="lg"
              >
                Generar Escaños Iniciales
              </Button>
            </div>
          ) : (
            <svg
              viewBox={svgConfig.viewBox}
              className="w-full max-w-4xl h-auto drop-shadow-sm"
              style={{ overflow: "visible" }}
            >
              {/* Escritorio Directivo */}
              <g transform={`translate(${svgConfig.cx}, ${svgConfig.cy + 15})`}>
                <rect
                  x={-70}
                  y={0}
                  width={140}
                  height={18}
                  rx={9}
                  className="fill-slate-200 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700 stroke-1"
                />
                <rect
                  x={-45}
                  y={-8}
                  width={90}
                  height={12}
                  rx={6}
                  className="fill-slate-300 dark:fill-slate-700"
                />
              </g>

              {bubbles.map((bubble, _i) => {
                const isSelected = selectedSeatIds.has(bubble.seat.id);
                const legGroup =
                  bubble.seat.legislator?.parliamentarymembership?.[0]
                    ?.parliamentarygroup;
                const groupInfo = bubble.seat.parliamentarygroup || legGroup;
                const color = groupInfo?.color_hex || "#e2e8f0";
                const hasLegislator = !!bubble.seat.legislator;

                return (
                  <g
                    key={bubble.seat.id}
                    onClick={() => handleSeatClick(bubble.seat)}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      transform: isSelected ? "scale(1.3)" : "scale(1)",
                      transformOrigin: `${bubble.x}px ${bubble.y}px`,
                    }}
                  >
                    <circle
                      cx={bubble.x}
                      cy={bubble.y}
                      r={svgConfig.bubbleRadius}
                      fill={color}
                      className={
                        isSelected
                          ? "stroke-primary stroke-2"
                          : groupInfo
                            ? "stroke-black/10 stroke-1"
                            : "stroke-slate-300 stroke-1"
                      }
                    />
                    {hasLegislator && (
                      <circle
                        cx={bubble.x}
                        cy={bubble.y}
                        r={svgConfig.bubbleRadius * 0.4}
                        className="fill-white/90"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </Tabs>

      {/* INDIVIDUAL ASSIGNMENT MODAL */}
      <Dialog
        open={!!assignModalSeat}
        onOpenChange={(open) => !open && setAssignModalSeat(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Asignar Escaño #{assignModalSeat?.number_seat}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {assignModalSeat?.parliamentarygroup && (
              <div className="flex gap-2 items-center">
                <span className="text-sm font-semibold">Bloque asignado:</span>
                <Badge
                  style={{
                    backgroundColor:
                      assignModalSeat.parliamentarygroup.color_hex || "#ccc",
                  }}
                >
                  {assignModalSeat.parliamentarygroup.name}
                </Badge>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Legislador que ocupa el asiento
              </label>
              <Select
                value={assignModalLegislatorId}
                onValueChange={setAssignModalLegislatorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vacío" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Asiento Vacío --</SelectItem>
                  {filteredLegislators.map((leg: LegislatorType) => {
                    const legGrp =
                      leg.parliamentarymembership?.[0]?.parliamentarygroup;
                    return (
                      <SelectItem key={leg.id} value={leg.id}>
                        {leg.person.name} {leg.person.lastname}
                        {legGrp ? ` (${legGrp.acronym})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalSeat(null)}>
              Cancelar
            </Button>
            <Button onClick={handleIndividualAssign} disabled={isPending}>
              Guardar Asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
