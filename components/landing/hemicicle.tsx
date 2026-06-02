"use client";

import { useState, useEffect, useMemo } from "react";
import { Building2, Users } from "lucide-react";
import Image from "next/image";

import { SeatParliamentary } from "@/interfaces/politics";
import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";

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
      groupInfo: ParliamentaryGroupBasic;
    }
  >();

  seats.forEach((seat) => {
    if (!seat.legislator || !seat.legislator.current_parliamentary_group)
      return;

    const parliamentaryGroup = seat.legislator.current_parliamentary_group;
    const groupId = parliamentaryGroup.id;

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        seats: 0,
        groupInfo: parliamentaryGroup,
      });
    }

    const group = groupMap.get(groupId)!;
    group.seats++;
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

  // Ordenar por número de escaños (descendente)
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
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [selectedGroupMobile, setSelectedGroupMobile] = useState<string | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

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
  const occupiedSeats = seatsData.filter((s) => s.legislator).length;
  const vacantSeats = totalSeats - occupiedSeats;

  // Configuración del hemiciclo optimizada
  const svgConfig = useMemo(() => {
    if (isMobile) {
      return {
        viewBox: "0 0 1000 550",
        cx: 500,
        cy: 480,
        bubbleRadius: 18,
        rows: [
          { radius: 450, count: 32 },
          { radius: 400, count: 29 },
          { radius: 350, count: 26 },
          { radius: 300, count: 23 },
          { radius: 250, count: 20 },
        ],
      };
    }
    return {
      viewBox: "0 0 800 500",
      cx: 400,
      cy: 450,
      bubbleRadius: 14,
      rows: [
        { radius: 380, count: 32 },
        { radius: 340, count: 29 },
        { radius: 300, count: 26 },
        { radius: 260, count: 23 },
        { radius: 220, count: 20 },
      ],
    };
  }, [isMobile]);

  const bubbles = useMemo<Bubble[]>(() => {
    const result: Bubble[] = [];

    const positions: Array<{
      x: number;
      y: number;
      angle: number;
      row: number;
    }> = [];

    [...svgConfig.rows].reverse().forEach((row, rowIndex) => {
      const angleStep = 180 / (row.count - 1);
      for (let i = 0; i < row.count; i++) {
        const angle = i * angleStep;
        const angleRad = (angle * Math.PI) / 180;

        const x =
          Math.round((svgConfig.cx - Math.cos(angleRad) * row.radius) * 100) /
          100;
        const y =
          Math.round((svgConfig.cy - Math.sin(angleRad) * row.radius) * 100) /
          100;

        positions.push({ x, y, angle, row: rowIndex + 1 });
      }
    });

    seatsData.forEach((seat, idx) => {
      if (idx >= positions.length) return;

      const pos = positions[idx];
      let group: ParliamentaryGroup | null = null;

      if (seat.legislator && seat.legislator.current_parliamentary_group) {
        const groupName = seat.legislator.current_parliamentary_group.name;
        group = parliamentaryGroups.find((g) => g.name === groupName) || null;
      }

      result.push({
        x: pos.x,
        y: pos.y,
        seat,
        group,
        angle: pos.angle,
        row: pos.row,
      });
    });

    return result;
  }, [seatsData, parliamentaryGroups, svgConfig]);

  const getColor = (bubble: Bubble): string => {
    if (!bubble.seat.legislator) return "hsl(var(--muted))";
    if (!bubble.seat.legislator.current_parliamentary_group) return "#94a3b8";
    return (
      bubble.seat.legislator.current_parliamentary_group.color_hex || "#94a3b8"
    );
  };

  const handleLegendClick = (groupName: string) => {
    if (!isMobile) return;
    setSelectedGroupMobile(
      selectedGroupMobile === groupName ? null : groupName,
    );
  };

  const TooltipContent = ({ group }: { group: ParliamentaryGroup }) => {
    return (
      <div className="bg-card border-2 border-primary/50 rounded-xl shadow-2xl p-4 backdrop-blur-sm w-auto">
        <div className="flex items-center gap-3">
          <div>
            {group.logo_url ? (
              <div className="relative size-8 bg-white rounded-md flex items-center justify-center shadow-md ring-1 ring-border overflow-hidden flex-shrink-0">
                <Image
                  src={group.logo_url}
                  alt={group.name}
                  fill
                  className="object-contain p-0.5"
                  sizes="48px"
                />
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110 flex-shrink-0"
                style={{ backgroundColor: group.color }}
              >
                <Building2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-card-foreground leading-tight">
              {group.name}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Grupo Parlamentario
            </div>
          </div>
          <div className="flex flex-row md:flex-col items-end gap-1 flex-shrink-0">
            <div className="bg-primary/10 rounded-lg px-3 py-1">
              <div className="text-[10px] text-muted-foreground">Escaños</div>
              <div className="font-bold text-lg text-primary">
                {group.seats}
              </div>
            </div>
            <div className="bg-muted rounded-lg px-3 py-1">
              <div className="text-[10px] text-muted-foreground">% Poder</div>
              <div className="font-bold text-lg text-foreground">
                {((group.seats / totalSeats) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="mb-8 md:mb-16">
          <div className="text-center mb-6 md:mb-10 space-y-3 md:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground px-2">
              El Congreso Actual
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              <span className="text-2xl md:text-3xl font-bold text-primary">
                {totalSeats}
              </span>{" "}
              escaños organizados en{" "}
              <span className="font-semibold text-primary">
                {parliamentaryGroups.length}
              </span>{" "}
              grupos parlamentarios
            </p>
          </div>

          <div className="bg-card rounded-xl md:rounded-2xl shadow-2xl p-3 sm:p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6 min-h-0">
              {/* === HEMICICLO === */}
              <div className="flex-1 flex justify-center lg:min-w-0">
                <div className="relative w-full max-w-[900px]">
                  <svg viewBox={svgConfig.viewBox} className="w-full h-auto">
                    <defs>
                      <filter id="bubbleShadow">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                        <feOffset dx="0" dy="1" result="offsetblur" />
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.3" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>

                      {parliamentaryGroups.map((group) => (
                        <filter
                          key={`glow-${group.name}`}
                          id={`glow-${group.name}`}
                        >
                          <feGaussianBlur
                            stdDeviation="3"
                            result="coloredBlur"
                          />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      ))}
                    </defs>

                    {/* Guías */}
                    {svgConfig.rows.map((row, idx) => (
                      <path
                        key={idx}
                        d={`M ${svgConfig.cx - row.radius} ${svgConfig.cy} A ${row.radius} ${row.radius} 0 0 1 ${svgConfig.cx + row.radius} ${svgConfig.cy}`}
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        strokeDasharray="5 5"
                        opacity="0.3"
                      />
                    ))}

                    {/* Burbujas */}
                    {bubbles.map((bubble, idx) => {
                      const groupName =
                        bubble.seat.legislator?.current_parliamentary_group
                          ?.name || null;
                      const isHovered = hoveredGroup === groupName;
                      const isSelected = selectedGroupMobile === groupName;
                      const isOtherHovered =
                        hoveredGroup && hoveredGroup !== groupName;
                      const isOtherSelected =
                        selectedGroupMobile &&
                        selectedGroupMobile !== groupName;
                      const color = getColor(bubble);

                      return (
                        <circle
                          key={`bubble-${idx}`}
                          cx={bubble.x}
                          cy={bubble.y}
                          r={svgConfig.bubbleRadius}
                          fill={color}
                          opacity={
                            isMobile
                              ? isOtherSelected
                                ? 0.2
                                : isSelected
                                  ? 1
                                  : 0.7
                              : isOtherHovered
                                ? 0.3
                                : isHovered
                                  ? 1
                                  : 0.9
                          }
                          stroke="hsl(var(--background))"
                          strokeWidth={isHovered || isSelected ? 3 : 1.5}
                          filter={
                            (isHovered || isSelected) && groupName
                              ? `url(#glow-${groupName})`
                              : "url(#bubbleShadow)"
                          }
                          className={`transition-all duration-300 ${!isMobile ? "cursor-pointer" : ""}`}
                          onMouseEnter={() =>
                            !isMobile && groupName && setHoveredGroup(groupName)
                          }
                          onMouseLeave={() =>
                            !isMobile && setHoveredGroup(null)
                          }
                          style={{
                            animation: mounted
                              ? `fadeInBubble 0.6s ease-out ${idx * 0.01}s both`
                              : "none",
                          }}
                        />
                      );
                    })}

                    {/* Texto central */}
                    <circle
                      cx={svgConfig.cx}
                      cy={svgConfig.cy - 50}
                      r={isMobile ? 100 : 80}
                      className="fill-card stroke-border"
                      strokeWidth="2"
                      filter="url(#bubbleShadow)"
                    />
                    <text
                      x={svgConfig.cx}
                      y={svgConfig.cy - 60}
                      textAnchor="middle"
                      fontSize={isMobile ? "64" : "54"}
                      fontWeight="bold"
                      fill="currentColor"
                      className="text-primary"
                    >
                      {totalSeats}
                    </text>
                    <text
                      x={svgConfig.cx}
                      y={svgConfig.cy - 24}
                      textAnchor="middle"
                      fontSize={isMobile ? "32" : "24"}
                      fontWeight="600"
                      fill="currentColor"
                      className="text-muted-foreground tracking-[1px]"
                    >
                      ESCAÑOS
                    </text>
                  </svg>

                  {/* Tooltip escritorio */}
                  {!isMobile && hoveredGroup && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
                      <TooltipContent
                        group={
                          parliamentaryGroups.find(
                            (g) => g.name === hoveredGroup,
                          )!
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Leyenda */}
              <div className="lg:w-80 lg:flex-shrink-0 mt-4 lg:mt-0">
                <h3 className="text-xs md:text-sm font-semibold text-card-foreground mb-2 text-center lg:text-left uppercase tracking-wide">
                  Grupos Parlamentarios
                </h3>
                <p className="text-center md:text-left text-xs text-muted-foreground mb-2">
                  Selecciona un grupo parlamentario
                </p>
                <div
                  className="
                    flex md:grid 
                    lg:grid-cols-1 
                    gap-2 md:gap-2 md:space-y-0
                    overflow-x-auto md:overflow-x-hidden 
                    snap-x snap-mandatory md:snap-none
                    lg:overflow-y-auto
                    lg:overscroll-contain
                    p-2
                    lg:max-h-[500px]
                    scrollbar-thin
                    scrollbar-track-transparent
                    scrollbar-thumb-primary/30
                    hover:scrollbar-thumb-primary/50
                  "
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "hsl(var(--primary) / 0.3) transparent",
                  }}
                  onWheel={(e) => {
                    if (window.innerWidth >= 768) {
                      const element = e.currentTarget;
                      const isAtTop = element.scrollTop === 0;
                      const isAtBottom =
                        element.scrollHeight - element.scrollTop ===
                        element.clientHeight;

                      if (
                        (isAtTop && e.deltaY < 0) ||
                        (isAtBottom && e.deltaY > 0)
                      ) {
                      } else {
                        e.stopPropagation();
                      }
                    }
                  }}
                >
                  {parliamentaryGroups.map((group, idx) => {
                    const isHovered = hoveredGroup === group.name;
                    const isSelected = selectedGroupMobile === group.name;
                    const isActive = isHovered || isSelected;

                    return (
                      <button
                        key={group.name}
                        onMouseEnter={() =>
                          !isMobile && setHoveredGroup(group.name)
                        }
                        onMouseLeave={() => !isMobile && setHoveredGroup(null)}
                        onClick={() =>
                          isMobile && handleLegendClick(group.name)
                        }
                        className={`
                          flex items-center gap-2 md:gap-3 p-2 rounded-lg border-2 transition-all duration-300 
                          snap-center md:snap-align-none
                          min-w-[280px] md:min-w-0
                          flex-shrink-0 md:flex-shrink
                          
                          ${
                            isActive
                              ? "border-primary shadow-lg bg-primary/10 scale-[1.02]"
                              : "border-border hover:border-primary/50 bg-card"
                          }
                        `}
                        style={{
                          animation: mounted
                            ? `fadeIn 0.5s ease-out ${0.3 + idx * 0.05}s both`
                            : "none",
                        }}
                      >
                        <div>
                          {group.logo_url ? (
                            <div className="relative size-8 bg-white rounded-md flex items-center justify-center shadow-md ring-1 ring-border overflow-hidden flex-shrink-0">
                              <Image
                                src={group.logo_url}
                                alt={group.name}
                                fill
                                className="object-contain p-0.5"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-8 h-8 rounded-md flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110 flex-shrink-0"
                              style={{ backgroundColor: group.color }}
                            >
                              <Building2 className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between min-w-[200px] max-w-[250px] items-center">
                          <div className="text-xs text-left md:text-sm font-bold text-card-foreground whitespace-normal">
                            {group.name}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-base font-bold text-card-foreground">
                              {group.seats}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {((group.seats / totalSeats) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {vacantSeats > 0 && (
                    <div className="flex items-center gap-2 md:gap-3 p-2 rounded-lg border-2 border-dashed border-border bg-muted/50 snap-center md:snap-align-none min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
                      <div className="w-8 h-8 rounded-md bg-muted-foreground/50 flex-shrink-0 flex items-center justify-center">
                        <Users className="w-4 h-4 text-background" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs md:text-sm font-bold text-muted-foreground">
                          Vacantes
                        </div>
                        <div className="text-[10px] text-muted-foreground/70">
                          Sin asignar
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-base font-bold text-muted-foreground">
                          {vacantSeats}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:hidden flex justify-center gap-1 mt-2">
                  {parliamentaryGroups.map((_, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 h-1.5 rounded-full bg-primary/30 transition-all"
                    />
                  ))}
                </div>

                {/* Tooltip móvil */}
                {isMobile && selectedGroupMobile && (
                  <div className="mt-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <TooltipContent
                      group={
                        parliamentaryGroups.find(
                          (g) => g.name === selectedGroupMobile,
                        )!
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
