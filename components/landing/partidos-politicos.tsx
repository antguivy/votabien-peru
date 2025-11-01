"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  logo_url: string | null;
  acronym: string | null;
  mainPartyId: string;
  composition: Array<{
    partyId: string;
    partyName: string;
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
          count: p.count,
        }))
        .sort((a, b) => b.count - a.count);

      parliamentaryGroups.push({
        name: groupName,
        seats: groupData.seats,
        color: (mainParty as PoliticalPartyBase).color_hex || "#94a3b8",
        logo_url: (mainParty as PoliticalPartyBase).logo_url,
        acronym: (mainParty as PoliticalPartyBase).acronym || groupName,
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
  const [mobileTooltip, setMobileTooltip] = useState<{
    group: ParliamentaryGroup;
    x: number;
    y: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const hemicicloRef = useRef<HTMLDivElement>(null);

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
        viewBox: "0 0 1000 450",
        cx: 500,
        cy: 400,
        bubbleRadius: 15,
        rows: [
          { radius: 400, count: 32 },
          { radius: 360, count: 29 },
          { radius: 320, count: 26 },
          { radius: 280, count: 23 },
          { radius: 240, count: 20 },
        ],
      };
    }
    return {
      viewBox: "0 0 800 450",
      cx: 400,
      cy: 400,
      bubbleRadius: 15,
      rows: [
        { radius: 350, count: 32 },
        { radius: 310, count: 29 },
        { radius: 270, count: 26 },
        { radius: 230, count: 23 },
        { radius: 190, count: 20 },
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
  const calcularAños = (fecha: Date | null): number | null => {
    if (!fecha) return null;
    return new Date().getFullYear() - new Date(fecha).getFullYear();
  };
  const getColor = (bubble: Bubble): string => {
    if (!bubble.seat.legislator) return "#e2e8f0";
    return bubble.group?.color || "#94a3b8";
  };

  const handleBubbleClick = (
    bubble: Bubble,
    event: React.MouseEvent<SVGCircleElement>,
  ) => {
    if (!isMobile || !bubble.group) return;

    const rect = hemicicloRef.current?.getBoundingClientRect();
    if (!rect) return;

    const svgX = (event.clientX - rect.left) / rect.width;
    const svgY = (event.clientY - rect.top) / rect.height;

    setMobileTooltip({
      group: bubble.group,
      x: svgX * 100,
      y: svgY * 100,
    });
  };

  // Cerrar tooltip móvil al hacer click fuera
  useEffect(() => {
    if (!isMobile || !mobileTooltip) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!hemicicloRef.current?.contains(e.target as Node)) {
        setMobileTooltip(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMobile, mobileTooltip]);

  const TooltipContent = ({ group }: { group: ParliamentaryGroup }) => (
    <div className="bg-white dark:bg-slate-800 border-2 border-indigo-500/50 rounded-xl shadow-2xl p-4 min-w-[280px] max-w-[320px] backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-3">
        {group.logo_url ? (
          <Image
            src={group.logo_url}
            alt={group.name}
            width={40}
            height={40}
            className="w-10 h-10 object-contain flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
            style={{ backgroundColor: group.color }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
            {group.name}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Grupo Parlamentario
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-2">
          <div className="text-slate-600 dark:text-slate-400 mb-1 text-xs">
            Escaños
          </div>
          <div className="font-bold text-xl text-indigo-600 dark:text-indigo-400">
            {group.seats}
          </div>
        </div>
        <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-2">
          <div className="text-slate-600 dark:text-slate-400 mb-1 text-xs">
            % Poder
          </div>
          <div className="font-bold text-xl text-slate-900 dark:text-white">
            {((group.seats / totalSeats) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {group.composition.length > 1 && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
            Composición:
          </div>
          {group.composition.map((comp, idx) => (
            <div
              key={idx}
              className="text-xs text-slate-700 dark:text-slate-300 flex justify-between"
            >
              <span className="truncate mr-2">{comp.partyName}</span>
              <span className="font-semibold flex-shrink-0">{comp.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="bg-gradient-to-b from-muted/30 pb-10 md:pb-16 to-background overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-900 dark:text-white px-2">
              El Congreso en Tiempo Real
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
              <span className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {totalSeats}
              </span>{" "}
              escaños organizados en{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {parliamentaryGroups.length}
              </span>{" "}
              grupos parlamentarios
            </p>
          </div>

          {/* Layout optimizado: Hemiciclo + Leyenda lado a lado en desktop */}
          <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-2xl p-3 sm:p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Hemiciclo */}
              <div className="flex-1 lg:min-w-0">
                <div
                  ref={hemicicloRef}
                  className="relative mb-4 lg:mb-0 aspect-[2/1]"
                >
                  <svg viewBox={svgConfig.viewBox} className="w-full h-full">
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

                    {/* Guide lines */}
                    {svgConfig.rows.map((row, idx) => (
                      <path
                        key={idx}
                        d={`M ${svgConfig.cx - row.radius} ${svgConfig.cy} A ${row.radius} ${row.radius} 0 0 1 ${svgConfig.cx + row.radius} ${svgConfig.cy}`}
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.15)"
                        strokeWidth="1"
                        strokeDasharray="5 5"
                      />
                    ))}

                    {/* Bubbles */}
                    {bubbles.map((bubble, idx) => {
                      const groupName =
                        bubble.seat.legislator?.parliamentary_group || null;
                      const isHovered = hoveredGroup === groupName;
                      const isOtherHovered =
                        hoveredGroup !== null && hoveredGroup !== groupName;
                      const color = getColor(bubble);

                      return (
                        <circle
                          key={`bubble-${idx}`}
                          cx={bubble.x}
                          cy={bubble.y}
                          r={svgConfig.bubbleRadius}
                          fill={color}
                          opacity={isOtherHovered ? 0.3 : isHovered ? 1 : 0.9}
                          stroke="white"
                          strokeWidth={isHovered ? 3 : 1.5}
                          filter={
                            isHovered && groupName
                              ? `url(#glow-${groupName})`
                              : "url(#bubbleShadow)"
                          }
                          className="cursor-pointer transition-all duration-300"
                          onMouseEnter={() =>
                            !isMobile && groupName && setHoveredGroup(groupName)
                          }
                          onMouseLeave={() =>
                            !isMobile && setHoveredGroup(null)
                          }
                          onClick={(e) =>
                            isMobile && handleBubbleClick(bubble, e)
                          }
                          style={{
                            animation: mounted
                              ? `fadeInBubble 0.6s ease-out ${idx * 0.01}s both`
                              : "none",
                          }}
                        />
                      );
                    })}

                    {/* Central text */}
                    <circle
                      cx={svgConfig.cx}
                      cy={svgConfig.cy - 50}
                      r={isMobile ? 100 : 60}
                      fill="white"
                      stroke="rgb(226, 232, 240)"
                      strokeWidth="2"
                      filter="url(#bubbleShadow)"
                    />
                    <text
                      x={svgConfig.cx}
                      y={svgConfig.cy - 60}
                      textAnchor="middle"
                      fontSize={isMobile ? "64" : "32"}
                      fontWeight="bold"
                      fill="rgb(99, 102, 241)"
                    >
                      {totalSeats}
                    </text>
                    <text
                      x={svgConfig.cx}
                      y={svgConfig.cy - 24}
                      textAnchor="middle"
                      fontSize={isMobile ? "32" : "12"}
                      fontWeight="600"
                      fill="rgb(100, 116, 139)"
                      letterSpacing="1"
                    >
                      ESCAÑOS
                    </text>
                  </svg>

                  {/* Mobile Tooltip */}
                  {isMobile && mobileTooltip && (
                    <div
                      className="absolute z-20 animate-in fade-in zoom-in-95 duration-200"
                      style={{
                        left: `${mobileTooltip.x}%`,
                        top: `${mobileTooltip.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setMobileTooltip(null)}
                        className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-10"
                      >
                        ×
                      </button>
                      <TooltipContent group={mobileTooltip.group} />
                    </div>
                  )}

                  {/* Desktop Tooltip - Posición fija arriba */}
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

                {/* Instrucción para mobile */}
                {isMobile && (
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                    Toca un escaño para ver detalles
                  </p>
                )}
              </div>

              {/* Legend - Lateral en desktop, abajo en mobile */}
              <div className="lg:w-80 lg:flex-shrink-0">
                <h3 className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center lg:text-left uppercase tracking-wide">
                  Grupos Parlamentarios
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-1 space-y-2 max-h-[400px] overflow-y-auto lg:pr-2 custom-scrollbar">
                  {parliamentaryGroups.map((group, idx) => {
                    const isHovered = hoveredGroup === group.name;

                    return (
                      <button
                        key={group.name}
                        onMouseEnter={() =>
                          !isMobile && setHoveredGroup(group.name)
                        }
                        onMouseLeave={() => !isMobile && setHoveredGroup(null)}
                        className={`
                          w-full group flex items-center gap-2 md:gap-3 p-2 rounded-lg border-2 transition-all duration-300
                          ${
                            isHovered
                              ? "border-indigo-500 shadow-lg bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800/50"
                          }
                        `}
                        style={{
                          animation: mounted
                            ? `fadeIn 0.5s ease-out ${0.3 + idx * 0.05}s both`
                            : "none",
                        }}
                      >
                        {group.logo_url ? (
                          <Image
                            src={group.logo_url}
                            alt={group.acronym || group.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-md flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 flex-shrink-0"
                            style={{ backgroundColor: group.color }}
                          >
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {group.acronym}
                          </div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                            {group.name}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-base font-bold text-slate-900 dark:text-white">
                            {group.seats}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {((group.seats / totalSeats) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {vacantSeats > 0 && (
                    <div className="flex items-center gap-2 md:gap-3 p-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30">
                      <div className="w-8 h-8 rounded-md bg-slate-400 dark:bg-slate-600 flex-shrink-0 flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">
                          Vacantes
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400">
                          Sin asignar
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-base font-bold text-slate-700 dark:text-slate-300">
                          {vacantSeats}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
              El Futuro en Disputa
            </h2>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              <span className="text-2xl md:text-3xl font-bold text-warning">
                {totalPartidos}
              </span>{" "}
              partidos compiten por representar tu voz en 2026. Aquí puedes
              conocerlos y decidir informado.
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
                  className="group p-0 relative overflow-hidden border-2 hover:border-primary/50 rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer text-left"
                  style={{
                    animation: mounted
                      ? `fadeInUp 0.6s ease-out ${idx * 0.1}s both`
                      : "none",
                  }}
                >
                  <CardHeader className="relative h-20 md:h-28 p-0 overflow-hidden">
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

                  <CardContent className="p-4 md:p-6 pt-6 md:pt-10">
                    <h3 className="font-bold text-sm md:text-base lg:text-lg text-foreground mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                      {partido.name}
                    </h3>

                    {partido.ideology && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                        {partido.ideology}
                      </p>
                    )}

                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap text-xs md:text-sm">
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

                    <div className="flex items-center justify-end pt-2 md:pt-3 border-t border-border">
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
