"use client";

import { useState, useEffect, useMemo } from "react";
import { Users } from "lucide-react";
import Image from "next/image";

import { SeatParliamentary } from "@/interfaces/politics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ParliamentaryGroup {
  name: string;
  seats: number;
  color: string;
  mainPartyId: string;
  logo_url: string;
  composition: [];
}

interface PartidosSectionProps {
  seatsData: SeatParliamentary[];
}

interface Bubble {
  x: number;
  y: number;
  seat: SeatParliamentary;
  group: ParliamentaryGroup | null;
  angle: number;
  row: number;
}

// ========== UTILIDADES ==========

function processSeatsForHemiciclo(
  seats: SeatParliamentary[],
): ParliamentaryGroup[] {
  const groupMap = new Map<
    string,
    {
      seats: number;
      groupInfo: {
        id: string;
        name: string;
        color_hex?: string | null;
        logo_url?: string | null;
      };
    }
  >();

  seats.forEach((seat) => {
    let group = null;
    if (seat.parliamentarygroup) {
      group = seat.parliamentarygroup;
    } else if (seat.legislator?.current_parliamentary_group) {
      group = seat.legislator.current_parliamentary_group;
    }

    if (!group) return;

    const groupId = group.id;

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        seats: 0,
        groupInfo: group,
      });
    }

    groupMap.get(groupId)!.seats++;
  });

  const parliamentaryGroups: ParliamentaryGroup[] = [];

  groupMap.forEach((groupData) => {
    parliamentaryGroups.push({
      name: groupData.groupInfo.name,
      seats: groupData.seats,
      color: groupData.groupInfo.color_hex || "#94a3b8",
      mainPartyId: groupData.groupInfo.id,
      logo_url: groupData.groupInfo.logo_url || "",
      composition: [],
    });
  });

  return parliamentaryGroups.sort((a, b) => b.seats - a.seats);
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// ========== COMPONENTE PRINCIPAL ==========

export default function HemicileLegislator({
  seatsData,
}: PartidosSectionProps) {
  const [chamber, setChamber] = useState<string>(() => {
    if (seatsData.some((s) => s.chamber === "DIPUTADOS")) return "DIPUTADOS";
    if (seatsData.some((s) => s.chamber === "CONGRESO")) return "CONGRESO";
    if (seatsData.some((s) => s.chamber === "SENADO")) return "SENADO";
    return "DIPUTADOS";
  });

  const hasDiputados = seatsData.some((s) => s.chamber === "DIPUTADOS");
  const hasSenado = seatsData.some((s) => s.chamber === "SENADO");
  const hasCongreso = seatsData.some((s) => s.chamber === "CONGRESO");

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          Composición del Congreso de la República 2026
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl mx-auto">
          Distribución actual de las bancadas parlamentarias.
        </p>
      </div>

      {hasDiputados || hasSenado || hasCongreso ? (
        <Tabs
          value={chamber}
          onValueChange={setChamber}
          className="w-full max-w-5xl"
        >
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mx-auto mb-8">
            {(hasDiputados || hasSenado) && (
              <>
                <TabsTrigger value="DIPUTADOS">Diputados</TabsTrigger>
                <TabsTrigger value="SENADO">Senado</TabsTrigger>
              </>
            )}
            {hasCongreso && !hasDiputados && !hasSenado && (
              <TabsTrigger value="CONGRESO">Congreso</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="DIPUTADOS" className="w-full">
            <HemicicloRenderer
              seatsData={seatsData.filter((s) => s.chamber === "DIPUTADOS")}
            />
          </TabsContent>
          <TabsContent value="SENADO" className="w-full">
            <HemicicloRenderer
              seatsData={seatsData.filter((s) => s.chamber === "SENADO")}
            />
          </TabsContent>
          <TabsContent value="CONGRESO" className="w-full">
            <HemicicloRenderer
              seatsData={seatsData.filter((s) => s.chamber === "CONGRESO")}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center p-10 border rounded-xl bg-muted/20">
          No hay datos de asientos.
        </div>
      )}
    </div>
  );
}

// ========== COMPONENTE RENDERIZADOR ESPECIFICO ==========

// ---- CONFIG ----

const SENADO_CONFIG = {
  viewBox: "0 0 800 600",
  cx: 400,
  cy: 530,
  bubbleRadius: 45,
  rows: [
    { radius: 400, count: 16 },
    { radius: 310, count: 14 },
    { radius: 225, count: 12 },
    { radius: 145, count: 10 },
    { radius: 75, count: 8 },
  ],
};

const DIPUTADOS_CONFIG = {
  viewBox: "0 0 800 600",
  cx: 400,
  cy: 520,
  bubbleRadius: 21,
  rows: [
    { radius: 390, count: 26 },
    { radius: 348, count: 22 },
    { radius: 306, count: 19 },
    { radius: 264, count: 17 },
    { radius: 222, count: 15 },
    { radius: 180, count: 13 },
    { radius: 138, count: 10 },
    { radius: 96, count: 8 },
  ],
};

const MOBILE_CONFIG = {
  viewBox: "0 0 1000 550",
  cx: 500,
  cy: 480,
  bubbleRadius: 30,
  rows: [
    { radius: 450, count: 26 },
    { radius: 400, count: 22 },
    { radius: 350, count: 19 },
    { radius: 300, count: 17 },
    { radius: 250, count: 15 },
  ],
};

function HemicicloRenderer({ seatsData }: { seatsData: SeatParliamentary[] }) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeBubble, setActiveBubble] = useState<Bubble | null>(null);

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const parliamentaryGroups = useMemo(
    () => processSeatsForHemiciclo(seatsData),
    [seatsData],
  );

  const totalSeats = seatsData.length;
  const occupiedSeats = seatsData.filter(
    (s) => s.legislator || s.parliamentary_group_id,
  ).length;

  const svgConfig = useMemo(() => {
    if (isMobile) return MOBILE_CONFIG;
    if (seatsData.every((s) => s.chamber === "SENADO")) return SENADO_CONFIG;
    return DIPUTADOS_CONFIG;
  }, [isMobile, seatsData]);

  const bubbles: Bubble[] = useMemo(() => {
    const sortedSeats = [...seatsData].sort((a, b) => {
      const groupA =
        a.parliamentarygroup?.name ||
        a.legislator?.current_parliamentary_group?.name ||
        "ZZZ";
      const groupB =
        b.parliamentarygroup?.name ||
        b.legislator?.current_parliamentary_group?.name ||
        "ZZZ";
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      if (a.row !== b.row) return a.row - b.row;
      return a.number_seat - b.number_seat;
    });

    const calculatedBubbles: Bubble[] = [];
    let seatIndex = 0;

    svgConfig.rows.forEach((rowConfig, rowIndex) => {
      const angleStep = Math.PI / (rowConfig.count - 1);

      for (let i = 0; i < rowConfig.count; i++) {
        if (seatIndex >= sortedSeats.length) break;

        const seat = sortedSeats[seatIndex];
        const angle = Math.PI - i * angleStep;

        const x = svgConfig.cx + rowConfig.radius * Math.cos(angle);
        const y = svgConfig.cy - rowConfig.radius * Math.sin(angle);

        let groupInfo = null;
        if (seat.parliamentarygroup) {
          groupInfo = {
            name: seat.parliamentarygroup.name,
            seats: 0,
            color: seat.parliamentarygroup.color_hex || "#ccc",
            mainPartyId: seat.parliamentarygroup.id,
            logo_url: seat.parliamentarygroup.logo_url || "",
            composition: [],
          };
        } else if (seat.legislator?.current_parliamentary_group) {
          const legGrp = seat.legislator.current_parliamentary_group;
          groupInfo = {
            name: legGrp.name,
            seats: 0,
            color: legGrp.color_hex || "#ccc",
            mainPartyId: legGrp.id,
            logo_url: legGrp.logo_url || "",
            composition: [],
          };
        }

        calculatedBubbles.push({
          x,
          y,
          seat,
          group: groupInfo as ParliamentaryGroup | null,
          angle,
          row: rowIndex + 1,
        });

        seatIndex++;
      }
    });

    return calculatedBubbles;
  }, [seatsData, svgConfig]);

  if (!mounted) {
    return (
      <div className="h-[400px] w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* HEMICICLO */}
      <div className="w-full flex flex-col items-center justify-center relative">
        <div className="w-full max-w-3xl relative">
          <svg
            viewBox={svgConfig.viewBox}
            className="w-full h-auto drop-shadow-sm"
            style={{ overflow: "visible" }}
          >
            <defs>
              {bubbles.map((bubble) => {
                if (!bubble.group?.logo_url) return null;
                return (
                  <clipPath
                    key={`clip-${bubble.seat.id}`}
                    id={`clip-${bubble.seat.id}`}
                  >
                    <circle
                      cx={bubble.x}
                      cy={bubble.y}
                      r={svgConfig.bubbleRadius}
                    />
                  </clipPath>
                );
              })}
            </defs>

            {/* Escritorio Directivo */}
            <rect
              x={svgConfig.cx - 60}
              y={svgConfig.cy + 20}
              width="120"
              height="20"
              rx="4"
              className="fill-slate-200 dark:fill-slate-800"
            />

            {bubbles.map((bubble, i) => {
              const isHoveredGroup =
                hoveredGroup && bubble.group?.name === hoveredGroup;
              const isDimmed =
                hoveredGroup && bubble.group?.name !== hoveredGroup;

              const color = bubble.group?.color || "transparent";
              const hasLegislator = !!bubble.seat.legislator;
              const logoUrl = bubble.group?.logo_url;

              return (
                <g
                  key={bubble.seat.id || i}
                  onMouseEnter={() => setActiveBubble(bubble)}
                  onMouseLeave={() => setActiveBubble(null)}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: isDimmed ? 0.2 : 1,
                    transform: isHoveredGroup ? "scale(1.1)" : "scale(1)",
                    transformOrigin: `${bubble.x}px ${bubble.y}px`,
                  }}
                >
                  <circle
                    cx={bubble.x}
                    cy={bubble.y}
                    r={svgConfig.bubbleRadius}
                    fill={color}
                    className={
                      !bubble.group
                        ? "stroke-slate-300 dark:stroke-slate-700 stroke-[1.5px]"
                        : "stroke-white/20"
                    }
                  />
                  {logoUrl && (
                    <g clipPath={`url(#clip-${bubble.seat.id})`}>
                      <image
                        href={logoUrl}
                        x={bubble.x - svgConfig.bubbleRadius}
                        y={bubble.y - svgConfig.bubbleRadius}
                        width={svgConfig.bubbleRadius * 2}
                        height={svgConfig.bubbleRadius * 2}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </g>
                  )}
                  {hasLegislator && (
                    <circle
                      cx={bubble.x}
                      cy={bubble.y}
                      r={svgConfig.bubbleRadius * 0.35}
                      className="fill-white/80 dark:fill-white/90"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* TOTALES EN EL CENTRO */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <span className="text-5xl font-extrabold text-slate-800 dark:text-slate-100 block mb-1">
              {totalSeats}
            </span>
            <span className="text-sm font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-2 justify-center">
              <Users className="w-4 h-4" />
              Escaños
            </span>
          </div>

          {/* TOOLTIP INTERACTIVO */}
          {activeBubble && (
            <div
              className="absolute z-50 pointer-events-none transition-all duration-200 ease-out"
              style={{
                left: `${(activeBubble.x / parseInt(svgConfig.viewBox.split(" ")[2])) * 100}%`,
                top: `${(activeBubble.y / parseInt(svgConfig.viewBox.split(" ")[3])) * 100}%`,
                transform: "translate(-50%, -120%)",
              }}
            >
              <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700/50 flex flex-col gap-2 min-w-[200px] animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden relative flex-shrink-0 bg-slate-800 border border-slate-700">
                    {activeBubble.group?.logo_url ? (
                      <Image
                        src={activeBubble.group.logo_url}
                        alt={activeBubble.group.name}
                        fill
                        className="object-contain p-0.5"
                      />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{
                          backgroundColor: activeBubble.group?.color || "#ccc",
                        }}
                      />
                    )}
                  </div>
                  <span className="font-semibold text-sm line-clamp-1">
                    {activeBubble.group?.name || "Sin Bancada"}
                  </span>
                </div>

                {activeBubble.seat.legislator ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden relative border border-slate-700 flex-shrink-0">
                      <Image
                        src={`/api/proxy-image?url=${encodeURIComponent(activeBubble.seat.legislator.person?.image_url || "")}`}
                        alt="Legislador"
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.src = "/images/placeholder-user.png";
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-200">
                        {activeBubble.seat.legislator.person?.name}{" "}
                        {activeBubble.seat.legislator.person?.lastname}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {activeBubble.seat.chamber} • Escaño{" "}
                        {activeBubble.seat.number_seat}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-1 text-center">
                    Escaño {activeBubble.seat.number_seat} (Por definir
                    legislador)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BANCADAS SUMMARY - Below the hemiciclo */}
      <div className="w-full max-w-5xl mx-auto">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 text-center">
          Bancadas ({parliamentaryGroups.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {parliamentaryGroups.map((group) => (
            <div
              key={group.mainPartyId}
              onMouseEnter={() => setHoveredGroup(group.name)}
              onMouseLeave={() => setHoveredGroup(null)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3
                ${
                  hoveredGroup === group.name
                    ? "border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-slate-800/50 scale-[1.02]"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
                }
              `}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 shadow-sm">
                {group.logo_url ? (
                  <Image
                    src={group.logo_url}
                    alt={group.name}
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: group.color }}
                  />
                )}
              </div>
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300 flex-1 leading-tight">
                {group.name}
              </span>
              <div className="flex flex-col items-end">
                <span className="font-bold text-lg leading-tight text-slate-900 dark:text-white">
                  {group.seats}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {((group.seats / totalSeats) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
