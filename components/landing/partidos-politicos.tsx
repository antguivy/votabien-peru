"use client";

import { useState, useEffect, useMemo } from "react";
import { Building2, Calendar, ExternalLink, Users } from "lucide-react";
import {
  PoliticalPartyBase,
  PoliticalPartyDetail,
  SeatParliamentary,
} from "@/interfaces/politics";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PartidoDialog from "../politics/partido-dialog";

interface ParliamentaryGroup {
  name: string;
  seats: number;
  color: string;
  mainPartyId: string;
  composition: Array<{
    partyId: string;
    partyName: string;
    partyLogoUrl: string | null;
    partyAcronym: string | null;
    count: number;
  }>;
}

interface PartidosSectionProps {
  seatsData: SeatParliamentary[];
  partidosConEscaños: PoliticalPartyDetail[];
  partidosPreview: PoliticalPartyDetail[];
  totalPartidos: number;
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
      parties: Map<
        string,
        {
          count: number;
          party: PoliticalPartyBase;
        }
      >;
    }
  >();

  seats.forEach((seat) => {
    if (!seat.legislator) return;

    const groupName = seat.legislator.parliamentary_group || "No Agrupados";
    const party = seat.legislator.original_party;

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        seats: 0,
        parties: new Map(),
      });
    }

    const group = groupMap.get(groupName)!;
    group.seats++;

    if (!group.parties.has(party.id)) {
      group.parties.set(party.id, { count: 0, party });
    }
    group.parties.get(party.id)!.count++;
  });

  const parliamentaryGroups: ParliamentaryGroup[] = [];

  groupMap.forEach((groupData, groupName) => {
    let mainParty: PoliticalPartyBase | null = null;
    let maxCount = 0;

    groupData.parties.forEach((partyData) => {
      if (partyData.count > maxCount) {
        maxCount = partyData.count;
        mainParty = partyData.party as PoliticalPartyBase;
      }
    });

    if (mainParty) {
      const composition = Array.from(groupData.parties.values())
        .map((p) => ({
          partyId: p.party.id,
          partyName: p.party.name,
          partyLogoUrl: p.party.logo_url,
          partyAcronym: p.party.acronym,
          count: p.count,
        }))
        .sort((a, b) => b.count - a.count);

      parliamentaryGroups.push({
        name: groupName,
        seats: groupData.seats,
        color: (mainParty as PoliticalPartyBase).color_hex || "#94a3b8",
        mainPartyId: (mainParty as PoliticalPartyBase).id,
        composition,
      });
    }
  });

  return parliamentaryGroups.sort((a, b) => b.seats - a.seats);
}

export default function PartidosSection({
  seatsData,
  partidosPreview,
  totalPartidos,
}: PartidosSectionProps) {
  const [selectedPartido, setSelectedPartido] =
    useState<PoliticalPartyDetail | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [selectedGroupMobile, setSelectedGroupMobile] = useState<string | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
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
    const sortedSeats = [...seatsData].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.number_seat - b.number_seat;
    });

    const positions: Array<{
      x: number;
      y: number;
      angle: number;
      row: number;
    }> = [];

    svgConfig.rows.forEach((row, rowIndex) => {
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

    sortedSeats.forEach((seat, idx) => {
      if (idx >= positions.length) return;

      const pos = positions[idx];
      let group: ParliamentaryGroup | null = null;

      if (seat.legislator) {
        const groupName = seat.legislator.parliamentary_group || "No Agrupados";
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
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("es-PE").format(num);
  };
  const getColor = (bubble: Bubble): string => {
    if (!bubble.seat.legislator) return "hsl(var(--muted))";
    return bubble.group?.color || "#94a3b8";
  };
  const calcularAños = (fecha: Date | null): number | null => {
    if (!fecha) return null;
    return new Date().getFullYear() - new Date(fecha).getFullYear();
  };
  const handleLegendClick = (groupName: string) => {
    if (!isMobile) return;
    setSelectedGroupMobile(
      selectedGroupMobile === groupName ? null : groupName,
    );
  };

  const TooltipContent = ({ group }: { group: ParliamentaryGroup }) => (
    <div className="bg-card border-2 border-primary/50 rounded-xl shadow-2xl p-4 backdrop-blur-sm w-[88vw]  md:w-auto md:min-w-[280px]">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0"
          style={{ backgroundColor: group.color }}
        >
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-card-foreground leading-tight">
            {group.name}
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Grupo Parlamentario
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="bg-primary/10 rounded-lg px-3 py-1">
            <div className="text-[10px] text-muted-foreground">Escaños</div>
            <div className="font-bold text-lg text-primary">{group.seats}</div>
          </div>
          <div className="bg-muted rounded-lg px-3 py-1">
            <div className="text-[10px] text-muted-foreground">% Poder</div>
            <div className="font-bold text-lg text-foreground">
              {((group.seats / totalSeats) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {group.composition.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2 font-semibold">
            Composición:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {group.composition.map((comp, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg p-2"
              >
                {comp.partyLogoUrl ? (
                  <Image
                    src={comp.partyLogoUrl}
                    alt={comp.partyName}
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <span className="flex-1 text-card-foreground font-medium">
                  {comp.partyName}
                </span>
                <span className="font-bold flex-shrink-0 text-primary">
                  {comp.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  return (
    <section className="bg-gradient-to-b from-muted/30 pb-10 md:pb-16 to-background overflow-hidden">
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

          {/* Layout optimizado: Hemiciclo + Leyenda lado a lado en desktop */}
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
                        bubble.seat.legislator?.parliamentary_group || null;
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
                <h3 className="text-xs md:text-sm font-semibold text-card-foreground mb-3 text-center lg:text-left uppercase tracking-wide">
                  Grupos Parlamentarios
                </h3>

                {/* Layout horizontal en mobile */}
                <div
                  className="
                    flex md:grid 
                    md:grid-cols-1 
                    gap-2 md:space-y-2 
                    overflow-x-auto md:overflow-x-hidden 
                    md:overflow-y-auto
                    pb-2 md:pb-0
                    md:max-h-[500px]
                  "
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "hsl(var(--primary)) hsl(var(--muted))",
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
                          flex items-center gap-2 md:gap-3 p-2 rounded-lg border-2 transition-all duration-300 flex-shrink-0 md:flex-shrink
                          ${
                            isActive
                              ? "border-primary shadow-lg bg-primary/10"
                              : "border-border hover:border-primary/50 bg-card"
                          }
                        `}
                        style={{
                          animation: mounted
                            ? `fadeIn 0.5s ease-out ${0.3 + idx * 0.05}s both`
                            : "none",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110 flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        >
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-xs md:text-sm font-bold text-card-foreground truncate">
                            {group.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {group.composition.length} partido
                            {group.composition.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-base font-bold text-card-foreground">
                            {group.seats}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {((group.seats / totalSeats) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {vacantSeats > 0 && (
                    <div className="flex items-center gap-2 md:gap-3 p-2 rounded-lg border-2 border-dashed border-border bg-muted/50 flex-shrink-0 md:flex-shrink">
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

        {/* PARTE 2: LA BATALLA DE 2026 */}
        <div className="relative">
          <div className="flex items-center gap-4 mb-8 md:mb-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground px-2">
              Conoce a los Partidos Políticos
            </h2>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              <span className="text-2xl md:text-3xl font-bold text-primary">
                {totalPartidos}
              </span>{" "}
              partidos políticos registrados buscan tu voto en 2026. Conoce sus
              propuestas, trayectoria y decide con información.
            </p>
          </div>
          {/* Grid de partidos preview */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            {partidosPreview.map((partido, idx) => {
              const años = calcularAños(partido.foundation_date);
              const tieneRedes = !!(
                partido.facebook_url ||
                partido.twitter_url ||
                partido.youtube_url ||
                partido.tiktok_url
              );

              const color = partido.color_hex || "#6366f1";

              return (
                <Card
                  key={partido.id}
                  onClick={() => setSelectedPartido(partido)}
                  className="group p-0 relative overflow-hidden border-2 hover:border-primary/50 rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer text-left flex flex-col"
                  style={{
                    animation: mounted
                      ? `fadeInUp 0.6s ease-out ${idx * 0.1}s both`
                      : "none",
                  }}
                >
                  <CardHeader className="relative h-20 md:h-28 p-0 overflow-hidden flex-shrink-0">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[length:16px_16px]" />
                    </div>

                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8 group-hover:scale-110 transition-transform duration-500" />

                    <div className="absolute inset-0 flex items-center justify-center p-3">
                      <div className="relative w-14 h-14 md:w-20 md:h-20 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-md overflow-hidden ring-1 ring-border group-hover:ring-primary/30 transition-all duration-300">
                        {partido.logo_url ? (
                          <Image
                            src={partido.logo_url}
                            alt={partido.name}
                            width={80}
                            height={80}
                            className="object-contain p-1"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 md:p-6 pt-6 md:pt-10 flex flex-col flex-1">
                    <h3 className="font-bold text-sm md:text-base lg:text-lg text-foreground mb-2 line-clamp-2 h-10 md:h-12 group-hover:text-primary transition-colors">
                      {partido.name}
                    </h3>

                    <div className="h-5 mb-3">
                      {partido.ideology && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {partido.ideology}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap text-xs md:text-sm min-h-[1.5rem]">
                      {partido.total_afiliates > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-primary" />
                          <span className="font-semibold">
                            {formatNumber(partido.total_afiliates)}
                          </span>
                        </div>
                      )}

                      {años && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{años} años</span>
                        </div>
                      )}

                      {tieneRedes && (
                        <div className="flex items-center gap-1 text-success">
                          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                          <span>Activo en redes</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end pt-2 md:pt-3 border-t border-border mt-auto">
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm border border-border hover:border-primary/50 transition-all duration-300 group-hover:scale-105"
                      >
                        Conocer más
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/partidos"
              className="inline-flex items-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group text-sm md:text-base"
            >
              <span>Explorar los {totalPartidos} Partidos Políticos</span>
              <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
            </Link>

            <p className="mt-3 md:mt-4 text-xs md:text-sm text-muted-foreground px-4">
              Tu voto informado empieza aquí.
            </p>
          </div>
        </div>
      </div>

      {selectedPartido && (
        <PartidoDialog
          partido={selectedPartido}
          isOpen={!!selectedPartido}
          onClose={() => setSelectedPartido(null)}
        />
      )}
    </section>
  );
}
