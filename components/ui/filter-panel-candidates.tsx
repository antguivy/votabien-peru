"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  X,
  ChevronDown,
  SlidersHorizontal,
  Check,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { PoliticalPartyBase } from "@/interfaces/political-party";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { Button } from "./button";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

interface NewFilterPanelProps {
  currentType: string;
  currentSearch: string;
  currentParty: string;
  currentDistrict: string;
  distritos: ElectoralDistrictBase[];
  parties: PoliticalPartyBase[];
}

const REGION_TYPES = ["SENADOR_REGIONAL", "DIPUTADO"];

// ─────────────────────────────────────────────
// Lista de partidos — logo izquierda + nombre derecha
// ─────────────────────────────────────────────

function PartyList({
  parties,
  selected,
  onSelect,
  filter,
}: {
  parties: PoliticalPartyBase[];
  selected: string;
  onSelect: (name: string) => void;
  filter?: string;
}) {
  const filtered = filter
    ? parties.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          (p.acronym ?? "").toLowerCase().includes(filter.toLowerCase()),
      )
    : parties;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Search className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Sin resultados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {filtered.map((party) => {
        const isSelected = selected === party.name;
        const initials = (party.acronym ?? party.name)
          .slice(0, 3)
          .toUpperCase();

        return (
          <button
            key={party.id}
            onClick={() => onSelect(isSelected ? "" : party.name)}
            className={cn(
              "relative flex flex-col items-center gap-2 w-full p-3 rounded-xl",
              "border-2 transition-all duration-150 active:scale-[0.97] outline-none",
              isSelected
                ? "border-brand/40 bg-brand/5"
                : "border-border/40 hover:border-border bg-card hover:bg-muted/30",
            )}
          >
            {/* Logo grande */}
            <div
              className={cn(
                "relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0",
                "border-2 flex items-center justify-center",
                isSelected ? "border-brand/25" : "border-border/25",
              )}
              style={{
                backgroundColor: party.logo_url
                  ? "white"
                  : (party.color_hex ?? "#e5e7eb"),
              }}
            >
              {party.logo_url ? (
                <Image
                  src={party.logo_url}
                  alt={party.name}
                  fill
                  className="object-contain p-1.5"
                />
              ) : (
                <span
                  className="text-[15px] font-black leading-none"
                  style={{ color: party.color_hex ? "#fff" : "#6b7280" }}
                >
                  {initials}
                </span>
              )}
            </div>

            {/* Siglas + nombre */}
            <div className="w-full text-center">
              <p
                className={cn(
                  "text-[11px] font-black uppercase tracking-wide leading-tight",
                  isSelected ? "text-brand" : "text-foreground",
                )}
              >
                {party.acronym ?? initials}
              </p>
              <p
                className={cn(
                  "text-[10px] leading-tight mt-0.5 line-clamp-2",
                  isSelected ? "text-brand/70" : "text-muted-foreground",
                )}
              >
                {party.name}
              </p>
            </div>

            {/* Indicador de selección */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Lista de distritos
// ─────────────────────────────────────────────

function DistrictList({
  districts,
  selected,
  onSelect,
  filter,
}: {
  districts: ElectoralDistrictBase[];
  selected: string;
  onSelect: (name: string) => void;
  filter?: string;
}) {
  const filtered = filter
    ? districts.filter((d) =>
        d.name.toLowerCase().includes(filter.toLowerCase()),
      )
    : districts;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <MapPin className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Sin resultados</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {filtered.map((d) => {
        const isSelected = selected === d.name;
        return (
          <button
            key={d.id}
            onClick={() => onSelect(isSelected ? "" : d.name)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-xl",
              "border transition-all duration-150 active:scale-[0.99] outline-none text-left",
              isSelected
                ? "border-brand/30 bg-brand/5"
                : "border-transparent hover:border-border/60 hover:bg-muted/50",
            )}
          >
            <MapPin
              className={cn(
                "w-4 h-4 flex-shrink-0",
                isSelected ? "text-brand" : "text-muted-foreground/50",
              )}
            />
            <span
              className={cn(
                "flex-1 text-sm font-medium",
                isSelected ? "text-brand font-semibold" : "text-foreground",
              )}
            >
              {d.name}
            </span>
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                isSelected ? "bg-brand border-brand" : "border-border/40",
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Buscador reutilizable para credenza/drawer
// ─────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 pl-10 pr-9 rounded-xl bg-muted/50 border-transparent focus-visible:border-brand/30 focus-visible:ring-0 focus-visible:bg-background"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export function NewFilterPanel({
  currentType,
  currentSearch,
  currentParty,
  currentDistrict,
  distritos,
  parties,
}: NewFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();

  const showRegion = REGION_TYPES.includes(currentType);
  const activeCount = [
    currentSearch ? 1 : 0,
    currentParty ? 1 : 0,
    currentDistrict && showRegion ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // ── Search desktop ──
  const [localSearch, setLocalSearch] = useState(currentSearch);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSearch(currentSearch);
  }, [currentSearch]);

  // ── Credenza desktop ──
  const [openCredenza, setOpenCredenza] = useState<"party" | "region" | null>(
    null,
  );
  const [desktopSearch, setDesktopSearch] = useState("");

  // ── Mobile drawer ──
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [subDrawer, setSubDrawer] = useState<"party" | "region" | null>(null);
  const [subSearch, setSubSearch] = useState("");

  // Pending state mobile
  const [pendingSearch, setPendingSearch] = useState(currentSearch);
  const [pendingParty, setPendingParty] = useState(currentParty);
  const [pendingDistrict, setPendingDistrict] = useState(currentDistrict);

  useEffect(() => {
    if (isDrawerOpen) {
      setPendingSearch(currentSearch);
      setPendingParty(currentParty);
      setPendingDistrict(currentDistrict);
    }
  }, [isDrawerOpen, currentSearch, currentParty, currentDistrict]);

  useEffect(() => {
    const handleToggle = () =>
      setTimeout(() => setIsDrawerOpen((prev) => !prev), 0);
    const handleOpenRegion = () => {
      setDesktopSearch("");
      setOpenCredenza("region");
    };
    window.addEventListener("toggle-filter-panel", handleToggle);
    window.addEventListener("open-desktop-region", handleOpenRegion);
    return () => {
      window.removeEventListener("toggle-filter-panel", handleToggle);
      window.removeEventListener("open-desktop-region", handleOpenRegion);
    };
  }, []);

  const districtOptions = useMemo(
    () => distritos.filter((d) => !d.is_national),
    [distritos],
  );

  // ─────────────────────────────────────────────
  // URL builder
  // ─────────────────────────────────────────────

  const buildUrl = useCallback(
    (search: string, party: string, district: string) => {
      const params = new URLSearchParams();
      params.set("type", currentType);
      if (search) params.set("search", search);
      if (party) params.set("parties", party);
      if (district && showRegion) params.set("districts", district);
      return `${pathname}?${params.toString()}`;
    },
    [currentType, pathname, showRegion],
  );

  // ─────────────────────────────────────────────
  // Desktop handlers
  // ─────────────────────────────────────────────

  const commitSearch = useCallback(
    (value: string) => {
      router.push(buildUrl(value, currentParty, currentDistrict));
    },
    [router, buildUrl, currentParty, currentDistrict],
  );

  const setParty = useCallback(
    (name: string) => {
      router.push(buildUrl(currentSearch, name, currentDistrict));
      setOpenCredenza(null);
      setDesktopSearch("");
    },
    [router, buildUrl, currentSearch, currentDistrict],
  );

  const setDistrict = useCallback(
    (name: string) => {
      router.push(buildUrl(currentSearch, currentParty, name));
      setOpenCredenza(null);
      setDesktopSearch("");
    },
    [router, buildUrl, currentSearch, currentParty],
  );

  const clearAll = useCallback(() => {
    router.push(buildUrl("", "", ""));
    setLocalSearch("");
  }, [router, buildUrl]);

  // ─────────────────────────────────────────────
  // Mobile handlers
  // ─────────────────────────────────────────────

  const applyMobile = useCallback(() => {
    router.push(buildUrl(pendingSearch, pendingParty, pendingDistrict));
    setIsDrawerOpen(false);
  }, [router, buildUrl, pendingSearch, pendingParty, pendingDistrict]);

  const clearMobile = useCallback(() => {
    setPendingSearch("");
    setPendingParty("");
    setPendingDistrict("");
  }, []);

  const pendingCount = [
    pendingSearch ? 1 : 0,
    pendingParty ? 1 : 0,
    pendingDistrict && showRegion ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Partido seleccionado actualmente (para mostrar logo en trigger)
  const selectedPartyData = currentParty
    ? parties.find((p) => p.name === currentParty)
    : null;
  const pendingPartyData = pendingParty
    ? parties.find((p) => p.name === pendingParty)
    : null;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <>
      {/* ══════════════════════════════════════════
          Mobile trigger
      ══════════════════════════════════════════ */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className={cn(
          "lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-2xl",
          "border-2 transition-all duration-200 active:scale-[0.99]",
          activeCount > 0
            ? "bg-brand/5 border-brand/30"
            : "bg-card border-border/50 hover:border-border",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
              activeCount > 0 ? "bg-brand/15" : "bg-muted",
            )}
          >
            <SlidersHorizontal
              className={cn(
                "w-3.5 h-3.5",
                activeCount > 0 ? "text-brand" : "text-muted-foreground",
              )}
            />
          </div>
          <span
            className={cn(
              "text-sm font-semibold",
              activeCount > 0 ? "text-brand" : "text-foreground/70",
            )}
          >
            {activeCount > 0 ? "Filtros activos" : "Buscar y filtrar"}
          </span>

          {/* Active filter pills preview */}
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 overflow-hidden">
              {currentSearch && (
                <span className="text-[10px] font-semibold text-brand/70 bg-brand/10 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                  {currentSearch}
                </span>
              )}
              {currentParty && (
                <span className="text-[10px] font-semibold text-brand/70 bg-brand/10 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                  {selectedPartyData?.acronym ?? currentParty}
                </span>
              )}
              {currentDistrict && showRegion && (
                <span className="text-[10px] font-semibold text-brand/70 bg-brand/10 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                  {currentDistrict}
                </span>
              )}
            </div>
          )}
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 flex-shrink-0 transition-colors",
            activeCount > 0 ? "text-brand/50" : "opacity-30",
          )}
        />
      </button>

      {/* ══════════════════════════════════════════
          Desktop controles
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchRef}
            type="text"
            placeholder="Buscar candidato… (Enter)"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitSearch(localSearch);
              }
            }}
            className="pl-9 pr-16 h-9 text-sm min-w-[240px] bg-background border-border/60 focus-visible:border-brand/50 focus-visible:ring-brand/20"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch("");
                  commitSearch("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => commitSearch(localSearch)}
              className={cn(
                "flex items-center justify-center h-6 px-2 rounded-md text-[10px] font-bold transition-all",
                localSearch !== currentSearch && localSearch
                  ? "bg-brand text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {localSearch !== currentSearch && localSearch ? "→" : "↵"}
            </button>
          </div>
        </div>

        {/* Región — Credenza */}
        {showRegion && (
          <Credenza
            open={openCredenza === "region"}
            onOpenChange={(o) => {
              setOpenCredenza(o ? "region" : null);
              if (!o) setDesktopSearch("");
            }}
          >
            <CredenzaTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium",
                  "border transition-all duration-200 outline-none",
                  currentDistrict
                    ? "bg-brand/8 border-brand/30 text-brand hover:bg-brand/12"
                    : "bg-background border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {currentDistrict ? (
                    <span className="max-w-[120px] truncate font-semibold">
                      {currentDistrict}
                    </span>
                  ) : (
                    "Región"
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    openCredenza === "region" && "rotate-180",
                  )}
                />
              </button>
            </CredenzaTrigger>
            <CredenzaContent className="sm:max-w-sm">
              <CredenzaHeader className="pb-0">
                <CredenzaTitle>Región donde votas</CredenzaTitle>
              </CredenzaHeader>
              <CredenzaBody className="pt-3 flex flex-col gap-3">
                <SearchBar
                  value={desktopSearch}
                  onChange={setDesktopSearch}
                  placeholder="Buscar región…"
                />
                <div className="max-h-[50vh] overflow-y-auto pr-1">
                  <DistrictList
                    districts={districtOptions}
                    selected={currentDistrict}
                    onSelect={(name) => setDistrict(name)}
                    filter={desktopSearch}
                  />
                </div>
              </CredenzaBody>
            </CredenzaContent>
          </Credenza>
        )}

        {/* Partido — Credenza */}
        <Credenza
          open={openCredenza === "party"}
          onOpenChange={(o) => {
            setOpenCredenza(o ? "party" : null);
            if (!o) setDesktopSearch("");
          }}
        >
          <CredenzaTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium",
                "border transition-all duration-200 outline-none",
                currentParty
                  ? "bg-brand/8 border-brand/30 text-brand hover:bg-brand/12"
                  : "bg-background border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {/* Logo del partido si hay uno seleccionado */}
              {selectedPartyData?.logo_url ? (
                <div className="relative w-5 h-5 rounded overflow-hidden bg-white border border-border/30 flex-shrink-0">
                  <Image
                    src={selectedPartyData.logo_url}
                    alt={selectedPartyData.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : null}
              <span>
                {currentParty ? (
                  <span className="max-w-[110px] truncate font-semibold">
                    {selectedPartyData?.acronym ?? currentParty}
                  </span>
                ) : (
                  "Partido"
                )}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  openCredenza === "party" && "rotate-180",
                )}
              />
            </button>
          </CredenzaTrigger>
          <CredenzaContent className="sm:max-w-md">
            <CredenzaHeader className="pb-0">
              <CredenzaTitle>Partido político</CredenzaTitle>
            </CredenzaHeader>
            <CredenzaBody className="pt-3 flex flex-col gap-3">
              <SearchBar
                value={desktopSearch}
                onChange={setDesktopSearch}
                placeholder="Buscar partido o siglas…"
              />
              <div className="max-h-[55vh] overflow-y-auto pr-1">
                <PartyList
                  parties={parties}
                  selected={currentParty}
                  onSelect={(p) => setParty(p)}
                  filter={desktopSearch}
                />
              </div>
            </CredenzaBody>
          </CredenzaContent>
        </Credenza>

        {/* Limpiar */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm text-muted-foreground hover:text-destructive border border-transparent hover:border-destructive/20 hover:bg-destructive/5 transition-all"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════
          Mobile drawer principal
      ══════════════════════════════════════════ */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={(o) => {
          setIsDrawerOpen(o);
          if (!o) {
            setSubDrawer(null);
            setSubSearch("");
          }
        }}
      >
        <DrawerContent
          noScroll
          className="flex flex-col max-h-[92dvh] outline-none"
        >
          {/* Header */}
          <DrawerHeader className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border/40">
            <DrawerTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-brand" />
              </div>
              <span className="text-xl font-bold tracking-tight">Filtros</span>
              {pendingCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Panel de filtros de búsqueda
            </DrawerDescription>
          </DrawerHeader>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
                Búsqueda
              </p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  placeholder="Nombre, apellido"
                  className="h-14 pl-12 pr-10 rounded-2xl text-base bg-muted/40 border-2 border-transparent focus-visible:border-brand/40 focus-visible:ring-0 focus-visible:bg-background transition-all"
                />
                {pendingSearch && (
                  <button
                    onClick={() => setPendingSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Región */}
            {showRegion && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
                  Región donde votas
                </p>
                <button
                  onClick={() => {
                    setSubSearch("");
                    setSubDrawer("region");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.99]",
                    pendingDistrict
                      ? "bg-brand/5 border-brand/25"
                      : "bg-card border-border/50 hover:border-border",
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                      pendingDistrict ? "bg-brand/15" : "bg-muted",
                    )}
                  >
                    <MapPin
                      className={cn(
                        "w-4 h-4",
                        pendingDistrict
                          ? "text-brand"
                          : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className={cn(
                        "text-[13px] font-semibold leading-tight",
                        pendingDistrict ? "text-brand" : "text-foreground",
                      )}
                    >
                      {pendingDistrict || "Selecciona tu región"}
                    </p>
                    {!pendingDistrict && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {districtOptions.length} regiones disponibles
                      </p>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                </button>
              </div>
            )}

            {/* Partido */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
                Partido político
              </p>
              <button
                onClick={() => {
                  setSubSearch("");
                  setSubDrawer("party");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.99]",
                  pendingParty
                    ? "bg-brand/5 border-brand/25"
                    : "bg-card border-border/50 hover:border-border",
                )}
              >
                {/* Logo o placeholder */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border flex items-center justify-center",
                    pendingParty
                      ? "border-brand/20"
                      : "border-border/40 bg-muted",
                  )}
                  style={{
                    backgroundColor: pendingPartyData?.logo_url
                      ? "white"
                      : (pendingPartyData?.color_hex ?? undefined),
                  }}
                >
                  {pendingPartyData?.logo_url ? (
                    <Image
                      src={pendingPartyData.logo_url}
                      alt={pendingPartyData.name}
                      width={36}
                      height={36}
                      className="object-contain p-0.5"
                    />
                  ) : pendingPartyData?.color_hex ? (
                    <span className="text-[10px] font-black text-white leading-none">
                      {(
                        pendingPartyData.acronym ?? pendingPartyData.name
                      ).slice(0, 3)}
                    </span>
                  ) : (
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <p
                    className={cn(
                      "text-[13px] font-semibold leading-tight truncate",
                      pendingParty ? "text-brand" : "text-foreground",
                    )}
                  >
                    {pendingParty || "Selecciona un partido"}
                  </p>
                  {!pendingParty && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {parties.length} partidos disponibles
                    </p>
                  )}
                  {pendingPartyData?.acronym && pendingParty && (
                    <p className="text-xs text-brand/60 mt-0.5">
                      {pendingPartyData.acronym}
                    </p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Footer — estado condicional */}
          <div className="flex-shrink-0 px-4 pt-3 pb-8 border-t border-border/40 bg-background space-y-2">
            {pendingCount > 0 ? (
              <>
                {/* Con filtros: Aplicar prominente + Limpiar secundario */}
                <Button
                  onClick={applyMobile}
                  className="w-full h-12 rounded-xl text-base font-bold bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand/90 active:scale-[0.98] transition-all"
                >
                  Aplicar filtros ({pendingCount})
                </Button>
                <Button
                  onClick={clearMobile}
                  variant={"ghost"}
                  className="w-full h-12 rounded-xl text-sm font-semibold text-muted-foreground hover:text-destructive border-2 border-border/40 hover:border-destructive/30 hover:bg-destructive/5 transition-all active:scale-[0.98]"
                >
                  Limpiar filtros
                </Button>
              </>
            ) : (
              <>
                {/* Sin filtros: Aplicar deshabilitado + Cerrar */}
                <Button
                  disabled
                  variant={"outline"}
                  className="w-full h-12 rounded-xl text-base font-bold bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                >
                  Aplicar filtros
                </Button>
                <Button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full h-12 bg-brand rounded-xl text-white text-base hover:bg-brand/90 transition-all active:scale-[0.98]"
                >
                  Cerrar
                </Button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ══════════════════════════════════════════
          Sub-drawer: Región
      ══════════════════════════════════════════ */}
      <Drawer
        open={subDrawer === "region"}
        onOpenChange={(o) => {
          if (!o) {
            setSubDrawer(null);
            setSubSearch("");
          }
        }}
      >
        <DrawerContent
          noScroll
          className="flex flex-col max-h-[88dvh] outline-none"
        >
          <DrawerHeader className="hidden">
            <DrawerTitle />
          </DrawerHeader>

          {/* Cabecera */}
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-4 border-b border-border/40">
            <button
              onClick={() => {
                setSubDrawer(null);
                setSubSearch("");
              }}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <p className="text-base font-bold">Región donde votas</p>
              {pendingDistrict && (
                <p className="text-xs text-brand mt-0.5">
                  {pendingDistrict} seleccionado
                </p>
              )}
            </div>
            {pendingDistrict && (
              <button
                onClick={() => setPendingDistrict("")}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/5"
              >
                Quitar
              </button>
            )}
          </div>

          {/* Buscador */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-border/40">
            <SearchBar
              value={subSearch}
              onChange={setSubSearch}
              placeholder="Buscar región…"
            />
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <DistrictList
              districts={districtOptions}
              selected={pendingDistrict}
              onSelect={(name) => {
                setPendingDistrict(name);
                setSubDrawer(null);
                setSubSearch("");
              }}
              filter={subSearch}
            />
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 pt-3 pb-8 border-t border-border/40 bg-background">
            <Button
              onClick={() => {
                setSubDrawer(null);
                setSubSearch("");
              }}
              className="w-full h-12 rounded-xl text-base font-bold bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20 active:scale-[0.98] transition-all"
            >
              Listo
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ══════════════════════════════════════════
          Sub-drawer: Partido
      ══════════════════════════════════════════ */}
      <Drawer
        open={subDrawer === "party"}
        onOpenChange={(o) => {
          if (!o) {
            setSubDrawer(null);
            setSubSearch("");
          }
        }}
      >
        <DrawerContent
          noScroll
          className="flex flex-col max-h-[88dvh] outline-none"
        >
          <DrawerHeader className="hidden">
            <DrawerTitle />
          </DrawerHeader>

          {/* Cabecera */}
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-4 border-b border-border/40">
            <button
              onClick={() => {
                setSubDrawer(null);
                setSubSearch("");
              }}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <p className="text-base font-bold">Partido político</p>
              {pendingParty && (
                <p className="text-xs text-brand mt-0.5 truncate">
                  {pendingParty}
                </p>
              )}
            </div>
            {pendingParty && (
              <button
                onClick={() => setPendingParty("")}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/5"
              >
                Quitar
              </button>
            )}
          </div>

          {/* Buscador */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-border/40">
            <SearchBar
              value={subSearch}
              onChange={setSubSearch}
              placeholder="Buscar partido o siglas…"
            />
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <PartyList
              parties={parties}
              selected={pendingParty}
              onSelect={(name) => setPendingParty(name)}
              filter={subSearch}
            />
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 pt-3 pb-8 border-t border-border/40 bg-background">
            <Button
              onClick={() => {
                setSubDrawer(null);
                setSubSearch("");
              }}
              className="w-full h-12 rounded-xl text-base font-bold bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20 active:scale-[0.98] transition-all"
            >
              Listo
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
